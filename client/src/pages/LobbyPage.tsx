import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useGameStore } from '../store/gameStore';
import { TableInfo, User } from '../types';

export default function LobbyPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const updateUser = useGameStore((state) => state.updateUser);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [tab, setTab] = useState<'cash' | 'tournaments'>('cash');
  const [buyInTable, setBuyInTable] = useState<TableInfo | null>(null);
  const [buyInAmount, setBuyInAmount] = useState(0);
  const [error, setError] = useState('');

  async function refresh() {
    try {
      const [tablesData, meData] = await Promise.all([
        api<TableInfo[]>('/tables'),
        api<User>('/users/me'),
      ]);
      setTables(tablesData.filter((table) => table.status !== 'closed'));
      updateUser(meData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar lobby');
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, []);

  function openBuyIn(table: TableInfo) {
    setBuyInTable(table);
    setBuyInAmount(table.minBuyIn);
    setError('');
  }

  function confirmBuyIn() {
    if (!buyInTable) {
      return;
    }
    if (buyInAmount < buyInTable.minBuyIn || buyInAmount > buyInTable.maxBuyIn) {
      setError(`Buy-in deve estar entre ${buyInTable.minBuyIn} e ${buyInTable.maxBuyIn}`);
      return;
    }
    if ((user?.chips ?? 0) < buyInAmount) {
      setError('Saldo insuficiente. Fale com o manager para adicionar fichas.');
      return;
    }
    navigate(`/table/${buyInTable.id}`, { state: { buyIn: buyInAmount } });
  }

  const isManager = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">PokerBuild</h1>
          <p className="text-sm text-gray-400">Lobby — Clube EXplode</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold">{user?.displayName}</p>
            <p className="text-sm text-emerald-400">{user?.chips ?? 0} fichas</p>
          </div>
          {isManager && (
            <Link
              to="/manager"
              className="rounded bg-amber-600 px-3 py-2 text-sm font-semibold hover:bg-amber-500"
            >
              Painel do Manager
            </Link>
          )}
          <Link
            to="/settings"
            className="rounded bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600"
          >
            Configurações
          </Link>
          <button
            onClick={logout}
            className="rounded bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab('cash')}
          className={`rounded px-4 py-2 text-sm font-semibold ${
            tab === 'cash' ? 'bg-emerald-600' : 'bg-gray-800 hover:bg-gray-700'
          }`}
        >
          Cash Games
        </button>
        <button
          onClick={() => setTab('tournaments')}
          className={`rounded px-4 py-2 text-sm font-semibold ${
            tab === 'tournaments' ? 'bg-emerald-600' : 'bg-gray-800 hover:bg-gray-700'
          }`}
        >
          Torneios <span className="ml-1 rounded bg-amber-600 px-1.5 text-xs">EM BREVE</span>
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {tab === 'tournaments' ? (
        <div className="rounded-lg bg-gray-800 p-10 text-center text-gray-400">
          Torneios em breve. Por enquanto, aproveite os cash games!
        </div>
      ) : (
        <table className="w-full overflow-hidden rounded-lg bg-gray-800 text-left text-sm">
          <thead className="bg-gray-700 text-gray-300">
            <tr>
              <th className="px-4 py-3">Mesa</th>
              <th className="px-4 py-3">Blinds</th>
              <th className="px-4 py-3">Buy-in</th>
              <th className="px-4 py-3">Jogadores</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {tables.map((table) => (
              <tr key={table.id} className="border-t border-gray-700">
                <td className="px-4 py-3 font-semibold">{table.name}</td>
                <td className="px-4 py-3">
                  {table.smallBlind}/{table.bigBlind}
                </td>
                <td className="px-4 py-3">
                  {table.minBuyIn} – {table.maxBuyIn}
                </td>
                <td className="px-4 py-3">
                  {table.playerCount ?? 0}/{table.maxSeats}
                </td>
                <td className="px-4 py-3">
                  {table.status === 'active' ? (
                    <span className="text-emerald-400">Ativa</span>
                  ) : (
                    <span className="text-amber-400">Pausada</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openBuyIn(table)}
                    disabled={table.status !== 'active'}
                    className="rounded bg-emerald-600 px-3 py-1.5 font-semibold hover:bg-emerald-500 disabled:opacity-40"
                  >
                    Entrar
                  </button>
                </td>
              </tr>
            ))}
            {tables.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Nenhuma mesa disponível no momento
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {buyInTable && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-lg bg-gray-800 p-6">
            <h2 className="mb-2 text-lg font-bold">{buyInTable.name}</h2>
            <p className="mb-4 text-sm text-gray-400">
              Blinds {buyInTable.smallBlind}/{buyInTable.bigBlind} — buy-in de{' '}
              {buyInTable.minBuyIn} a {buyInTable.maxBuyIn}
            </p>
            <label className="mb-1 block text-sm text-gray-300">Valor do buy-in</label>
            <input
              type="number"
              min={buyInTable.minBuyIn}
              max={buyInTable.maxBuyIn}
              value={buyInAmount}
              onChange={(event) => setBuyInAmount(Number(event.target.value))}
              className="mb-4 w-full rounded bg-gray-700 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setBuyInTable(null)}
                className="rounded bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={confirmBuyIn}
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500"
              >
                Sentar na mesa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
