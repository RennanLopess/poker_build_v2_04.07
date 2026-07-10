export type ShadowIntensity = 'low' | 'medium' | 'high';
export type AnimationSpeed = 'fast' | 'medium' | 'slow';

export interface CardThemeAssets {
  getCardSrc: (card: string) => string;
  backSrc?: string;
  backColor?: string;
}

export interface CardTheme {
  id: string;
  name: string;
  description: string;

  card: {
    width: number;
    height: number;
    borderRadius: number;
    shadowIntensity: ShadowIntensity;
    animationSpeed: AnimationSpeed;
  };

  colors: {
    suitRed: string;
    suitBlack: string;
    background: string;
    border: string;
    cornerBg: string;
    back: string;
  };

  assets?: CardThemeAssets;
}
