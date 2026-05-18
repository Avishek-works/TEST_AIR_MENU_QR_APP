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
      <h1 className="text-2xl font-semibold text-white">Customer Details</h1>
      <p className="mt-1 text-sm text-zinc-400">We need this to process your order quickly.</p>

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

        <p className="-mt-2 text-xs text-zinc-500">Get special birthday treats & offers 🎉</p>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between text-sm text-zinc-300">
            <span>Total</span>
            <span className="font-semibold text-white">₹{subtotal.toFixed(2)}</span>
          </div>
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          disabled={isPending}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-red-600 font-medium text-white transition enabled:hover:bg-red-500 disabled:opacity-60"
          type="submit"
        >
          {isPending ? "Placing Order..." : "Place Order"}
        </button>

        <Link
          href={`/order/table/${tableId}/cart`}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-zinc-700 text-sm text-zinc-300"
        >
          Back to Cart
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
      <span className="text-sm text-zinc-300">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="mt-2 h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none ring-red-500/40 placeholder:text-zinc-500 focus:ring"
      />
    </label>
  );
}
