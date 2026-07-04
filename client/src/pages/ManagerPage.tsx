import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { ReportData, TableInfo } from '../types';

interface PlayerRow {
  id: string;
  username: string;
  displayName: string;
  chips: number;
  role: string;
  isActive: boolean;
}

type Tab = 'chips' | 'tables' | 'report';

export default function ManagerPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('chips');
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [newTable, setNewTable] = useState({
    name: '',
    maxSeats: 9,
    smallBlind: 10,
    bigBlind: 20,
    minBuyIn: 200,
    maxBuyIn: 2000,
  });

  async function refresh() {
    try {
      const [playersData, tablesData, reportData] = await Promise.all([
        api<PlayerRow[]>('/manager/players'),
        api<TableInfo[]>('/tables'),
        api<ReportData>('/manager/report'),
      ]);
      setPlayers(playersData);
      setTables(tablesData);
      setReport(reportData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function feedback(text: string) {
    setMessage(text);
    setError('');
    setTimeout(() => setMessage(''), 3000);
  }

  function fail(err: unknown) {
    setError(err instanceof Error ? err.message : 'Erro');
    setTimeout(() => setError(''), 5000);
  }

  async function adjustChips(userId: string, operation: 'add' | 'remove' | 'set') {
    const amount = amounts[userId];
    if (amount === undefined || amount < 0 || Number.isNaN(amount)) {
      setError('Informe um valor válido');
      return;
    }
    try {
      await api(`/manager/chips/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ amount, operation }),
      });
      feedback('Fichas atualizadas');
      refresh();
    } catch (err) {
      fail(err);
    }
  }

  async function tableAction(tableId: string, action: 'start' | 'pause' | 'resume' | 'close') {
    try {
      await api(`/manager/tables/${tableId}/${action}`, { method: 'POST' });
      feedback(`Ação "${action}" executada`);
      refresh();
    } catch (err) {
      fail(err);
    }
  }

  async function createTable() {
    try {
      await api('/tables', { method: 'POST', body: JSON.stringify(newTable) });
      feedback('Mesa criada');
      setNewTable({ ...newTable, name: '' });
      refresh();
    } catch (err) {
      fail(err);
    }
  }

  function exportReport() {
    if (!report) {
      return;
    }
    const lines: string[] = [];
    lines.push(`RELATÓRIO DE SESSÃO — PokerBuild — ${new Date().toLocaleString('pt-BR')}`);
    lines.push('');
    lines.push('JOGADORES');
    for (const player of report.players) {
      lines.push(
        `${player.displayName} (${player.username}) — saldo: ${player.chips} | em jogo: ${player.stackInPlay} | total: ${player.total}${player.seatedAt ? ` | mesa: ${player.seatedAt}` : ''}`,
      );
    }
    lines.push('');
    lines.push('RAKE POR MESA');
    for (const table of report.tables) {
      lines.push(`${table.name} (${table.status}) — rake acumulado: ${table.totalRake}`);
    }
    lines.push('');
    lines.push(`RAKE TOTAL DA SESSÃO: ${report.totalRake}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `relatorio-pokerbuild-${Date.now()}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amber-400">Painel do Manager</h1>
          <p className="text-sm text-gray-400">{user?.displayName}</p>
        </div>
        <Link to="/lobby" className="rounded bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600">
          Voltar ao lobby
        </Link>
      </header>

      <div className="mb-4 flex gap-2">
        {(
          [
            ['chips', 'Fichas'],
            ['tables', 'Mesas'],
            ['report', 'Relatório'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded px-4 py-2 text-sm font-semibold ${
              tab === key ? 'bg-amber-600' : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {message && <p className="mb-3 text-sm text-emerald-400">{message}</p>}
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      {tab === 'chips' && (
        <table className="w-full overflow-hidden rounded-lg bg-gray-800 text-left text-sm">
          <thead className="bg-gray-700 text-gray-300">
            <tr>
              <th className="px-3 py-2">Jogador</th>
              <th className="px-3 py-2">Papel</th>
              <th className="px-3 py-2">Saldo</th>
              <th className="px-3 py-2">Valor</th>
              <th className="px-3 py-2">Operações</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.id} className="border-t border-gray-700">
                <td className="px-3 py-2 font-semibold">
                  {player.displayName}
                  <span className="ml-1 text-xs text-gray-400">({player.username})</span>
                </td>
                <td className="px-3 py-2">{player.role}</td>
                <td className="px-3 py-2 text-emerald-400">{player.chips}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    value={amounts[player.id] ?? ''}
                    onChange={(event) =>
                      setAmounts({ ...amounts, [player.id]: Number(event.target.value) })
                    }
                    className="w-24 rounded bg-gray-700 px-2 py-1 outline-none"
                  />
                </td>
                <td className="space-x-1 px-3 py-2">
                  <button
                    onClick={() => adjustChips(player.id, 'add')}
                    className="rounded bg-emerald-700 px-2 py-1 text-xs font-semibold hover:bg-emerald-600"
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => adjustChips(player.id, 'remove')}
                    className="rounded bg-red-700 px-2 py-1 text-xs font-semibold hover:bg-red-600"
                  >
                    Remover
                  </button>
                  <button
                    onClick={() => adjustChips(player.id, 'set')}
                    className="rounded bg-blue-700 px-2 py-1 text-xs font-semibold hover:bg-blue-600"
                  >
                    Definir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'tables' && (
        <div className="space-y-4">
          <table className="w-full overflow-hidden rounded-lg bg-gray-800 text-left text-sm">
            <thead className="bg-gray-700 text-gray-300">
              <tr>
                <th className="px-3 py-2">Mesa</th>
                <th className="px-3 py-2">Blinds</th>
                <th className="px-3 py-2">Jogadores</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((table) => (
                <tr key={table.id} className="border-t border-gray-700">
                  <td className="px-3 py-2 font-semibold">{table.name}</td>
                  <td className="px-3 py-2">
                    {table.smallBlind}/{table.bigBlind}
                  </td>
                  <td className="px-3 py-2">
                    {table.playerCount ?? 0}/{table.maxSeats}
                  </td>
                  <td className="px-3 py-2">{table.status}</td>
                  <td className="space-x-1 px-3 py-2">
                    <button
                      onClick={() => tableAction(table.id, 'start')}
                      disabled={table.status !== 'active'}
                      className="rounded bg-emerald-700 px-2 py-1 text-xs font-semibold hover:bg-emerald-600 disabled:opacity-40"
                    >
                      Iniciar mão
                    </button>
                    {table.status === 'active' ? (
                      <button
                        onClick={() => tableAction(table.id, 'pause')}
                        className="rounded bg-amber-700 px-2 py-1 text-xs font-semibold hover:bg-amber-600"
                      >
                        Pausar
                      </button>
                    ) : (
                      <button
                        onClick={() => tableAction(table.id, 'resume')}
                        disabled={table.status === 'closed'}
                        className="rounded bg-blue-700 px-2 py-1 text-xs font-semibold hover:bg-blue-600 disabled:opacity-40"
                      >
                        Reativar
                      </button>
                    )}
                    <button
                      onClick={() => tableAction(table.id, 'close')}
                      disabled={table.status === 'closed'}
                      className="rounded bg-red-700 px-2 py-1 text-xs font-semibold hover:bg-red-600 disabled:opacity-40"
                    >
                      Fechar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="rounded-lg bg-gray-800 p-4">
            <h3 className="mb-3 font-semibold text-gray-200">Criar nova mesa</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <label className="text-sm text-gray-300">
                Nome
                <input
                  value={newTable.name}
                  onChange={(event) => setNewTable({ ...newTable, name: event.target.value })}
                  className="mt-1 w-full rounded bg-gray-700 px-2 py-1.5 outline-none"
                />
              </label>
              <label className="text-sm text-gray-300">
                Assentos
                <input
                  type="number"
                  min={2}
                  max={9}
                  value={newTable.maxSeats}
                  onChange={(event) =>
                    setNewTable({ ...newTable, maxSeats: Number(event.target.value) })
                  }
                  className="mt-1 w-full rounded bg-gray-700 px-2 py-1.5 outline-none"
                />
              </label>
              <label className="text-sm text-gray-300">
                Small blind
                <input
                  type="number"
                  min={1}
                  value={newTable.smallBlind}
                  onChange={(event) =>
                    setNewTable({ ...newTable, smallBlind: Number(event.target.value) })
                  }
                  className="mt-1 w-full rounded bg-gray-700 px-2 py-1.5 outline-none"
                />
              </label>
              <label className="text-sm text-gray-300">
                Big blind
                <input
                  type="number"
                  min={1}
                  value={newTable.bigBlind}
                  onChange={(event) =>
                    setNewTable({ ...newTable, bigBlind: Number(event.target.value) })
                  }
                  className="mt-1 w-full rounded bg-gray-700 px-2 py-1.5 outline-none"
                />
              </label>
              <label className="text-sm text-gray-300">
                Buy-in mínimo
                <input
                  type="number"
                  min={1}
                  value={newTable.minBuyIn}
                  onChange={(event) =>
                    setNewTable({ ...newTable, minBuyIn: Number(event.target.value) })
                  }
                  className="mt-1 w-full rounded bg-gray-700 px-2 py-1.5 outline-none"
                />
              </label>
              <label className="text-sm text-gray-300">
                Buy-in máximo
                <input
                  type="number"
                  min={1}
                  value={newTable.maxBuyIn}
                  onChange={(event) =>
                    setNewTable({ ...newTable, maxBuyIn: Number(event.target.value) })
                  }
                  className="mt-1 w-full rounded bg-gray-700 px-2 py-1.5 outline-none"
                />
              </label>
            </div>
            <button
              onClick={createTable}
              disabled={!newTable.name}
              className="mt-3 rounded bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-40"
            >
              Criar mesa
            </button>
          </div>
        </div>
      )}

      {tab === 'report' && report && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-lg">
              Rake total da sessão:{' '}
              <span className="font-bold text-emerald-400">{report.totalRake}</span>
            </p>
            <div className="space-x-2">
              <button
                onClick={refresh}
                className="rounded bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600"
              >
                Atualizar
              </button>
              <button
                onClick={exportReport}
                className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold hover:bg-emerald-500"
              >
                Exportar .txt
              </button>
            </div>
          </div>
          <table className="w-full overflow-hidden rounded-lg bg-gray-800 text-left text-sm">
            <thead className="bg-gray-700 text-gray-300">
              <tr>
                <th className="px-3 py-2">Jogador</th>
                <th className="px-3 py-2">Saldo</th>
                <th className="px-3 py-2">Em jogo</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Mesa</th>
              </tr>
            </thead>
            <tbody>
              {report.players.map((player) => (
                <tr key={player.id} className="border-t border-gray-700">
                  <td className="px-3 py-2 font-semibold">{player.displayName}</td>
                  <td className="px-3 py-2">{player.chips}</td>
                  <td className="px-3 py-2">{player.stackInPlay}</td>
                  <td className="px-3 py-2 text-emerald-400">{player.total}</td>
                  <td className="px-3 py-2">{player.seatedAt ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="w-full overflow-hidden rounded-lg bg-gray-800 text-left text-sm">
            <thead className="bg-gray-700 text-gray-300">
              <tr>
                <th className="px-3 py-2">Mesa</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Rake acumulado</th>
              </tr>
            </thead>
            <tbody>
              {report.tables.map((table) => (
                <tr key={table.id} className="border-t border-gray-700">
                  <td className="px-3 py-2 font-semibold">{table.name}</td>
                  <td className="px-3 py-2">{table.status}</td>
                  <td className="px-3 py-2 text-emerald-400">{table.totalRake}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
