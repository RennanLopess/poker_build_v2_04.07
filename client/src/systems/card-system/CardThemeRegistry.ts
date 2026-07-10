import { CardTheme } from './themes/types';
import { classicTheme } from './themes/classic';
import { modernTheme } from './themes/modern';
import { itchWhiteTheme, itchBlackTheme } from './themes/itch';

class CardThemeRegistryClass {
  private themes: Map<string, CardTheme> = new Map();

  constructor() {
    this.registerTheme(classicTheme);
    this.registerTheme(modernTheme);
    this.registerTheme(itchWhiteTheme);
    this.registerTheme(itchBlackTheme);
  }

  registerTheme(theme: CardTheme): void {
    if (this.themes.has(theme.id)) {
      console.warn(`Tema '${theme.id}' já registrado. Sobrescrevendo...`);
    }
    this.themes.set(theme.id, theme);
  }

  getTheme(id: string): CardTheme {
    const theme = this.themes.get(id);
    if (!theme) {
      console.warn(`Tema '${id}' não encontrado. Retornando classic.`);
      return this.themes.get('classic')!;
    }
    return theme;
  }

  getAllThemes(): CardTheme[] {
    return Array.from(this.themes.values());
  }

  listThemeIds(): string[] {
    return Array.from(this.themes.keys());
  }
}

export const CardThemeRegistry = new CardThemeRegistryClass();
