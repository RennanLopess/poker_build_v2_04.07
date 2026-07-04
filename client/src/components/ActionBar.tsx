import { useEffect, useState } from 'react';
import { ActionOptions } from '../types';

export function ActionBar({
  options,
  deadline,
  onAction,
}: {
  options: ActionOptions;
  deadline: number | null;
  onAction: (action: string, amount?: number) => void;
}) {
  const [betAmount, setBetAmount] = useState(options.minBet);
  const [raiseAmount, setRaiseAmount] = useState(options.minRaise);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    setBetAmount(options.minBet);
    setRaiseAmount(options.minRaise);
  }, [options]);

  useEffect(() => {
    if (!deadline) {
      setSecondsLeft(null);
      return;
    }
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <div className="rounded-lg border-2 border-emerald-600 bg-gray-800 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold text-emerald-400">Sua vez de agir</p>
        {secondsLeft !== null && (
          <p className={secondsLeft <= 10 ? 'font-bold text-red-400' : 'text-gray-300'}>
            ⏱ {secondsLeft}s
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onAction('fold')}
          className="rounded bg-red-700 px-4 py-2 font-semibold hover:bg-red-600"
        >
          FOLD
        </button>
        {options.canCheck && (
          <button
            onClick={() => onAction('check')}
            className="rounded bg-gray-600 px-4 py-2 font-semibold hover:bg-gray-500"
          >
            CHECK
          </button>
        )}
        {options.canCall && (
          <button
            onClick={() => onAction('call')}
            className="rounded bg-blue-700 px-4 py-2 font-semibold hover:bg-blue-600"
          >
            CALL {options.callAmount}
          </button>
        )}
        {options.canBet && (
          <span className="flex items-center gap-1">
            <button
              onClick={() => onAction('bet', betAmount)}
              disabled={betAmount < options.minBet || betAmount > options.maxBet}
              className="rounded bg-emerald-700 px-4 py-2 font-semibold hover:bg-emerald-600 disabled:opacity-40"
            >
              BET
            </button>
            <input
              type="number"
              min={options.minBet}
              max={options.maxBet}
              value={betAmount}
              onChange={(event) => setBetAmount(Number(event.target.value))}
              className="w-24 rounded bg-gray-700 px-2 py-2 text-sm outline-none"
            />
          </span>
        )}
        {options.canRaise && (
          <span className="flex items-center gap-1">
            <button
              onClick={() => onAction('raise', raiseAmount)}
              disabled={raiseAmount < options.minRaise || raiseAmount > options.maxBet}
              className="rounded bg-emerald-700 px-4 py-2 font-semibold hover:bg-emerald-600 disabled:opacity-40"
            >
              RAISE p/
            </button>
            <input
              type="number"
              min={options.minRaise}
              max={options.maxBet}
              value={raiseAmount}
              onChange={(event) => setRaiseAmount(Number(event.target.value))}
              className="w-24 rounded bg-gray-700 px-2 py-2 text-sm outline-none"
            />
          </span>
        )}
        {options.allInAmount > 0 && (
          <button
            onClick={() => onAction('all_in')}
            className="rounded bg-amber-600 px-4 py-2 font-semibold hover:bg-amber-500"
          >
            ALL-IN ({options.allInAmount})
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-400">
        {options.canBet && `Aposta mínima: ${options.minBet}. `}
        {options.canRaise && `Aumento mínimo para: ${options.minRaise}. `}
        Máximo: {options.maxBet}.
      </p>
    </div>
  );
}
