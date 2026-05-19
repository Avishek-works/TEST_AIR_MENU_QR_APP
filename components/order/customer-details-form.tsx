"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { placeOrderAction } from "@/app/order/actions";
import { useCart } from "@/components/cart/cart-provider";

export function CustomerDetailsForm({ tableId }: { tableId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const { items, notes, customer, setCustomer, subtotal, clearCart } = useCart();

  const placeOrder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!customer.name.trim() || !customer.phone.trim()) {
      setError("Name and phone are required.");
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    const inFlightToken = sessionStorage.getItem("cca-order-token") || crypto.randomUUID();
    sessionStorage.setItem("cca-order-token", inFlightToken);

    startTransition(async () => {
      const result = await placeOrderAction({
        tableNumber: tableId,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        customerDob: customer.dob,
        notes,
        clientToken: inFlightToken,
        items,
      });

      if (!result.ok || !result.orderId) {
        const message =
          result.error === "Table is invalid or inactive."
            ? "The table number is invalid or inactive. Please return home and enter a valid table number."
            : result.error || "Unable to place order.";
        setError(message);
        return;
      }

      sessionStorage.removeItem("cca-order-token");
      clearCart();
      router.push(`/order/table/${tableId}/success?orderId=${result.orderId}`);
    });
  };

  return (
    <section>
      {/* Header */}
      <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--brand-beige)] p-4 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)]">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold)] opacity-80">Checkout</p>
        <h1 className="mt-1.5 text-2xl font-semibold text-[var(--brand-brown)] tracking-tight">Your details</h1>
        <p className="mt-1 text-xs text-[var(--muted)]">A few details to complete your order.</p>
      </div>

      <form onSubmit={placeOrder} className="mt-5 space-y-4">
        <Field
          label="Name *"
          value={customer.name}
          onChange={(value) => setCustomer({ name: value })}
          placeholder="Enter your name"
        />
        <Field
          label="Phone *"
          value={customer.phone}
          onChange={(value) => setCustomer({ phone: value })}
          placeholder="Enter your phone"
          inputMode="tel"
        />
        <Field
          label="Email (optional)"
          value={customer.email}
          onChange={(value) => setCustomer({ email: value })}
          placeholder="Enter your email"
          inputMode="email"
        />
        <Field
          label="Date of Birth (optional)"
          value={customer.dob}
          onChange={(value) => setCustomer({ dob: value })}
          placeholder="YYYY-MM-DD"
        />

        <p className="text-xs text-[var(--muted)]">Share your birthday for special treats and offers.</p>

        {/* Order total */}
        <div className="rounded-2xl border border-[var(--border-warm)] bg-[var(--brand-beige)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--muted)]">Order total</span>
            <span className="text-xl font-bold text-[var(--gold)] tracking-tight">₹{subtotal.toFixed(2)}</span>
          </div>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-800/40 bg-red-950/40 px-4 py-3 text-sm font-medium text-red-400">{error}</p>
        ) : null}

        <button
          disabled={isPending}
          className="btn-gold inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-4 text-sm font-bold shadow-[0_4px_18px_rgba(252,176,58,0.30)] tracking-wide"
          type="submit"
        >
          {isPending ? "Placing order…" : "Place order →"}
        </button>

        <Link
          href={`/order/table/${tableId}/cart`}
          className="btn-ghost inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--brand-beige)] px-4 text-sm font-medium text-[var(--muted)] hover:border-[var(--border-warm)] hover:text-[var(--brand-brown)]"
        >
          ← Back to cart
        </Link>
      </form>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[var(--muted)]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--brand-beige)] px-4 py-3 text-sm text-[var(--brand-brown)] placeholder:text-[var(--muted)] outline-none transition-all duration-200 focus:border-[var(--gold-border)] focus:ring-2 focus:ring-[var(--gold-soft)]"
      />
    </label>
  );
}
