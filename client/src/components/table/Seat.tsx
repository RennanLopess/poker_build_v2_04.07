import { SeatState, GameState } from '../../types';
import { SeatPosition } from '../../lib/table-layout/types';
import { CardContainer } from '../cards/CardContainer';
import { useCardTheme } from '../../hooks/useCardTheme';

interface SeatProps {
  seat: SeatState;
  gameState: GameState;
  myUserId: string;
  myCards: string[] | null;
  position: SeatPosition;
}

export function Seat({ seat, gameState, myUserId, myCards, position }: SeatProps) {
  const theme = useCardTheme();
  const isMe = seat.userId === myUserId;
  const isMyTurn = gameState.currentTurnUserId === seat.userId;
  const isFolded = seat.status === 'folded';

  const inHand = gameState.phase !== 'waiting';
  const cards = isMe ? seat.holeCards ?? myCards : null;

  return (
    <div
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        transform: 'translate(-50%, -50%)',
      }}
      className={`
        flex flex-col items-center gap-1 rounded-lg p-2 min-w-[90px]
        ${isMyTurn ? 'bg-emerald-900/70 border-2 border-emerald-400' : 'bg-gray-900/70'}
        ${isFolded ? 'opacity-50' : 'opacity-100'}
        ${isMe && !isMyTurn ? 'border-2 border-blue-400' : ''}
        ${!isMe && !isMyTurn ? 'border border-gray-700' : ''}
      `}
    >
      <div className="text-xs font-semibold text-gray-200">
        {seat.displayName}
        {isMe && <span className="ml-1 text-emerald-400">(você)</span>}
        {!seat.isConnected && <span className="ml-1 text-red-400">(off)</span>}
      </div>

      <div className="flex gap-1">
        {cards ? (
          <>
            <CardContainer card={cards[0]} theme={theme} animationType="enter" />
            <CardContainer card={cards[1]} theme={theme} animationType="enter" />
          </>
        ) : inHand && (seat.status === 'active' || seat.status === 'all_in') ? (
          <>
            <CardContainer theme={theme} hidden />
            <CardContainer theme={theme} hidden />
          </>
        ) : (
          <span className="text-xs text-gray-500">—</span>
        )}
      </div>

      <div className="text-xs text-gray-300">
        <span className="font-semibold">${seat.stackSize}</span>
      </div>

      {seat.currentBet > 0 && (
        <div className="text-xs font-bold text-amber-400">Aposta: ${seat.currentBet}</div>
      )}

      {seat.status === 'folded' && <div className="text-xs text-red-400">Foldou</div>}
      {seat.status === 'all_in' && <div className="text-xs text-amber-400">All-in</div>}

      <div className="flex gap-1">
        {seat.isDealer && (
          <span className="rounded bg-white px-1 text-xs font-bold text-gray-900">D</span>
        )}
        {seat.isSmallBlind && <span className="rounded bg-blue-600 px-1 text-xs">SB</span>}
        {seat.isBigBlind && <span className="rounded bg-purple-600 px-1 text-xs">BB</span>}
      </div>
    </div>
  );
}
