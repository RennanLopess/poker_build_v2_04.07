import { TableState } from '../../types';
import { useUIStore } from '../../store/uiStore';
import { getTableLayout } from '../../lib/table-layout/seatPositions';
import { PokerTableLayout } from './PokerTableLayout';
import { Seat } from './Seat';
import { CommunityCards } from './CommunityCards';
import { PotDisplay } from './PotDisplay';

interface PokerTableProps {
  state: TableState;
  myUserId: string;
  myCards: string[] | null;
}

export function PokerTable({ state, myUserId, myCards }: PokerTableProps) {
  const selectedLayout = useUIStore((s) => s.selectedTableLayout);
  const layout = getTableLayout(selectedLayout);
  const fallback = layout.seatPositions[0];

  return (
    <PokerTableLayout>
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
        <PotDisplay amount={state.game.pot} />
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <CommunityCards cards={state.game.communityCards} />
      </div>

      {state.seats.map((seat) => (
        <Seat
          key={seat.userId}
          seat={seat}
          gameState={state.game}
          myUserId={myUserId}
          myCards={myCards}
          position={layout.seatPositions[seat.seatPosition] ?? fallback}
        />
      ))}
    </PokerTableLayout>
  );
}
