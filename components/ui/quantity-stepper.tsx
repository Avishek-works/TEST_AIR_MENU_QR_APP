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
        className="btn-gold inline-flex h-10 min-w-[4.5rem] items-center justify-center rounded-full px-4 text-sm font-semibold shadow-[0_4px_14px_rgba(252,176,58,0.25)]"
      >
        Add
      </button>
    );
  }

  return (
    <div className="inline-flex h-10 items-center overflow-hidden rounded-full border border-[var(--border-warm)] bg-[var(--bg-elevated)] shadow-[0_4px_14px_-6px_rgba(252,176,58,0.15)]">
      <button
        type="button"
        onClick={onDecrease}
        className="h-full min-w-10 px-3 text-base font-bold text-[var(--accent-gold)] transition-colors duration-150 hover:bg-[var(--accent-gold-soft)] active:scale-95"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="min-w-[1.75rem] text-center text-sm font-semibold text-[var(--text-primary)] tabular-nums">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        className="h-full min-w-10 px-3 text-base font-bold text-[var(--accent-gold)] transition-colors duration-150 hover:bg-[var(--accent-gold-soft)] active:scale-95"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
