import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { useGameStore } from '../store/gameStore';
import { User } from '../types';

export function useAuth() {
  const navigate = useNavigate();
  const { token, user, setAuth, logout: clearAuth } = useGameStore();

  async function login(username: string, password: string) {
    const response = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setAuth(response.token, response.user);
    connectSocket(response.token);
    navigate('/lobby');
  }

  function logout() {
    disconnectSocket();
    clearAuth();
    navigate('/login');
  }

  return { token, user, login, logout, isAuthenticated: !!token };
}
