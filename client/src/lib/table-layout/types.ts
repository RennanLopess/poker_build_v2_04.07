export interface SeatPosition {
  top: string;
  left: string;
  rotation?: number;
}

export interface TableLayoutConfig {
  id: string;
  name: string;
  description: string;
  maxSeats: number;
  seatPositions: Record<number, SeatPosition>;
}
