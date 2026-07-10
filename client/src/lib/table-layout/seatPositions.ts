import { TableLayoutConfig } from './types';

export const OVAL_6_LAYOUT: TableLayoutConfig = {
  id: 'oval-6',
  name: 'Oval 6 lugares',
  description: 'Mesa oval clássica para até 6 jogadores',
  maxSeats: 6,
  seatPositions: {
    0: { top: '88%', left: '50%' },
    1: { top: '70%', left: '12%' },
    2: { top: '25%', left: '12%' },
    3: { top: '8%', left: '50%' },
    4: { top: '25%', left: '88%' },
    5: { top: '70%', left: '88%' },
  },
};

export const OVAL_9_LAYOUT: TableLayoutConfig = {
  id: 'oval-9',
  name: 'Oval 9 lugares',
  description: 'Mesa oval completa para até 9 jogadores',
  maxSeats: 9,
  seatPositions: {
    0: { top: '88%', left: '50%' },
    1: { top: '82%', left: '20%' },
    2: { top: '55%', left: '8%' },
    3: { top: '22%', left: '12%' },
    4: { top: '8%', left: '35%' },
    5: { top: '8%', left: '65%' },
    6: { top: '22%', left: '88%' },
    7: { top: '55%', left: '92%' },
    8: { top: '82%', left: '80%' },
  },
};

export const TABLE_LAYOUTS: Record<string, TableLayoutConfig> = {
  [OVAL_6_LAYOUT.id]: OVAL_6_LAYOUT,
  [OVAL_9_LAYOUT.id]: OVAL_9_LAYOUT,
};

export function getTableLayout(id: string): TableLayoutConfig {
  return TABLE_LAYOUTS[id] ?? OVAL_6_LAYOUT;
}
