interface PotDisplayProps {
  amount: number;
}

export function PotDisplay({ amount }: PotDisplayProps) {
  return (
    <div className="rounded-full bg-black/50 px-4 py-1 text-center shadow-lg">
      <span className="text-sm font-semibold text-amber-300">Pote: {amount}</span>
    </div>
  );
}
