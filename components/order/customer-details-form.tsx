"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { lookupCustomerByPhoneAction, placeOrderAction } from "@/app/order/actions";
import { useCart } from "@/components/cart/cart-provider";
import type { CustomerLookupResult } from "@/lib/types";

const PHONE_MAX_LENGTH = 10;

function sanitizePhone(raw: string): string {
  return raw.replace(/\D+/g, "").slice(0, PHONE_MAX_LENGTH);
}

function isValidPhone(phone: string): boolean {
  return /^\d{10}$/.test(phone);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getTodayDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildOrderNotes(baseNotes: string, items: { itemName: string; qty: number; addons?: { name: string }[] }[]) {
  const addonLines = items
    .filter((item) => (item.addons?.length ?? 0) > 0)
    .map((item) => `${item.itemName} x${item.qty}: ${(item.addons ?? []).map((addon) => addon.name).join(", ")}`);

  if (!addonLines.length) return baseNotes;
  const addonBlock = `Add-ons: ${addonLines.join(" | ")}`;
  return baseNotes.trim() ? `${baseNotes.trim()} | ${addonBlock}` : addonBlock;
}

export function CustomerDetailsForm({ tableId, allowOrderNotes }: { tableId: string; allowOrderNotes: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [isResolvingPhone, setIsResolvingPhone] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");
  const [isExistingCustomer, setIsExistingCustomer] = useState<boolean | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<"phone" | "details">("phone");

  const { items, notes, customer, setCustomer, subtotal, clearCart, orderType } = useCart();
  const orderTypeLabel = orderType === "Takeaway" ? "🥡 Takeaway" : "🍽 Dine-In";
  const maxDob = useMemo(() => getTodayDateValue(), []);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestLookupTokenRef = useRef(0);
  const lookupCacheRef = useRef<Record<string, CustomerLookupResult>>({});

  useEffect(() => {
    const phone = customer.phone;
    if (!isValidPhone(phone)) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      return;
    }

    if (lookupCacheRef.current[phone]) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const lookupToken = latestLookupTokenRef.current + 1;
      latestLookupTokenRef.current = lookupToken;

      void lookupCustomerByPhoneAction(phone)
        .then((result) => {
          if (latestLookupTokenRef.current !== lookupToken) {
            return;
          }
          lookupCacheRef.current[phone] = result;
        })
        .catch(() => {
          lookupCacheRef.current[phone] = { found: false };
        });
    }, 350);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [customer.phone]);

  const phoneError = useMemo(() => {
    if (!customer.phone.trim()) return "";
    if (!/^\d+$/.test(customer.phone)) return "Phone must be numeric.";
    if (customer.phone.length !== PHONE_MAX_LENGTH) return "Phone must be exactly 10 digits.";
    return "";
  }, [customer.phone]);

  const emailError = useMemo(() => {
    if (!customer.email.trim()) return "";
    if (!isValidEmail(customer.email.trim())) return "Please enter a valid email address.";
    return "";
  }, [customer.email]);

  const dobError = useMemo(() => {
    if (!customer.dob) return "";
    if (customer.dob > maxDob) return "Date of birth cannot be in the future.";
    return "";
  }, [customer.dob, maxDob]);

  const canContinueToDetails = !isResolvingPhone && isValidPhone(customer.phone);
  const canPlaceOrder =
    checkoutStep === "details" &&
    !isPending &&
    items.length > 0 &&
    !!customer.name.trim() &&
    isValidPhone(customer.phone) &&
    !emailError &&
    !dobError;

  const handlePhoneChange = (rawValue: string) => {
    const nextPhone = sanitizePhone(rawValue);
    const phoneChanged = nextPhone !== customer.phone;
    setCustomer(phoneChanged ? { phone: nextPhone, name: "", email: "", dob: "" } : { phone: nextPhone });
    setCheckoutStep("phone");
    setWelcomeName("");
    setIsExistingCustomer(null);
    setError("");
  };

  const continueToDetails = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!isValidPhone(customer.phone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    const phone = customer.phone;
    const lookupToken = latestLookupTokenRef.current + 1;
    latestLookupTokenRef.current = lookupToken;
    setIsResolvingPhone(true);

    try {
      const cached = lookupCacheRef.current[phone];
      const result = cached ?? (await lookupCustomerByPhoneAction(phone));

      if (latestLookupTokenRef.current !== lookupToken) {
        return;
      }

      lookupCacheRef.current[phone] = result;

      if (result.found && result.customer) {
        setWelcomeName(result.customer.name);
        setIsExistingCustomer(true);
        setCustomer({
          phone,
          name: result.customer.name,
          email: result.customer.email ?? "",
          dob: result.customer.dob ?? "",
        });
      } else {
        setWelcomeName("");
        setIsExistingCustomer(false);
        setCustomer({ phone, name: "", email: "", dob: "" });
      }

      setCheckoutStep("details");
    } catch {
      setError("Could not verify customer. Please try again.");
    } finally {
      if (latestLookupTokenRef.current === lookupToken) {
        setIsResolvingPhone(false);
      }
    }
  };

  const placeOrder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (checkoutStep !== "details") {
      setError("Please continue with your phone number first.");
      return;
    }

    if (!customer.name.trim() || !customer.phone.trim()) {
      setError("Name and phone are required.");
      return;
    }

    if (!isValidPhone(customer.phone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (emailError) {
      setError(emailError);
      return;
    }

    if (dobError) {
      setError(dobError);
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    startTransition(async () => {
      const combinedNotes = allowOrderNotes ? buildOrderNotes(notes, items) : buildOrderNotes("", items);
      const result = await placeOrderAction({
        tableNumber: tableId,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        customerDob: customer.dob,
        notes: combinedNotes || undefined,
        items,
        orderType,
        orderSource: "Air Menu",
      });

      if (!result.ok || !result.orderId) {
        setError(result.error || "Unable to place order.");
        return;
      }

      clearCart();
      router.push(`/order/table/${tableId}/success?orderId=${result.orderId}`);
    });
  };

  return (
    <section>
      <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-[0_12px_28px_-16px_rgba(0,0,0,0.55)]">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent-gold)] opacity-90">Checkout</p>
        <h1 className="mt-1.5 text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
          {checkoutStep === "phone" ? "Continue to checkout" : "Your details"}
        </h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {checkoutStep === "phone"
            ? "Enter your phone number to continue."
            : "Confirm your details to place the order."}
        </p>

        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Order Type</p>
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{orderTypeLabel}</p>
        </div>
      </div>

      {checkoutStep === "phone" ? (
        <form onSubmit={continueToDetails} className="mt-5 space-y-4">
          <Field
            label="Phone *"
            value={customer.phone}
            onChange={handlePhoneChange}
            placeholder="Enter your 10-digit phone"
            inputMode="numeric"
            inputProps={{ pattern: "\\d{10}", maxLength: PHONE_MAX_LENGTH }}
            error={phoneError || undefined}
          />

          {error ? (
            <p className="rounded-xl border border-red-800/40 bg-red-950/40 px-4 py-3 text-sm font-medium text-red-400">
              {error}
            </p>
          ) : null}

          <button
            disabled={!canContinueToDetails}
            className={`btn-gold inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-4 text-sm font-bold shadow-[0_4px_18px_rgba(252,176,58,0.30)] tracking-wide transition-opacity ${
              !canContinueToDetails ? "opacity-60" : "opacity-100"
            }`}
            type="submit"
          >
            {isResolvingPhone ? "Checking…" : "Continue →"}
          </button>

          <Link
            href={`/order/table/${tableId}/cart`}
            className="btn-ghost inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--border-warm)] hover:text-[var(--text-primary)]"
          >
            ← Back to cart
          </Link>
        </form>
      ) : (
        <form onSubmit={placeOrder} className="mt-5 space-y-4 animate-[fadeIn_180ms_ease-out]">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Phone</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{customer.phone}</p>
              </div>
              <button
                type="button"
                className="text-xs font-medium text-[var(--accent-gold)]"
                onClick={() => {
                  setCheckoutStep("phone");
                  setError("");
                }}
              >
                Change
              </button>
            </div>
          </div>

          {isExistingCustomer && welcomeName ? (
            <p className="rounded-xl border border-[var(--border-warm)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">
              👋 Welcome back, {welcomeName}
            </p>
          ) : null}

          {!isExistingCustomer ? (
            <p className="text-xs text-[var(--text-secondary)]">New customer profile — please share your details.</p>
          ) : null}

          <Field
            label="Name *"
            value={customer.name}
            onChange={(value) => setCustomer({ name: value })}
            placeholder="Enter your name"
          />
          <Field
            label="Email (optional)"
            value={customer.email}
            onChange={(value) => setCustomer({ email: value })}
            placeholder="Enter your email"
            inputMode="email"
            error={emailError || undefined}
          />
          <Field
            label="Date of Birth (optional)"
            value={customer.dob}
            onChange={(value) => setCustomer({ dob: value })}
            placeholder="YYYY-MM-DD"
            inputProps={{ type: "date", max: maxDob }}
            error={dobError || undefined}
          />

          <p className="text-xs text-[var(--text-secondary)]">Share your birthday for special treats and offers.</p>

          <div className="rounded-2xl border border-[var(--border-warm)] bg-[var(--bg-elevated)] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Order total</span>
              <span className="text-xl font-bold text-[var(--accent-gold)] tracking-tight">₹{subtotal.toFixed(2)}</span>
            </div>
          </div>

          {error ? (
            <p className="rounded-xl border border-red-800/40 bg-red-950/40 px-4 py-3 text-sm font-medium text-red-400">
              {error}
            </p>
          ) : null}

          <button
            disabled={!canPlaceOrder}
            className={`btn-gold inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-4 text-sm font-bold shadow-[0_4px_18px_rgba(252,176,58,0.30)] tracking-wide transition-opacity ${
              !canPlaceOrder ? "opacity-60" : "opacity-100"
            }`}
            type="submit"
          >
            {isPending ? "Placing order…" : "Place order →"}
          </button>

          <Link
            href={`/order/table/${tableId}/cart`}
            className="btn-ghost inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--border-warm)] hover:text-[var(--text-primary)]"
          >
            ← Back to cart
          </Link>
        </form>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  inputProps,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "placeholder" | "inputMode">;
  error?: string;
}) {
  const borderClass = error
    ? "border-red-700/70 focus:border-red-700/70 focus:ring-red-500/20"
    : "border-[var(--border)] focus:border-[var(--border-warm)] focus:ring-[var(--accent-gold-soft)]";

  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
        {error ? <span className="text-[11px] font-medium text-red-400">{error}</span> : null}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        {...inputProps}
        className={`mt-2 w-full rounded-2xl border bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-all duration-200 focus:ring-2 ${borderClass}`}
      />
    </label>
  );
}
