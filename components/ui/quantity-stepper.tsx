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
        className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--brand-brown)] px-5 text-sm font-semibold text-[var(--brand-white)] transition hover:brightness-95"
      >
        Add
      </button>
    );
  }

  return (
    <div className="inline-flex h-10 items-center rounded-full border border-[var(--brand-brown-opaque)] bg-[var(--brand-beige)] shadow-[0_10px_25px_-18px_rgba(74,44,33,0.06)]">
      <button
        type="button"
        onClick={onDecrease}
        className="h-full px-4 text-sm font-semibold text-[var(--brand-brown)] transition hover:brightness-95"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="min-w-[2.25rem] text-center text-sm font-semibold text-[var(--brand-brown)]">{quantity}</span>
      <button
        type="button"
        onClick={onIncrease}
        className="h-full px-4 text-sm font-semibold text-[var(--brand-brown)] transition hover:brightness-95"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
