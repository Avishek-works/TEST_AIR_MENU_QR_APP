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
        setError(result.error || "Unable to place order.");
        return;
      }

      sessionStorage.removeItem("cca-order-token");
      clearCart();
      router.push(`/order/table/${tableId}/success?orderId=${result.orderId}`);
    });
  };

  return (
    <section>
      <div className="rounded-[2rem] border border-[var(--brand-brown-opaque)] bg-[var(--brand-white)] p-5 shadow-[0_18px_40px_-20px_rgba(74,44,33,0.04)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Checkout</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--brand-brown)]">Customer details</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">A few details to complete your premium cafe order.</p>
      </div>

      <form onSubmit={placeOrder} className="mt-5 space-y-5">
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

        <div className="rounded-[1.75rem] border border-[var(--brand-brown-opaque)] bg-[var(--brand-beige)] p-4">
          <div className="flex items-center justify-between text-sm text-[var(--muted)]">
            <span>Order total</span>
            <span className="font-semibold text-[var(--brand-brown)]">₹{subtotal.toFixed(2)}</span>
          </div>
        </div>

        {error ? <p className="text-sm text-[var(--brand-brown)]">{error}</p> : null}

        <button
          disabled={isPending}
          className="inline-flex min-h-[3rem] w-full items-center justify-center rounded-2xl bg-[var(--brand-brown)] px-4 font-semibold text-[var(--brand-white)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          style={{ boxShadow: '0 8px 20px rgba(74,44,33,0.12)' }}
        >
          {isPending ? "Placing order..." : "Place order"}
        </button>

        <Link
          href={`/order/table/${tableId}/cart`}
          className="inline-flex min-h-[3rem] w-full items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--brand-white)] px-4 text-sm font-medium text-[var(--brand-brown)] transition hover:border-[var(--brand-brown)]"
          style={{ boxShadow: '0 6px 18px rgba(74,44,33,0.04)' }}
        >
          Back to cart
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
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-[var(--brand-white)] px-4 py-3 text-sm text-[var(--brand-brown)] outline-none transition focus:border-[var(--brand-brown)] focus:ring-2 focus:ring-[var(--brand-brown-opaque)]"
      />
    </label>
  );
}
