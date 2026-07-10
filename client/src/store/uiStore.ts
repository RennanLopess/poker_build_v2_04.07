import { create } from 'zustand';

interface UIStore {
  selectedCardTheme: string;
  selectedTableLayout: string;
  enableAnimations: boolean;

  setCardTheme: (themeId: string) => void;
  setTableLayout: (layoutId: string) => void;
  setEnableAnimations: (enabled: boolean) => void;

  loadFromLocalStorage: () => void;
  saveToLocalStorage: () => void;
}

const STORAGE_KEY = 'pokerbuild_ui_prefs';

export const useUIStore = create<UIStore>((set, get) => ({
  selectedCardTheme: 'classic',
  selectedTableLayout: 'oval-6',
  enableAnimations: true,

  setCardTheme: (themeId: string) => {
    set({ selectedCardTheme: themeId });
    get().saveToLocalStorage();
  },

  setTableLayout: (layoutId: string) => {
    set({ selectedTableLayout: layoutId });
    get().saveToLocalStorage();
  },

  setEnableAnimations: (enabled: boolean) => {
    set({ enableAnimations: enabled });
    get().saveToLocalStorage();
  },

  loadFromLocalStorage: () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        set(parsed);
      } catch (e) {
        console.error('Erro ao carregar UI prefs:', e);
      }
    }
  },

  saveToLocalStorage: () => {
    const state = get();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedCardTheme: state.selectedCardTheme,
        selectedTableLayout: state.selectedTableLayout,
        enableAnimations: state.enableAnimations,
      }),
    );
  },
}));

useUIStore.getState().loadFromLocalStorage();
