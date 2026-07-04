import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import { ChatMessage, HandResult, TableState } from '../types';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(token: string): Socket {
  if (socket) {
    return socket;
  }
  socket = io('/', { auth: { token } });
  const store = useGameStore;

  socket.on('table_state', (state: TableState) => {
    store.getState().setTableState(state);
    const user = store.getState().user;
    if (user && state.game.currentTurnUserId !== user.id) {
      store.getState().setActionRequired(null);
    }
    if (state.game.phase === 'preflop' && store.getState().lastHandResult) {
      store.getState().setHandResult(null);
    }
  });

  socket.on('your_cards', ({ cards }: { cards: string[] }) => {
    store.getState().setMyCards(cards);
    store.getState().setHandResult(null);
  });

  socket.on('action_required', (action) => {
    store.getState().setActionRequired(action);
  });

  socket.on('hand_result', (result: HandResult) => {
    store.getState().setHandResult(result);
    store.getState().setMyCards(null);
    store.getState().setActionRequired(null);
  });

  socket.on('chat_message', (message: ChatMessage) => {
    store.getState().addChatMessage(message);
  });

  socket.on('error', (error: { message?: string }) => {
    store.getState().setError(error?.message ?? 'Erro inesperado');
  });

  socket.on('table_closed', () => {
    store.getState().clearTable();
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
