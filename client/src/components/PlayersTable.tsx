import clsx from 'clsx';
import { SeatState, TableState } from '../types';
import { CardText } from './CardText';

const STATUS_LABELS: Record<SeatState['status'], string> = {
  waiting: 'Aguardando',
  active: 'Na mão',
  folded: 'Foldou',
  all_in: 'All-in',
};

export function PlayersTable({
  state,
  myUserId,
  myCards,
}: {
  state: TableState;
  myUserId: string;
  myCards: string[] | null;
}) {
  const inHand = state.game.phase !== 'waiting';
  return (
    <table className="w-full overflow-hidden rounded-lg bg-gray-800 text-left text-sm">
      <thead className="bg-gray-700 text-gray-300">
        <tr>
          <th className="px-3 py-2">Pos.</th>
          <th className="px-3 py-2">Jogador</th>
          <th className="px-3 py-2">Stack</th>
          <th className="px-3 py-2">Aposta</th>
          <th className="px-3 py-2">Status</th>
          <th className="px-3 py-2">Cartas</th>
        </tr>
      </thead>
      <tbody>
        {state.seats.map((seat) => {
          const isMe = seat.userId === myUserId;
          const isTurn = state.game.currentTurnUserId === seat.userId;
          const cards = isMe ? seat.holeCards ?? myCards : null;
          return (
            <tr
              key={seat.userId}
              className={clsx(
                'border-t border-gray-700',
                isTurn && 'bg-emerald-900/40',
                seat.status === 'folded' && 'opacity-50',
              )}
            >
              <td className="px-3 py-2">
                {seat.seatPosition + 1}
                {seat.isDealer && <span className="ml-1 rounded bg-white px-1 text-xs font-bold text-gray-900">D</span>}
                {seat.isSmallBlind && <span className="ml-1 rounded bg-blue-600 px-1 text-xs">SB</span>}
                {seat.isBigBlind && <span className="ml-1 rounded bg-purple-600 px-1 text-xs">BB</span>}
              </td>
              <td className="px-3 py-2 font-semibold">
                {seat.displayName}
                {isMe && <span className="ml-1 text-emerald-400">(você)</span>}
                {!seat.isConnected && <span className="ml-1 text-red-400">(desconectado)</span>}
                {isTurn && <span className="ml-1 text-emerald-400">◄ vez</span>}
              </td>
              <td className="px-3 py-2">{seat.stackSize}</td>
              <td className="px-3 py-2">{seat.currentBet > 0 ? seat.currentBet : '—'}</td>
              <td className="px-3 py-2">{STATUS_LABELS[seat.status]}</td>
              <td className="px-3 py-2">
                {cards ? (
                  <span className="space-x-1">
                    <CardText card={cards[0]} />
                    <CardText card={cards[1]} />
                  </span>
                ) : inHand && (seat.status === 'active' || seat.status === 'all_in') ? (
                  <span className="space-x-1">
                    <CardText hidden />
                    <CardText hidden />
                  </span>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          );
        })}
        {state.seats.length === 0 && (
          <tr>
            <td colSpan={6} className="px-3 py-6 text-center text-gray-400">
              Mesa vazia
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
