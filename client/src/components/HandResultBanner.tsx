import { HandResult } from '../types';
import { CardText } from './CardText';

export function HandResultBanner({
  result,
  names,
}: {
  result: HandResult;
  names: Record<string, string>;
}) {
  return (
    <div className="rounded-lg border-2 border-amber-500 bg-gray-800 p-4">
      <h3 className="mb-2 font-bold text-amber-400">Resultado da mão #{result.handNumber}</h3>
      {result.winners.map((winner) => (
        <p key={winner.userId} className="text-sm">
          <span className="font-semibold">{winner.displayName}</span> ganha{' '}
          <span className="font-semibold text-emerald-400">{winner.amount}</span>
          {winner.handName && <span className="text-gray-300"> com {winner.handName}</span>}
        </p>
      ))}
      {Object.keys(result.revealedCards).length > 0 && (
        <div className="mt-2 space-y-1 text-sm text-gray-300">
          {Object.entries(result.revealedCards).map(([userId, cards]) => (
            <p key={userId} className="space-x-1">
              <span>
                {names[userId] ?? result.winners.find((w) => w.userId === userId)?.displayName ?? 'Jogador'}:
              </span>
              <CardText card={cards[0]} />
              <CardText card={cards[1]} />
            </p>
          ))}
        </div>
      )}
      {result.rake > 0 && <p className="mt-2 text-xs text-gray-400">Rake: {result.rake}</p>}
    </div>
  );
}
