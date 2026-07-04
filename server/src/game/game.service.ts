import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { PokerTable } from '../tables/table.entity';
import { Game, GamePhase } from './game.entity';
import { PlayerSeat } from './player-seat.entity';
import {
  Card,
  Pot,
  PotContribution,
  awardPot,
  calculateSidePots,
  computeRake,
  createDeck,
  dealCards,
  formatCard,
  getUncalledBet,
  shuffleDeck,
} from './poker';

export const TURN_TIME_MS = 30000;

const BETTING_PHASES: GamePhase[] = ['preflop', 'flop', 'turn', 'river'];

export type PlayerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all_in';

export interface ActionOptions {
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  canBet: boolean;
  canRaise: boolean;
  minBet: number;
  minRaise: number;
  maxBet: number;
  allInAmount: number;
}

export interface HandResult {
  handNumber: number;
  winners: { userId: string; displayName: string; amount: number; handName: string }[];
  pots: Pot[];
  rake: number;
  revealedCards: Record<string, Card[]>;
  communityCards: Card[];
}

export interface ActionOutcome {
  tableId: string;
  handResult: HandResult | null;
}

export interface StartHandOutcome {
  tableId: string;
  dealt: { userId: string; cards: Card[] }[];
  handResult: HandResult | null;
}

@Injectable()
export class GameService {
  private handLogs = new Map<string, string[]>();
  private turnDeadlines = new Map<string, number>();

  constructor(
    @InjectRepository(Game) private gamesRepository: Repository<Game>,
    @InjectRepository(PlayerSeat) private seatsRepository: Repository<PlayerSeat>,
    @InjectRepository(PokerTable) private tablesRepository: Repository<PokerTable>,
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  createDeck(): Card[] {
    return createDeck();
  }

  shuffleDeck(deck: Card[]): Card[] {
    return shuffleDeck(deck);
  }

  dealCards(deck: Card[], count: number): [Card[], Card[]] {
    return dealCards(deck, count);
  }

  calculateSidePots(seats: PlayerSeat[]): Pot[] {
    return calculateSidePots(this.toContributions(seats));
  }

  isBettingRoundComplete(seats: PlayerSeat[], game: Game): boolean {
    const activeSeats = seats.filter((seat) => seat.status === 'active');
    return activeSeats.every(
      (seat) => seat.hasActed && seat.currentBet === game.currentBetAmount,
    );
  }

  getActionOptions(seat: PlayerSeat, game: Game): ActionOptions {
    const toCall = Math.max(0, game.currentBetAmount - seat.currentBet);
    const callAmount = Math.min(toCall, seat.stackSize);
    const allInAmount = seat.currentBet + seat.stackSize;
    return {
      canCheck: toCall === 0,
      canCall: toCall > 0 && seat.stackSize > 0,
      callAmount,
      canBet: game.currentBetAmount === 0 && seat.stackSize > 0,
      canRaise:
        game.currentBetAmount > 0 && !seat.hasActed && seat.stackSize > toCall,
      minBet: Math.min(game.lastRaiseAmount, seat.stackSize),
      minRaise: Math.min(game.currentBetAmount + game.lastRaiseAmount, allInAmount),
      maxBet: allInAmount,
      allInAmount,
    };
  }

  async getTableState(tableId: string, requestingUserId: string) {
    const table = await this.getTable(tableId);
    const game = await this.getOrCreateGame(tableId);
    const seats = await this.getSeats(game.id);
    return {
      table: {
        id: table.id,
        name: table.name,
        maxSeats: table.maxSeats,
        smallBlind: table.smallBlind,
        bigBlind: table.bigBlind,
        minBuyIn: table.minBuyIn,
        maxBuyIn: table.maxBuyIn,
        rakePercent: table.rakePercent,
        rakeCap: table.rakeCap,
        status: table.status,
      },
      game: {
        id: game.id,
        phase: game.phase,
        handNumber: game.handNumber,
        pot: game.pot,
        communityCards: JSON.parse(game.communityCards) as Card[],
        dealerPosition: game.dealerPosition,
        currentTurnUserId: game.currentTurnUserId,
        currentBetAmount: game.currentBetAmount,
        turnDeadline: game.currentTurnUserId ? this.turnDeadlines.get(tableId) ?? null : null,
      },
      seats: seats.map((seat) => ({
        userId: seat.userId,
        username: seat.username,
        displayName: seat.displayName,
        seatPosition: seat.seatPosition,
        stackSize: seat.stackSize,
        currentBet: seat.currentBet,
        totalBetInHand: seat.totalBetInHand,
        status: seat.status,
        isDealer: seat.isDealer,
        isSmallBlind: seat.isSmallBlind,
        isBigBlind: seat.isBigBlind,
        isConnected: seat.isConnected,
        holeCards:
          seat.userId === requestingUserId && seat.holeCards
            ? (JSON.parse(seat.holeCards) as Card[])
            : null,
      })),
      actionLog: this.handLogs.get(tableId) ?? [],
    };
  }

  async addPlayerToTable(tableId: string, userId: string, buyIn: number) {
    const table = await this.getTable(tableId);
    if (table.status !== 'active') {
      throw new BadRequestException('Mesa não está ativa');
    }
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new NotFoundException('Usuário não encontrado');
    }
    const existingSeat = await this.seatsRepository.findOne({ where: { userId } });
    if (existingSeat) {
      throw new BadRequestException('Você já está sentado em uma mesa');
    }
    const normalizedBuyIn = Math.floor(Number(buyIn));
    if (!Number.isFinite(normalizedBuyIn) || normalizedBuyIn < table.minBuyIn || normalizedBuyIn > table.maxBuyIn) {
      throw new BadRequestException(
        `Buy-in deve estar entre ${table.minBuyIn} e ${table.maxBuyIn}`,
      );
    }
    if (user.chips < normalizedBuyIn) {
      throw new BadRequestException('Saldo insuficiente para este buy-in');
    }
    const game = await this.getOrCreateGame(tableId);
    const seats = await this.getSeats(game.id);
    if (seats.length >= table.maxSeats) {
      throw new BadRequestException('Mesa cheia');
    }
    const occupiedPositions = new Set(seats.map((seat) => seat.seatPosition));
    let position = 0;
    while (occupiedPositions.has(position)) {
      position++;
    }
    user.chips -= normalizedBuyIn;
    await this.usersRepository.save(user);
    const seat = this.seatsRepository.create({
      gameId: game.id,
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      seatPosition: position,
      stackSize: normalizedBuyIn,
      status: 'waiting',
      isConnected: true,
    });
    await this.seatsRepository.save(seat);
    this.pushLog(tableId, `${user.displayName} sentou no assento ${position + 1} (buy-in ${normalizedBuyIn})`);
    return seat;
  }

  async removePlayerFromTable(userId: string, tableId: string): Promise<ActionOutcome> {
    const game = await this.getOrCreateGame(tableId);
    const seat = await this.seatsRepository.findOne({ where: { gameId: game.id, userId } });
    if (!seat) {
      return { tableId, handResult: null };
    }
    const inBettingPhase = BETTING_PHASES.includes(game.phase);
    if (inBettingPhase && seat.status === 'all_in') {
      throw new BadRequestException('Você está all-in; aguarde o fim da mão');
    }
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (inBettingPhase && seat.status === 'active') {
      // O assento fica na mesa como "folded" até o fim da mão para que o
      // totalBetInHand dele continue contando nos potes; endHand remove.
      user.chips += seat.stackSize;
      seat.stackSize = 0;
      seat.status = 'folded';
      seat.hasActed = true;
      seat.isConnected = false;
      await this.usersRepository.save(user);
      await this.seatsRepository.save(seat);
      this.pushLog(tableId, `${seat.displayName} saiu da mesa`);
      return this.resolveAfterAction(game.id, userId);
    }

    user.chips += seat.stackSize;
    await this.usersRepository.save(user);
    await this.seatsRepository.remove(seat);
    this.pushLog(tableId, `${seat.displayName} saiu da mesa`);
    return { tableId, handResult: null };
  }

  async startNewHand(tableId: string): Promise<StartHandOutcome> {
    const table = await this.getTable(tableId);
    if (table.status !== 'active') {
      throw new BadRequestException('Mesa não está ativa');
    }
    const game = await this.getOrCreateGame(tableId);
    if (game.phase !== 'waiting') {
      throw new BadRequestException('Já existe uma mão em andamento');
    }
    const seats = await this.getSeats(game.id);
    const participants = seats.filter((seat) => seat.stackSize > 0 && seat.isConnected);
    if (participants.length < 2) {
      throw new BadRequestException('São necessários pelo menos 2 jogadores');
    }

    this.handLogs.set(tableId, []);
    game.handNumber += 1;

    const positions = participants.map((seat) => seat.seatPosition).sort((a, b) => a - b);
    const dealerPosition = this.nextPosition(positions, game.dealerPosition);
    game.dealerPosition = dealerPosition;

    const isHeadsUp = participants.length === 2;
    const smallBlindPosition = isHeadsUp
      ? dealerPosition
      : this.nextPosition(positions, dealerPosition);
    const bigBlindPosition = this.nextPosition(positions, smallBlindPosition);

    for (const seat of participants) {
      seat.status = 'active';
      seat.currentBet = 0;
      seat.totalBetInHand = 0;
      seat.hasActed = false;
      seat.isDealer = seat.seatPosition === dealerPosition;
      seat.isSmallBlind = seat.seatPosition === smallBlindPosition;
      seat.isBigBlind = seat.seatPosition === bigBlindPosition;
    }

    const dealerSeat = participants.find((seat) => seat.isDealer);
    this.pushLog(tableId, `Mão #${game.handNumber} iniciada — dealer: ${dealerSeat.displayName}`);

    let pot = 0;
    for (const seat of participants) {
      const blind = seat.isSmallBlind ? table.smallBlind : seat.isBigBlind ? table.bigBlind : 0;
      if (blind > 0) {
        const paid = Math.min(blind, seat.stackSize);
        seat.stackSize -= paid;
        seat.currentBet = paid;
        seat.totalBetInHand = paid;
        pot += paid;
        if (seat.stackSize === 0) {
          seat.status = 'all_in';
        }
        this.pushLog(
          tableId,
          `${seat.displayName} posta ${seat.isSmallBlind ? 'small blind' : 'big blind'} ${paid}`,
        );
      }
    }

    let deck = shuffleDeck(createDeck());
    const dealt: { userId: string; cards: Card[] }[] = [];
    for (const seat of this.orderFromLeftOfDealer(participants, dealerPosition, table.maxSeats)) {
      const [cards, rest] = dealCards(deck, 2);
      deck = rest;
      seat.holeCards = JSON.stringify(cards);
      dealt.push({ userId: seat.userId, cards });
    }

    game.phase = 'preflop';
    game.pot = pot;
    game.currentBetAmount = table.bigBlind;
    game.lastRaiseAmount = table.bigBlind;
    game.deck = JSON.stringify(deck);
    game.communityCards = '[]';
    game.startedAt = new Date();
    game.currentTurnUserId = null;

    const firstToAct = this.firstActiveAfter(participants, bigBlindPosition, table.maxSeats);
    await this.seatsRepository.save(seats);

    if (firstToAct) {
      game.currentTurnUserId = firstToAct.userId;
      this.setTurnDeadline(tableId);
      await this.gamesRepository.save(game);
      return { tableId, dealt, handResult: null };
    }

    await this.gamesRepository.save(game);
    const handResult = await this.advancePhase(game.id);
    return { tableId, dealt, handResult };
  }

  async processAction(
    gameId: string,
    userId: string,
    action: PlayerAction,
    amount?: number,
  ): Promise<ActionOutcome> {
    const game = await this.getGameById(gameId);
    if (!BETTING_PHASES.includes(game.phase)) {
      throw new BadRequestException('Não há rodada de apostas em andamento');
    }
    if (game.currentTurnUserId !== userId) {
      throw new BadRequestException('Não é a sua vez');
    }
    const seats = await this.getSeats(game.id);
    const seat = seats.find((s) => s.userId === userId);
    if (!seat || seat.status !== 'active') {
      throw new BadRequestException('Você não pode agir nesta mão');
    }

    let normalizedAction = action;
    if (normalizedAction === 'bet' && game.currentBetAmount > 0) {
      normalizedAction = 'raise';
    }
    if (normalizedAction === 'raise' && game.currentBetAmount === 0) {
      normalizedAction = 'bet';
    }

    const options = this.getActionOptions(seat, game);
    const tableId = game.tableId;

    switch (normalizedAction) {
      case 'fold': {
        seat.status = 'folded';
        this.pushLog(tableId, `${seat.displayName} desiste (fold)`);
        break;
      }
      case 'check': {
        if (!options.canCheck) {
          throw new BadRequestException('Não é possível dar check com aposta pendente');
        }
        this.pushLog(tableId, `${seat.displayName} passa (check)`);
        break;
      }
      case 'call': {
        if (!options.canCall) {
          throw new BadRequestException('Não há aposta para pagar');
        }
        const paid = this.payFromStack(seat, options.callAmount);
        game.pot += paid;
        this.pushLog(
          tableId,
          seat.stackSize === 0
            ? `${seat.displayName} paga ${paid} e está all-in`
            : `${seat.displayName} paga ${paid} (call)`,
        );
        break;
      }
      case 'bet': {
        if (!options.canBet) {
          throw new BadRequestException('Não é possível apostar agora');
        }
        const betAmount = this.normalizeAmount(amount);
        if (betAmount > seat.stackSize) {
          throw new BadRequestException('Aposta maior que o stack');
        }
        const isAllIn = betAmount === seat.stackSize;
        if (betAmount < options.minBet && !isAllIn) {
          throw new BadRequestException(`Aposta mínima é ${options.minBet}`);
        }
        const paid = this.payFromStack(seat, betAmount);
        game.pot += paid;
        game.currentBetAmount = seat.currentBet;
        // Aposta cheia reabre a ação; all-in abaixo do mínimo não permite
        // re-raise de quem já agiu (raise incompleto).
        if (seat.currentBet >= game.lastRaiseAmount) {
          game.lastRaiseAmount = seat.currentBet;
          this.reopenAction(seats, seat.userId);
        }
        this.pushLog(
          tableId,
          isAllIn
            ? `${seat.displayName} aposta ${paid} e está all-in`
            : `${seat.displayName} aposta ${paid}`,
        );
        break;
      }
      case 'raise': {
        const raiseTo = this.normalizeAmount(amount);
        this.applyRaise(game, seats, seat, options, raiseTo, tableId);
        break;
      }
      case 'all_in': {
        if (options.allInAmount <= 0) {
          throw new BadRequestException('Você não tem fichas');
        }
        if (game.currentBetAmount === 0) {
          const paid = this.payFromStack(seat, seat.stackSize);
          game.pot += paid;
          game.currentBetAmount = seat.currentBet;
          if (seat.currentBet >= game.lastRaiseAmount) {
            game.lastRaiseAmount = seat.currentBet;
            this.reopenAction(seats, seat.userId);
          }
          this.pushLog(tableId, `${seat.displayName} aposta ${paid} e está all-in`);
        } else if (options.allInAmount <= game.currentBetAmount) {
          const paid = this.payFromStack(seat, seat.stackSize);
          game.pot += paid;
          this.pushLog(tableId, `${seat.displayName} paga ${paid} e está all-in`);
        } else {
          this.applyRaise(game, seats, seat, options, options.allInAmount, tableId);
        }
        break;
      }
      default:
        throw new BadRequestException('Ação inválida');
    }

    seat.hasActed = true;
    if (seat.status === 'active' && seat.stackSize === 0) {
      seat.status = 'all_in';
    }
    await this.seatsRepository.save(seats);
    await this.gamesRepository.save(game);

    return this.resolveAfterAction(game.id, userId);
  }

  async advanceTurn(gameId: string): Promise<void> {
    const game = await this.getGameById(gameId);
    const table = await this.getTable(game.tableId);
    const seats = await this.getSeats(game.id);
    const currentSeat = seats.find((seat) => seat.userId === game.currentTurnUserId);
    const fromPosition = currentSeat ? currentSeat.seatPosition : game.dealerPosition;
    const next = this.firstActiveAfter(seats, fromPosition, table.maxSeats);
    if (!next) {
      return;
    }
    game.currentTurnUserId = next.userId;
    this.setTurnDeadline(game.tableId);
    await this.gamesRepository.save(game);
  }

  async advancePhase(gameId: string): Promise<HandResult | null> {
    const game = await this.getGameById(gameId);
    const table = await this.getTable(game.tableId);

    while (true) {
      const seats = await this.getSeats(game.id);
      for (const seat of seats) {
        seat.currentBet = 0;
        if (seat.status === 'active') {
          seat.hasActed = false;
        }
      }
      game.currentBetAmount = 0;
      game.lastRaiseAmount = table.bigBlind;
      game.currentTurnUserId = null;

      let deck = JSON.parse(game.deck) as Card[];
      const community = JSON.parse(game.communityCards) as Card[];

      if (game.phase === 'preflop') {
        const [cards, rest] = dealCards(deck, 3);
        deck = rest;
        community.push(...cards);
        game.phase = 'flop';
        this.pushLog(game.tableId, `Flop: ${community.map(formatCard).join(' ')}`);
      } else if (game.phase === 'flop') {
        const [cards, rest] = dealCards(deck, 1);
        deck = rest;
        community.push(...cards);
        game.phase = 'turn';
        this.pushLog(game.tableId, `Turn: ${community.map(formatCard).join(' ')}`);
      } else if (game.phase === 'turn') {
        const [cards, rest] = dealCards(deck, 1);
        deck = rest;
        community.push(...cards);
        game.phase = 'river';
        this.pushLog(game.tableId, `River: ${community.map(formatCard).join(' ')}`);
      } else {
        game.phase = 'showdown';
      }

      game.deck = JSON.stringify(deck);
      game.communityCards = JSON.stringify(community);
      await this.seatsRepository.save(seats);
      await this.gamesRepository.save(game);

      if (game.phase === 'showdown') {
        return this.handleShowdown(game.id);
      }

      const activeSeats = seats.filter((seat) => seat.status === 'active');
      if (activeSeats.length >= 2) {
        const first = this.firstActiveAfter(seats, game.dealerPosition, table.maxSeats);
        game.currentTurnUserId = first ? first.userId : null;
        if (game.currentTurnUserId) {
          this.setTurnDeadline(game.tableId);
        }
        await this.gamesRepository.save(game);
        return null;
      }
    }
  }

  async handleShowdown(gameId: string): Promise<HandResult> {
    const game = await this.getGameById(gameId);
    const table = await this.getTable(game.tableId);
    const seats = await this.getSeats(game.id);
    const tableId = game.tableId;
    const communityCards = JSON.parse(game.communityCards) as Card[];

    const contributions = this.toContributions(seats);

    const uncalled = getUncalledBet(contributions);
    if (uncalled) {
      const refundSeat = seats.find((seat) => seat.userId === uncalled.userId);
      refundSeat.stackSize += uncalled.amount;
      game.pot -= uncalled.amount;
      const contribution = contributions.find((c) => c.userId === uncalled.userId);
      contribution.amount -= uncalled.amount;
    }

    const pots = calculateSidePots(contributions);
    const totalPot = pots.reduce((sum, pot) => sum + pot.amount, 0);
    const flopDealt = communityCards.length >= 3;
    const rake = computeRake(totalPot, table.rakePercent, table.rakeCap * table.bigBlind, flopDealt);

    let rakeRemaining = rake;
    for (const pot of pots) {
      const taken = Math.min(pot.amount, rakeRemaining);
      pot.amount -= taken;
      rakeRemaining -= taken;
      if (rakeRemaining === 0) {
        break;
      }
    }
    if (rake > 0) {
      table.totalRake += rake;
      await this.tablesRepository.save(table);
      this.pushLog(tableId, `Rake da mão: ${rake}`);
    }

    const inHand = seats.filter((seat) => seat.status === 'active' || seat.status === 'all_in');
    const positionOrder = this.orderFromLeftOfDealer(inHand, game.dealerPosition, table.maxSeats).map(
      (seat) => seat.userId,
    );
    const showdownSeats = inHand.map((seat) => ({
      userId: seat.userId,
      holeCards: JSON.parse(seat.holeCards) as Card[],
    }));

    const winnerTotals = new Map<string, { amount: number; handName: string }>();
    for (const pot of pots) {
      const awards = awardPot(pot, showdownSeats, communityCards, positionOrder);
      for (const award of awards) {
        const seat = seats.find((s) => s.userId === award.userId);
        seat.stackSize += award.amount;
        const existing = winnerTotals.get(award.userId);
        winnerTotals.set(award.userId, {
          amount: (existing?.amount ?? 0) + award.amount,
          handName: award.handName || existing?.handName || '',
        });
      }
    }

    const winners = [...winnerTotals.entries()].map(([userId, total]) => {
      const seat = seats.find((s) => s.userId === userId);
      this.pushLog(
        tableId,
        `${seat.displayName} ganha ${total.amount}${total.handName ? ` (${total.handName})` : ''}`,
      );
      return {
        userId,
        displayName: seat.displayName,
        amount: total.amount,
        handName: total.handName,
      };
    });

    const revealedCards: Record<string, Card[]> = {};
    if (inHand.length >= 2) {
      for (const showdownSeat of showdownSeats) {
        revealedCards[showdownSeat.userId] = showdownSeat.holeCards;
      }
    }

    const result: HandResult = {
      handNumber: game.handNumber,
      winners,
      pots,
      rake,
      revealedCards,
      communityCards,
    };

    await this.endHand(game, seats);
    return result;
  }

  async autoActCurrentTurn(tableId: string): Promise<{
    outcome: ActionOutcome;
    action: 'check' | 'fold';
    userId: string;
  } | null> {
    const game = await this.getOrCreateGame(tableId);
    if (!game.currentTurnUserId || !BETTING_PHASES.includes(game.phase)) {
      return null;
    }
    const seats = await this.getSeats(game.id);
    const seat = seats.find((s) => s.userId === game.currentTurnUserId);
    if (!seat) {
      return null;
    }
    const options = this.getActionOptions(seat, game);
    const action = options.canCheck ? 'check' : 'fold';
    const userId = seat.userId;
    this.pushLog(tableId, `${seat.displayName} não agiu a tempo`);
    const outcome = await this.processAction(game.id, userId, action);
    return { outcome, action, userId };
  }

  async canStartHand(tableId: string): Promise<boolean> {
    const table = await this.tablesRepository.findOne({ where: { id: tableId } });
    if (!table || table.status !== 'active') {
      return false;
    }
    const game = await this.getOrCreateGame(tableId);
    if (game.phase !== 'waiting') {
      return false;
    }
    const seats = await this.getSeats(game.id);
    return seats.filter((seat) => seat.stackSize > 0 && seat.isConnected).length >= 2;
  }

  async findSeatLocation(userId: string): Promise<{ seat: PlayerSeat; tableId: string } | null> {
    const seat = await this.seatsRepository.findOne({ where: { userId } });
    if (!seat) {
      return null;
    }
    const game = await this.gamesRepository.findOne({ where: { id: seat.gameId } });
    if (!game) {
      return null;
    }
    return { seat, tableId: game.tableId };
  }

  async setSeatConnected(userId: string, connected: boolean): Promise<string | null> {
    const location = await this.findSeatLocation(userId);
    if (!location) {
      return null;
    }
    location.seat.isConnected = connected;
    await this.seatsRepository.save(location.seat);
    return location.tableId;
  }

  async getCurrentTurnInfo(tableId: string) {
    const game = await this.getOrCreateGame(tableId);
    if (!game.currentTurnUserId || !BETTING_PHASES.includes(game.phase)) {
      return null;
    }
    const seats = await this.getSeats(game.id);
    const seat = seats.find((s) => s.userId === game.currentTurnUserId);
    if (!seat) {
      return null;
    }
    return {
      userId: seat.userId,
      options: this.getActionOptions(seat, game),
      deadline: this.turnDeadlines.get(tableId) ?? null,
    };
  }

  async getSeatUserIds(tableId: string): Promise<string[]> {
    const game = await this.getOrCreateGame(tableId);
    const seats = await this.getSeats(game.id);
    return seats.map((seat) => seat.userId);
  }

  async getHoleCards(tableId: string, userId: string): Promise<Card[] | null> {
    const game = await this.getOrCreateGame(tableId);
    const seat = await this.seatsRepository.findOne({ where: { gameId: game.id, userId } });
    if (!seat || !seat.holeCards) {
      return null;
    }
    return JSON.parse(seat.holeCards) as Card[];
  }

  async closeTable(tableId: string): Promise<string[]> {
    const game = await this.getOrCreateGame(tableId);
    const seats = await this.getSeats(game.id);
    const affectedUserIds: string[] = [];
    for (const seat of seats) {
      const user = await this.usersRepository.findOne({ where: { id: seat.userId } });
      if (user) {
        user.chips += seat.stackSize + seat.totalBetInHand;
        await this.usersRepository.save(user);
      }
      affectedUserIds.push(seat.userId);
      await this.seatsRepository.remove(seat);
    }
    game.phase = 'waiting';
    game.pot = 0;
    game.currentBetAmount = 0;
    game.lastRaiseAmount = 0;
    game.currentTurnUserId = null;
    game.communityCards = '[]';
    game.deck = '[]';
    await this.gamesRepository.save(game);
    this.turnDeadlines.delete(tableId);
    this.handLogs.delete(tableId);
    return affectedUserIds;
  }

  async getSessionReport() {
    const users = await this.usersRepository.find({ where: { role: 'player' } });
    const managed = await this.usersRepository.find({ where: { role: 'manager' } });
    const allPlayers = [...users, ...managed].filter((user) => user.isActive);
    const seats = await this.seatsRepository.find();
    const games = await this.gamesRepository.find();
    const tables = await this.tablesRepository.find();
    const tableByGame = new Map(games.map((game) => [game.id, game.tableId]));
    const tableNames = new Map(tables.map((table) => [table.id, table.name]));

    const players = allPlayers.map((user) => {
      const seat = seats.find((s) => s.userId === user.id);
      const stackInPlay = seat ? seat.stackSize + seat.totalBetInHand : 0;
      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        chips: user.chips,
        stackInPlay,
        total: user.chips + stackInPlay,
        seatedAt: seat ? tableNames.get(tableByGame.get(seat.gameId)) ?? null : null,
      };
    });

    return {
      players,
      tables: tables.map((table) => ({
        id: table.id,
        name: table.name,
        status: table.status,
        totalRake: table.totalRake,
      })),
      totalRake: tables.reduce((sum, table) => sum + table.totalRake, 0),
    };
  }

  private async resolveAfterAction(gameId: string, actedUserId: string): Promise<ActionOutcome> {
    const game = await this.getGameById(gameId);
    const seats = await this.getSeats(game.id);
    const tableId = game.tableId;
    const inHand = seats.filter((seat) => seat.status === 'active' || seat.status === 'all_in');

    if (inHand.length === 1) {
      const handResult = await this.handleShowdown(game.id);
      return { tableId, handResult };
    }
    if (this.isBettingRoundComplete(seats, game)) {
      const handResult = await this.advancePhase(game.id);
      return { tableId, handResult };
    }
    if (game.currentTurnUserId === actedUserId) {
      await this.advanceTurn(game.id);
    }
    return { tableId, handResult: null };
  }

  private applyRaise(
    game: Game,
    seats: PlayerSeat[],
    seat: PlayerSeat,
    options: ActionOptions,
    raiseTo: number,
    tableId: string,
  ) {
    if (!options.canRaise) {
      throw new BadRequestException('Você não pode aumentar agora; pague ou desista');
    }
    if (raiseTo <= game.currentBetAmount) {
      throw new BadRequestException('O aumento deve ser maior que a aposta atual');
    }
    const payNeeded = raiseTo - seat.currentBet;
    if (payNeeded > seat.stackSize) {
      throw new BadRequestException('Fichas insuficientes para este aumento');
    }
    const isAllIn = payNeeded === seat.stackSize;
    const increment = raiseTo - game.currentBetAmount;
    // Raise abaixo do mínimo só é permitido como all-in e não reabre a ação
    // de quem já agiu nesta rodada.
    if (increment < game.lastRaiseAmount && !isAllIn) {
      throw new BadRequestException(`Aumento mínimo é para ${options.minRaise}`);
    }
    const paid = this.payFromStack(seat, payNeeded);
    game.pot += paid;
    game.currentBetAmount = raiseTo;
    if (increment >= game.lastRaiseAmount) {
      game.lastRaiseAmount = increment;
      this.reopenAction(seats, seat.userId);
    }
    this.pushLog(
      tableId,
      isAllIn
        ? `${seat.displayName} aumenta para ${raiseTo} e está all-in`
        : `${seat.displayName} aumenta para ${raiseTo}`,
    );
  }

  private async endHand(game: Game, seats: PlayerSeat[]) {
    for (const seat of seats) {
      seat.currentBet = 0;
      seat.totalBetInHand = 0;
      seat.holeCards = null;
      seat.hasActed = false;
      seat.isDealer = false;
      seat.isSmallBlind = false;
      seat.isBigBlind = false;
      if (!seat.isConnected || seat.stackSize <= 0) {
        const user = await this.usersRepository.findOne({ where: { id: seat.userId } });
        if (user && seat.stackSize > 0) {
          user.chips += seat.stackSize;
          await this.usersRepository.save(user);
        }
        if (seat.stackSize <= 0 && seat.isConnected) {
          this.pushLog(game.tableId, `${seat.displayName} ficou sem fichas e saiu da mesa`);
        }
        await this.seatsRepository.remove(seat);
        continue;
      }
      seat.status = 'waiting';
      await this.seatsRepository.save(seat);
    }
    game.phase = 'waiting';
    game.pot = 0;
    game.currentBetAmount = 0;
    game.lastRaiseAmount = 0;
    game.currentTurnUserId = null;
    game.communityCards = '[]';
    game.deck = '[]';
    await this.gamesRepository.save(game);
    this.turnDeadlines.delete(game.tableId);
  }

  private payFromStack(seat: PlayerSeat, amount: number): number {
    const paid = Math.min(amount, seat.stackSize);
    seat.stackSize -= paid;
    seat.currentBet += paid;
    seat.totalBetInHand += paid;
    return paid;
  }

  private reopenAction(seats: PlayerSeat[], actorUserId: string) {
    for (const seat of seats) {
      if (seat.userId !== actorUserId && seat.status === 'active') {
        seat.hasActed = false;
      }
    }
  }

  private normalizeAmount(amount?: number): number {
    const value = Math.floor(Number(amount));
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException('Valor inválido');
    }
    return value;
  }

  private toContributions(seats: PlayerSeat[]): PotContribution[] {
    return seats
      .filter((seat) => seat.totalBetInHand > 0)
      .map((seat) => ({
        userId: seat.userId,
        amount: seat.totalBetInHand,
        folded: seat.status !== 'active' && seat.status !== 'all_in',
      }));
  }

  private orderFromLeftOfDealer(
    seats: PlayerSeat[],
    dealerPosition: number,
    maxSeats: number,
  ): PlayerSeat[] {
    const distance = (position: number) =>
      ((position - dealerPosition - 1) % maxSeats + maxSeats) % maxSeats;
    return [...seats].sort((a, b) => distance(a.seatPosition) - distance(b.seatPosition));
  }

  private firstActiveAfter(
    seats: PlayerSeat[],
    fromPosition: number,
    maxSeats: number,
  ): PlayerSeat | null {
    const activeSeats = seats.filter((seat) => seat.status === 'active');
    if (activeSeats.length === 0) {
      return null;
    }
    const distance = (position: number) =>
      ((position - fromPosition - 1) % maxSeats + maxSeats) % maxSeats;
    return activeSeats.sort((a, b) => distance(a.seatPosition) - distance(b.seatPosition))[0];
  }

  private nextPosition(sortedPositions: number[], fromPosition: number): number {
    const next = sortedPositions.find((position) => position > fromPosition);
    return next !== undefined ? next : sortedPositions[0];
  }

  private setTurnDeadline(tableId: string) {
    this.turnDeadlines.set(tableId, Date.now() + TURN_TIME_MS);
  }

  private pushLog(tableId: string, message: string) {
    const log = this.handLogs.get(tableId) ?? [];
    log.push(message);
    if (log.length > 100) {
      log.shift();
    }
    this.handLogs.set(tableId, log);
  }

  private async getTable(tableId: string): Promise<PokerTable> {
    const table = await this.tablesRepository.findOne({ where: { id: tableId } });
    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }
    return table;
  }

  private async getGameById(gameId: string): Promise<Game> {
    const game = await this.gamesRepository.findOne({ where: { id: gameId } });
    if (!game) {
      throw new NotFoundException('Jogo não encontrado');
    }
    return game;
  }

  async getOrCreateGame(tableId: string): Promise<Game> {
    let game = await this.gamesRepository.findOne({ where: { tableId } });
    if (!game) {
      game = this.gamesRepository.create({ tableId });
      await this.gamesRepository.save(game);
    }
    return game;
  }

  private async getSeats(gameId: string): Promise<PlayerSeat[]> {
    return this.seatsRepository.find({
      where: { gameId },
      order: { seatPosition: 'ASC' },
    });
  }
}
