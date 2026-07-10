import { CardTheme } from './types';
import { itchCardSrc } from './itchAssets';

export const itchWhiteTheme: CardTheme = {
  id: 'itch-white',
  name: 'Pixel Branco',
  description: 'Cartas em pixel art com fundo branco (itch.io)',

  card: {
    width: 64,
    height: 90,
    borderRadius: 6,
    shadowIntensity: 'medium',
    animationSpeed: 'medium',
  },

  colors: {
    suitRed: '#e85d5d',
    suitBlack: '#2d3436',
    background: '#ffffff',
    border: '#d1d5db',
    cornerBg: '#f3f4f6',
    back: '#1e3a8a',
  },

  assets: {
    getCardSrc: (card) => itchCardSrc(card, 'white'),
    backColor: 'repeating-linear-gradient(45deg, #1e3a8a 0, #1e3a8a 6px, #1e40af 6px, #1e40af 12px)',
  },
};

export const itchBlackTheme: CardTheme = {
  id: 'itch-black',
  name: 'Pixel Preto',
  description: 'Cartas em pixel art com fundo escuro (itch.io)',

  card: {
    width: 64,
    height: 90,
    borderRadius: 6,
    shadowIntensity: 'high',
    animationSpeed: 'medium',
  },

  colors: {
    suitRed: '#e85d5d',
    suitBlack: '#e5e7eb',
    background: '#2d3436',
    border: '#4b5563',
    cornerBg: '#374151',
    back: '#111827',
  },

  assets: {
    getCardSrc: (card) => itchCardSrc(card, 'black'),
    backColor: 'repeating-linear-gradient(45deg, #111827 0, #111827 6px, #1f2937 6px, #1f2937 12px)',
  },
};
