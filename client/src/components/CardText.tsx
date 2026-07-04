import clsx from 'clsx';
import { formatCard, isRedCard } from '../lib/cards';

export function CardText({ card, hidden }: { card?: string; hidden?: boolean }) {
  if (hidden || !card) {
    return (
      <span className="inline-block rounded border border-gray-500 bg-gray-700 px-1.5 py-0.5 font-mono text-sm text-gray-400">
        ?
      </span>
    );
  }
  return (
    <span
      className={clsx(
        'inline-block rounded border border-gray-300 bg-white px-1.5 py-0.5 font-mono text-sm font-bold',
        isRedCard(card) ? 'text-red-600' : 'text-gray-900',
      )}
    >
      {formatCard(card)}
    </span>
  );
}
