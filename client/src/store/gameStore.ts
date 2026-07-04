import { create } from 'zustand';
import {
  ActionRequired,
  ChatMessage,
  HandResult,
  TableState,
  User,
} from '../types';

interface GameStore {
  token: string | null;
  user: User | null;
  tableState: TableState | null;
  myCards: string[] | null;
  actionRequired: ActionRequired | null;
  lastHandResult: HandResult | null;
  chatMessages: ChatMessage[];
  lastError: { message: string; at: number } | null;
  setAuth: (token: string, user: User) => void;
  updateUser: (user: User) => void;
  logout: () => void;
  setTableState: (state: TableState | null) => void;
  setMyCards: (cards: string[] | null) => void;
  setActionRequired: (action: ActionRequired | null) => void;
  setHandResult: (result: HandResult | null) => void;
  addChatMessage: (message: ChatMessage) => void;
  setError: (message: string) => void;
  clearTable: () => void;
}

const storedToken = localStorage.getItem('pokerbuild_token');
const storedUser = localStorage.getItem('pokerbuild_user');

export const useGameStore = create<GameStore>((set) => ({
  token: storedToken,
  user: storedUser ? (JSON.parse(storedUser) as User) : null,
  tableState: null,
  myCards: null,
  actionRequired: null,
  lastHandResult: null,
  chatMessages: [],
  lastError: null,
  setAuth: (token, user) => {
    localStorage.setItem('pokerbuild_token', token);
    localStorage.setItem('pokerbuild_user', JSON.stringify(user));
    set({ token, user });
  },
  updateUser: (user) => {
    localStorage.setItem('pokerbuild_user', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('pokerbuild_token');
    localStorage.removeItem('pokerbuild_user');
    set({
      token: null,
      user: null,
      tableState: null,
      myCards: null,
      actionRequired: null,
      lastHandResult: null,
      chatMessages: [],
    });
  },
  setTableState: (tableState) => set({ tableState }),
  setMyCards: (myCards) => set({ myCards }),
  setActionRequired: (actionRequired) => set({ actionRequired }),
  setHandResult: (lastHandResult) => set({ lastHandResult }),
  addChatMessage: (message) =>
    set((state) => ({ chatMessages: [...state.chatMessages.slice(-99), message] })),
  setError: (message) => set({ lastError: { message, at: Date.now() } }),
  clearTable: () =>
    set({
      tableState: null,
      myCards: null,
      actionRequired: null,
      lastHandResult: null,
      chatMessages: [],
    }),
}));
