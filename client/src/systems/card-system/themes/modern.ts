import { CardTheme } from './types';

export const modernTheme: CardTheme = {
  id: 'modern',
  name: 'Moderno',
  description: 'Estilo minimalista com gradientes suaves',

  card: {
    width: 70,
    height: 100,
    borderRadius: 10,
    shadowIntensity: 'high',
    animationSpeed: 'fast',
  },

  colors: {
    suitRed: '#ff6b6b',
    suitBlack: '#2d3436',
    background: 'linear-gradient(135deg, #f5f6f7 0%, #ffffff 100%)',
    border: '#dfe6e9',
    cornerBg: '#ecf0f1',
    back: 'linear-gradient(135deg, #2d3436 0%, #636e72 100%)',
  },
};
