import { randomInt } from 'crypto';
import { Hand } from 'pokersolver';

export type Card = string;

export interface PotContribution {
  userId: string;
  amount: number;
  folded: boolean;
}

export interface Pot {
  amount: number;
  eligibleUserIds: string[];
}

export interface ShowdownSeat {
  userId: string;
  holeCards: Card[];
}

export interface PotAward {
  userId: string;
  amount: number;
  handName: string;
}

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
const SUITS = ['s', 'h', 'd', 'c'];
const SUIT_SYMBOLS: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(rank + suit);
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: Card[], count: number): [Card[], Card[]] {
  return [deck.slice(0, count), deck.slice(count)];
}

export function formatCard(card: Card): string {
  const rank = card[0] === 'T' ? '10' : card[0];
  return rank + (SUIT_SYMBOLS[card[1]] ?? card[1]);
}

// Devolve a parte da maior aposta que ninguém igualou (só existe para quem não foldou).
export function getUncalledBet(
  contributions: PotContribution[],
): { userId: string; amount: number } | null {
  const sorted = [...contributions].sort((a, b) => b.amount - a.amount);
  if (sorted.length === 0 || sorted[0].amount <= 0) {
    return null;
  }
  const top = sorted[0];
  const secondAmount = sorted[1]?.amount ?? 0;
  if (top.amount > secondAmount && !top.folded) {
    return { userId: top.userId, amount: top.amount - secondAmount };
  }
  return null;
}

// Camadas de pote: cada nível corresponde ao total apostado por um jogador não-foldado.
// Quem foldou contribui para as camadas, mas nunca é elegível a ganhá-las.
export function calculateSidePots(contributions: PotContribution[]): Pot[] {
  const active = contributions.filter((c) => !c.folded && c.amount > 0);
  if (active.length === 0) {
    return [];
  }
  const levels = [...new Set(active.map((c) => c.amount))].sort((a, b) => a - b);
  const pots: Pot[] = [];
  let previousLevel = 0;
  for (const level of levels) {
    let amount = 0;
    for (const c of contributions) {
      amount += Math.min(c.amount, level) - Math.min(c.amount, previousLevel);
    }
    pots.push({
      amount,
      eligibleUserIds: active.filter((c) => c.amount >= level).map((c) => c.userId),
    });
    previousLevel = level;
  }
  let foldedExcess = 0;
  for (const c of contributions) {
    foldedExcess += Math.max(0, c.amount - previousLevel);
  }
  if (foldedExcess > 0) {
    pots[pots.length - 1].amount += foldedExcess;
  }
  return pots.filter((pot) => pot.amount > 0);
}

export function computeRake(
  totalPot: number,
  rakePercent: number,
  rakeCapChips: number,
  flopDealt: boolean,
): number {
  if (!flopDealt || totalPot <= 0) {
    return 0;
  }
  return Math.min(Math.floor((totalPot * rakePercent) / 100), Math.floor(rakeCapChips));
}

// positionOrder: userIds em ordem de posição a partir da esquerda do dealer;
// o primeiro da lista é a pior posição e recebe as sobras de divisão não exata.
export function awardPot(
  pot: Pot,
  seats: ShowdownSeat[],
  communityCards: Card[],
  positionOrder: string[],
): PotAward[] {
  const eligible = seats.filter((seat) => pot.eligibleUserIds.includes(seat.userId));
  if (eligible.length === 0) {
    return [];
  }
  if (eligible.length === 1) {
    return [{ userId: eligible[0].userId, amount: pot.amount, handName: '' }];
  }
  const solved = eligible.map((seat) => {
    const hand = Hand.solve([...seat.holeCards, ...communityCards]);
    (hand as any).ownerUserId = seat.userId;
    return hand;
  });
  const winningHands = Hand.winners(solved);
  const winnerIds = new Set(winningHands.map((hand) => (hand as any).ownerUserId as string));
  const orderedWinners = positionOrder.filter((userId) => winnerIds.has(userId));
  const share = Math.floor(pot.amount / orderedWinners.length);
  const remainder = pot.amount - share * orderedWinners.length;
  return orderedWinners.map((userId, index) => {
    const hand = winningHands.find((h) => (h as any).ownerUserId === userId);
    return {
      userId,
      amount: share + (index === 0 ? remainder : 0),
      handName: hand ? hand.descr : '',
    };
  });
}

export function describeHand(holeCards: Card[], communityCards: Card[]): string {
  return Hand.solve([...holeCards, ...communityCards]).descr;
}
