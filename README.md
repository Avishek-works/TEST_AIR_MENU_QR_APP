# Cafe Coffee Aroma QR Ordering MVP

Production-ready, mobile-first dine-in QR ordering app built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

## Tech stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase

## Features

- Table route flow: `/order/table/[tableId]`
- Automatic table detection from route
- Menu browsing with category tabs, search, veg/non-veg/bestseller filters
- Quantity steppers and persistent cart (refresh-safe)
- Sticky mobile cart bar
- Cart notes and customer details flow
- Server action order placement into shared billing tables (`bills`, `bill_items`)
- Duplicate submit prevention via loading/disabled submit state
- Manual UPI payment confirmation screen with realtime order-status updates
- Loading and empty states

## Routes

- `/order/table/[tableId]`
- `/order/table/[tableId]/menu`
- `/order/table/[tableId]/cart`
- `/order/table/[tableId]/details`
- `/order/table/[tableId]/success`

## Environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_UPI_ID=...
NEXT_PUBLIC_UPI_MERCHANT_NAME=...
NEXT_PUBLIC_UPI_QR_IMAGE_URL=...
```

Use `.env.example` as a template for required Supabase credentials.

Required values:

1. `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public anon key for read-only menu data
3. `SUPABASE_SERVICE_ROLE_KEY` — secure server-side key for order writes
4. `NEXT_PUBLIC_UPI_ID` — UPI ID shown to customers on payment screen (placeholder fallback exists)
5. `NEXT_PUBLIC_UPI_MERCHANT_NAME` — merchant name used in deep UPI link (placeholder fallback exists)
6. `NEXT_PUBLIC_UPI_QR_IMAGE_URL` — optional static QR image URL/path fallback for UPI payment

## Supabase setup

Run SQL in order:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

## Local run

```bash
npm install
npm run dev
```

## Build & lint

```bash
npm run lint
npm run build
```

## Suggested structure

```text
app/
  order/
    actions.ts
    table/[tableId]/...
components/
  cart/
  menu/
  order/
  ui/
lib/
  data.ts
  format.ts
  types.ts
  supabase/
supabase/
  schema.sql
  seed.sql
```
