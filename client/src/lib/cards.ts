const SUIT_SYMBOLS: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };
const RED_SUITS = new Set(['h', 'd']);

export function formatCard(card: string): string {
  const rank = card[0] === 'T' ? '10' : card[0];
  return rank + (SUIT_SYMBOLS[card[1]] ?? card[1]);
}

export function isRedCard(card: string): boolean {
  return RED_SUITS.has(card[1]);
}
