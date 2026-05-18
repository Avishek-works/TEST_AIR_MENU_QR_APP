interface QuantityStepperProps {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
}

export function QuantityStepper({ quantity, onDecrease, onIncrease }: QuantityStepperProps) {
  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={onIncrease}
        className="h-9 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-500"
      >
        Add
      </button>
    );
  }

  return (
    <div className="inline-flex h-9 items-center rounded-lg border border-zinc-700 bg-zinc-900">
      <button type="button" onClick={onDecrease} className="h-full px-3 text-zinc-300" aria-label="Decrease quantity">
        −
      </button>
      <span className="min-w-8 text-center text-sm font-medium text-white">{quantity}</span>
      <button type="button" onClick={onIncrease} className="h-full px-3 text-zinc-300" aria-label="Increase quantity">
        +
      </button>
    </div>
  );
}
