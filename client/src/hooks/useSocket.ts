import { useEffect } from 'react';
import { connectSocket, getSocket } from '../lib/socket';
import { useGameStore } from '../store/gameStore';

export function useSocket() {
  const token = useGameStore((state) => state.token);

  useEffect(() => {
    if (token && !getSocket()) {
      connectSocket(token);
    }
  }, [token]);

  function joinTable(tableId: string, buyIn?: number) {
    getSocket()?.emit('join_table', { tableId, buyIn });
  }

  function leaveTable() {
    getSocket()?.emit('leave_table', {});
  }

  function sendAction(action: string, amount?: number) {
    getSocket()?.emit('player_action', { action, amount });
  }

  function requestStartHand() {
    getSocket()?.emit('request_start_hand', {});
  }

  function sendChat(message: string) {
    getSocket()?.emit('chat_message', { message });
  }

  return { joinTable, leaveTable, sendAction, requestStartHand, sendChat };
}
