import {
  awardPot,
  calculateSidePots,
  computeRake,
  createDeck,
  dealCards,
  getUncalledBet,
  shuffleDeck,
} from './poker';

describe('createDeck', () => {
  it('gera 52 cartas únicas', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck).size).toBe(52);
    expect(deck).toContain('As');
    expect(deck).toContain('Tc');
  });
});

describe('shuffleDeck', () => {
  it('mantém as mesmas 52 cartas sem modificar o original', () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    expect(shuffled).toHaveLength(52);
    expect([...shuffled].sort()).toEqual([...deck].sort());
    expect(deck).toEqual(createDeck());
  });
});

describe('dealCards', () => {
  it('separa as cartas do topo e devolve o resto', () => {
    const deck = ['As', 'Ks', 'Qs', 'Js'];
    const [cards, rest] = dealCards(deck, 2);
    expect(cards).toEqual(['As', 'Ks']);
    expect(rest).toEqual(['Qs', 'Js']);
  });
});

describe('calculateSidePots', () => {
  it('cria um único pote quando todos apostam igual', () => {
    const pots = calculateSidePots([
      { userId: 'a', amount: 100, folded: false },
      { userId: 'b', amount: 100, folded: false },
      { userId: 'c', amount: 100, folded: false },
    ]);
    expect(pots).toHaveLength(1);
    expect(pots[0].amount).toBe(300);
    expect(pots[0].eligibleUserIds.sort()).toEqual(['a', 'b', 'c']);
  });

  it('cria main pot e side pot com um all-in menor', () => {
    const pots = calculateSidePots([
      { userId: 'a', amount: 100, folded: false },
      { userId: 'b', amount: 200, folded: false },
      { userId: 'c', amount: 200, folded: false },
    ]);
    expect(pots).toHaveLength(2);
    expect(pots[0].amount).toBe(300);
    expect(pots[0].eligibleUserIds.sort()).toEqual(['a', 'b', 'c']);
    expect(pots[1].amount).toBe(200);
    expect(pots[1].eligibleUserIds.sort()).toEqual(['b', 'c']);
  });

  it('cria três potes com all-ins escalonados', () => {
    const pots = calculateSidePots([
      { userId: 'a', amount: 50, folded: false },
      { userId: 'b', amount: 150, folded: false },
      { userId: 'c', amount: 400, folded: false },
      { userId: 'd', amount: 400, folded: false },
    ]);
    expect(pots).toHaveLength(3);
    expect(pots[0].amount).toBe(200);
    expect(pots[0].eligibleUserIds.sort()).toEqual(['a', 'b', 'c', 'd']);
    expect(pots[1].amount).toBe(300);
    expect(pots[1].eligibleUserIds.sort()).toEqual(['b', 'c', 'd']);
    expect(pots[2].amount).toBe(500);
    expect(pots[2].eligibleUserIds.sort()).toEqual(['c', 'd']);
  });

  it('inclui fichas de quem foldou sem torná-lo elegível', () => {
    const pots = calculateSidePots([
      { userId: 'a', amount: 60, folded: true },
      { userId: 'b', amount: 100, folded: false },
      { userId: 'c', amount: 100, folded: false },
    ]);
    expect(pots).toHaveLength(1);
    expect(pots[0].amount).toBe(260);
    expect(pots[0].eligibleUserIds.sort()).toEqual(['b', 'c']);
  });

  it('distribui fichas de quem foldou entre as camadas corretas', () => {
    const pots = calculateSidePots([
      { userId: 'a', amount: 80, folded: true },
      { userId: 'b', amount: 50, folded: false },
      { userId: 'c', amount: 200, folded: false },
      { userId: 'd', amount: 200, folded: false },
    ]);
    expect(pots).toHaveLength(2);
    expect(pots[0].amount).toBe(200);
    expect(pots[0].eligibleUserIds.sort()).toEqual(['b', 'c', 'd']);
    expect(pots[1].amount).toBe(330);
    expect(pots[1].eligibleUserIds.sort()).toEqual(['c', 'd']);
  });
});

describe('getUncalledBet', () => {
  it('devolve a diferença quando a maior aposta não foi paga', () => {
    const uncalled = getUncalledBet([
      { userId: 'a', amount: 300, folded: false },
      { userId: 'b', amount: 200, folded: false },
    ]);
    expect(uncalled).toEqual({ userId: 'a', amount: 100 });
  });

  it('retorna null quando as apostas estão igualadas', () => {
    const uncalled = getUncalledBet([
      { userId: 'a', amount: 200, folded: false },
      { userId: 'b', amount: 200, folded: false },
    ]);
    expect(uncalled).toBeNull();
  });

  it('devolve o excedente ao BB quando todos foldam no pré-flop', () => {
    const uncalled = getUncalledBet([
      { userId: 'sb', amount: 10, folded: true },
      { userId: 'bb', amount: 20, folded: false },
    ]);
    expect(uncalled).toEqual({ userId: 'bb', amount: 10 });
  });
});

describe('computeRake', () => {
  it('aplica o percentual sobre o pote', () => {
    expect(computeRake(400, 5, 60, true)).toBe(20);
  });

  it('respeita o teto (cap)', () => {
    expect(computeRake(10000, 5, 60, true)).toBe(60);
  });

  it('não cobra rake sem flop (no flop, no drop)', () => {
    expect(computeRake(400, 5, 60, false)).toBe(0);
  });
});

describe('awardPot', () => {
  const community = ['2h', '7d', '9c', 'Jh', '3s'];

  it('flush vence sequência', () => {
    const awards = awardPot(
      { amount: 500, eligibleUserIds: ['a', 'b'] },
      [
        { userId: 'a', holeCards: ['Ah', 'Kh'] },
        { userId: 'b', holeCards: ['Td', '8s'] },
      ],
      ['2h', '7h', '9h', 'Jd', '3s'],
      ['a', 'b'],
    );
    expect(awards).toHaveLength(1);
    expect(awards[0].userId).toBe('a');
    expect(awards[0].amount).toBe(500);
  });

  it('divide o pote em empate e dá a sobra à pior posição', () => {
    const awards = awardPot(
      { amount: 205, eligibleUserIds: ['a', 'b'] },
      [
        { userId: 'a', holeCards: ['As', 'Kd'] },
        { userId: 'b', holeCards: ['Ad', 'Kc'] },
      ],
      community,
      ['b', 'a'],
    );
    expect(awards).toHaveLength(2);
    const byUser = Object.fromEntries(awards.map((award) => [award.userId, award.amount]));
    expect(byUser['b']).toBe(103);
    expect(byUser['a']).toBe(102);
  });

  it('entrega pote com um único elegível sem avaliar mãos', () => {
    const awards = awardPot(
      { amount: 120, eligibleUserIds: ['a'] },
      [{ userId: 'a', holeCards: ['2c', '3d'] }],
      community,
      ['a'],
    );
    expect(awards).toEqual([{ userId: 'a', amount: 120, handName: '' }]);
  });

  it('quadra vence full house no side pot certo', () => {
    const board = ['Ks', 'Kd', '4c', '4d', '9h'];
    const mainPot = awardPot(
      { amount: 300, eligibleUserIds: ['short', 'mid', 'big'] },
      [
        { userId: 'short', holeCards: ['Kh', 'Kc'] },
        { userId: 'mid', holeCards: ['4h', '4s'] },
        { userId: 'big', holeCards: ['Ah', 'Ad'] },
      ],
      board,
      ['short', 'mid', 'big'],
    );
    expect(mainPot).toHaveLength(1);
    expect(mainPot[0].userId).toBe('short');

    const sidePot = awardPot(
      { amount: 200, eligibleUserIds: ['mid', 'big'] },
      [
        { userId: 'mid', holeCards: ['4h', '4s'] },
        { userId: 'big', holeCards: ['Ah', 'Ad'] },
      ],
      board,
      ['mid', 'big'],
    );
    expect(sidePot).toHaveLength(1);
    expect(sidePot[0].userId).toBe('mid');
  });
});

describe('cenário completo: all-in triplo com rake', () => {
  it('distribui main pot e side pot corretamente', () => {
    const contributions = [
      { userId: 'short', amount: 100, folded: false },
      { userId: 'mid', amount: 250, folded: false },
      { userId: 'big', amount: 400, folded: false },
    ];
    const uncalled = getUncalledBet(contributions);
    expect(uncalled).toEqual({ userId: 'big', amount: 150 });
    contributions.find((c) => c.userId === uncalled.userId).amount -= uncalled.amount;

    const pots = calculateSidePots(contributions);
    expect(pots).toHaveLength(2);
    expect(pots[0].amount).toBe(300);
    expect(pots[1].amount).toBe(300);

    const totalPot = pots.reduce((sum, pot) => sum + pot.amount, 0);
    const rake = computeRake(totalPot, 5, 60, true);
    expect(rake).toBe(30);
    pots[0].amount -= rake;

    const board = ['2h', '7d', '9c', 'Jh', '3s'];
    const seats = [
      { userId: 'short', holeCards: ['As', 'Ad'] },
      { userId: 'mid', holeCards: ['Ks', 'Kd'] },
      { userId: 'big', holeCards: ['Qs', 'Qd'] },
    ];
    const order = ['short', 'mid', 'big'];

    const mainAwards = awardPot(pots[0], seats, board, order);
    expect(mainAwards).toEqual([{ userId: 'short', amount: 270, handName: expect.any(String) }]);

    const sideAwards = awardPot(pots[1], seats, board, order);
    expect(sideAwards).toEqual([{ userId: 'mid', amount: 300, handName: expect.any(String) }]);
  });
});
