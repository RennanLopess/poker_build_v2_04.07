const SUIT_NAMES: Record<string, string> = {
  s: 'Pikes',
  h: 'Hearts',
  d: 'Tiles',
  c: 'Clovers',
};

const RANK_NAMES: Record<string, string> = {
  A: 'A',
  K: 'King',
  Q: 'Queen',
  J: 'Jack',
  T: '10',
};

function rankName(rank: string): string {
  const upper = rank.toUpperCase();
  return RANK_NAMES[upper] ?? upper;
}

export function itchCardSrc(card: string, variant: 'white' | 'black'): string {
  const rank = rankName(card[0]);
  const suit = SUIT_NAMES[card[1].toLowerCase()];
  if (!suit) {
    return '';
  }
  return `/cards/itch/${variant}/${suit}_${rank}_${variant}.png`;
}
