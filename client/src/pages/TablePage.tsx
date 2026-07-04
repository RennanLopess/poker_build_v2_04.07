import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ActionBar } from '../components/ActionBar';
import { CardText } from '../components/CardText';
import { ChatPanel } from '../components/ChatPanel';
import { HandResultBanner } from '../components/HandResultBanner';
import { PlayersTable } from '../components/PlayersTable';
import { useSocket } from '../hooks/useSocket';
import { getSocket } from '../lib/socket';
import { useGameStore } from '../store/gameStore';

const PHASE_LABELS: Record<string, string> = {
  waiting: 'Aguardando início',
  preflop: 'Pré-flop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
  showdown: 'Showdown',
};

export default function TablePage() {
  const { id: tableId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { joinTable, leaveTable, sendAction, requestStartHand, sendChat } = useSocket();
  const {
    user,
    tableState,
    myCards,
    actionRequired,
    lastHandResult,
    chatMessages,
    lastError,
    clearTable,
  } = useGameStore();
  const everSeatedRef = useRef(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [turnSeconds, setTurnSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!tableId) {
      return;
    }
    const buyIn = (location.state as { buyIn?: number } | null)?.buyIn;
    const join = () => joinTable(tableId, buyIn);
    const socket = getSocket();
    if (socket?.connected) {
      join();
    } else {
      socket?.once('connect', join);
    }
    return () => {
      socket?.off('connect', join);
    };
  }, [tableId]);

  useEffect(() => {
    if (!tableState || !user) {
      return;
    }
    const mySeat = tableState.seats.find((seat) => seat.userId === user.id);
    if (mySeat) {
      everSeatedRef.current = true;
    } else if (everSeatedRef.current) {
      clearTable();
      navigate('/lobby');
    }
  }, [tableState, user]);

  useEffect(() => {
    if (!lastError) {
      return;
    }
    setErrorVisible(true);
    const timeout = setTimeout(() => setErrorVisible(false), 4000);
    return () => clearTimeout(timeout);
  }, [lastError]);

  const deadline = tableState?.game.turnDeadline ?? null;
  useEffect(() => {
    if (!deadline) {
      setTurnSeconds(null);
      return;
    }
    const update = () => setTurnSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!tableState || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        Conectando à mesa...
      </div>
    );
  }

  const { table, game, seats, actionLog } = tableState;
  const mySeat = seats.find((seat) => seat.userId === user.id);
  const currentTurnSeat = seats.find((seat) => seat.userId === game.currentTurnUserId);
  const isMyTurn = game.currentTurnUserId === user.id;
  const eligiblePlayers = seats.filter((seat) => seat.stackSize > 0 && seat.isConnected).length;
  const canStart = game.phase === 'waiting' && eligiblePlayers >= 2;
  const seatNames = Object.fromEntries(seats.map((seat) => [seat.userId, seat.displayName]));

  function handleLeave() {
    leaveTable();
    clearTable();
    navigate('/lobby');
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-4">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-emerald-400">{table.name}</h1>
          <p className="text-sm text-gray-400">
            Blinds {table.smallBlind}/{table.bigBlind}
            {table.status !== 'active' && (
              <span className="ml-2 text-amber-400">
                ({table.status === 'paused' ? 'pausada' : 'fechada'})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {mySeat && (
            <p className="text-sm text-gray-300">
              Stack: <span className="font-semibold text-emerald-400">{mySeat.stackSize}</span>
            </p>
          )}
          <button
            onClick={handleLeave}
            className="rounded bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600"
          >
            Sair da mesa
          </button>
        </div>
      </header>

      {errorVisible && lastError && (
        <div className="mb-3 rounded border border-red-600 bg-red-900/50 px-4 py-2 text-sm text-red-200">
          {lastError.message}
        </div>
      )}

      <div className="mb-4 rounded-lg bg-gray-800 p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span>
            Mão <span className="font-semibold">#{game.handNumber}</span>
          </span>
          <span>
            Fase: <span className="font-semibold">{PHASE_LABELS[game.phase]}</span>
          </span>
          <span>
            Pote: <span className="font-semibold text-emerald-400">{game.pot}</span>
          </span>
          {game.currentBetAmount > 0 && (
            <span>
              Aposta atual: <span className="font-semibold">{game.currentBetAmount}</span>
            </span>
          )}
          {currentTurnSeat && (
            <span>
              Vez de: <span className="font-semibold text-emerald-400">{currentTurnSeat.displayName}</span>
              {turnSeconds !== null && (
                <span className={turnSeconds <= 10 ? 'ml-1 font-bold text-red-400' : 'ml-1 text-gray-400'}>
                  ({turnSeconds}s)
                </span>
              )}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-gray-400">Mesa:</span>
          {game.communityCards.length > 0 ? (
            <span className="space-x-1">
              {game.communityCards.map((card) => (
                <CardText key={card} card={card} />
              ))}
            </span>
          ) : (
            <span className="text-sm text-gray-500">—</span>
          )}
        </div>
        {myCards && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-400">Suas cartas:</span>
            <span className="space-x-1">
              <CardText card={myCards[0]} />
              <CardText card={myCards[1]} />
            </span>
          </div>
        )}
      </div>

      {lastHandResult && game.phase === 'waiting' && (
        <div className="mb-4">
          <HandResultBanner result={lastHandResult} names={seatNames} />
        </div>
      )}

      {canStart && (
        <div className="mb-4">
          <button
            onClick={requestStartHand}
            className="rounded bg-emerald-600 px-4 py-2 font-semibold hover:bg-emerald-500"
          >
            Iniciar mão
          </button>
          <span className="ml-3 text-sm text-gray-400">
            {lastHandResult ? 'A próxima mão começa automaticamente em instantes...' : ''}
          </span>
        </div>
      )}

      {isMyTurn && actionRequired && (
        <div className="mb-4">
          <ActionBar
            options={actionRequired.options}
            deadline={actionRequired.deadline}
            onAction={sendAction}
          />
        </div>
      )}

      <div className="mb-4">
        <PlayersTable state={tableState} myUserId={user.id} myCards={myCards} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex h-48 flex-col rounded-lg bg-gray-800 p-3">
          <h3 className="mb-2 text-sm font-semibold text-gray-300">Histórico da mão</h3>
          <div className="flex-1 space-y-0.5 overflow-y-auto text-sm text-gray-300">
            {actionLog.length === 0 && <p className="text-gray-500">Nenhuma ação ainda</p>}
            {actionLog.map((entry, index) => (
              <p key={index}>{entry}</p>
            ))}
          </div>
        </div>
        <ChatPanel messages={chatMessages} onSend={sendChat} />
      </div>
    </div>
  );
}
