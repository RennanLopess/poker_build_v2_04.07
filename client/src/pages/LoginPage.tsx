import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/lobby" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg bg-gray-800 p-8 shadow-lg"
      >
        <h1 className="mb-1 text-center text-3xl font-bold text-emerald-400">PokerBuild</h1>
        <p className="mb-6 text-center text-sm text-gray-400">Clube EXplode — Cash Game</p>
        <label className="mb-1 block text-sm text-gray-300">Usuário</label>
        <input
          className="mb-4 w-full rounded bg-gray-700 px-3 py-2 text-gray-100 outline-none focus:ring-2 focus:ring-emerald-500"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoFocus
        />
        <label className="mb-1 block text-sm text-gray-300">Senha</label>
        <input
          type="password"
          className="mb-4 w-full rounded bg-gray-700 px-3 py-2 text-gray-100 outline-none focus:ring-2 focus:ring-emerald-500"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading || !username || !password}
          className="w-full rounded bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
