import { CardTheme } from './types';

export const classicTheme: CardTheme = {
  id: 'classic',
  name: 'Clássico',
  description: 'Estilo tradicional de cartas de baralho',

  card: {
    width: 60,
    height: 90,
    borderRadius: 6,
    shadowIntensity: 'medium',
    animationSpeed: 'medium',
  },

  colors: {
    suitRed: '#dc2626',
    suitBlack: '#1f2937',
    background: '#ffffff',
    border: '#e5e7eb',
    cornerBg: '#f3f4f6',
    back: '#404040',
  },
};
