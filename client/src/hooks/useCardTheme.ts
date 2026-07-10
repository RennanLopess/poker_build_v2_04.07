import { useCallback } from 'react';
import { CardTheme } from '../systems/card-system/themes/types';
import { CardThemeRegistry } from '../systems/card-system/CardThemeRegistry';
import { useUIStore } from '../store/uiStore';

export function useCardTheme(): CardTheme {
  const selectedThemeId = useUIStore((state) => state.selectedCardTheme);
  return CardThemeRegistry.getTheme(selectedThemeId);
}

export function useSetCardTheme() {
  const setTheme = useUIStore((state) => state.setCardTheme);

  return useCallback(
    (themeId: string) => {
      setTheme(themeId);
    },
    [setTheme],
  );
}

export function useAvailableThemes() {
  return CardThemeRegistry.getAllThemes();
}
