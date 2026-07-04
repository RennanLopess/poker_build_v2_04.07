import { useGameStore } from '../store/gameStore';

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useGameStore.getState().token;
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = Array.isArray(body.message) ? body.message.join('; ') : body.message;
    throw new Error(message || `Erro ${response.status}`);
  }
  return response.json();
}
