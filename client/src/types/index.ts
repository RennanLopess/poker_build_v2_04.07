export interface User {
  id: string;
  username: string;
  displayName: string;
  chips: number;
  role: 'admin' | 'manager' | 'player';
}

export interface TableInfo {
  id: string;
  name: string;
  maxSeats: number;
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
  maxBuyIn: number;
  rakePercent: number;
  rakeCap: number;
  status: 'active' | 'paused' | 'closed';
  playerCount?: number;
}

export interface SeatState {
  userId: string;
  username: string;
  displayName: string;
  seatPosition: number;
  stackSize: number;
  currentBet: number;
  totalBetInHand: number;
  status: 'waiting' | 'active' | 'folded' | 'all_in';
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  isConnected: boolean;
  holeCards: string[] | null;
}

export interface GameState {
  id: string;
  phase: 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  handNumber: number;
  pot: number;
  communityCards: string[];
  dealerPosition: number;
  currentTurnUserId: string | null;
  currentBetAmount: number;
  turnDeadline: number | null;
}

export interface TableState {
  table: TableInfo;
  game: GameState;
  seats: SeatState[];
  actionLog: string[];
}

export interface ActionOptions {
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  canBet: boolean;
  canRaise: boolean;
  minBet: number;
  minRaise: number;
  maxBet: number;
  allInAmount: number;
}

export interface ActionRequired {
  options: ActionOptions;
  deadline: number | null;
}

export interface HandResult {
  handNumber: number;
  winners: { userId: string; displayName: string; amount: number; handName: string }[];
  pots: { amount: number; eligibleUserIds: string[] }[];
  rake: number;
  revealedCards: Record<string, string[]>;
  communityCards: string[];
}

export interface ChatMessage {
  userId: string;
  displayName: string;
  message: string;
  timestamp: number;
}

export interface ReportData {
  players: {
    id: string;
    username: string;
    displayName: string;
    chips: number;
    stackInPlay: number;
    total: number;
    seatedAt: string | null;
  }[];
  tables: { id: string; name: string; status: string; totalRake: number }[];
  totalRake: number;
}
