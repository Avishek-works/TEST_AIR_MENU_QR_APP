create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');
  end if;
end $$;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  dob date
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2) not null check (price >= 0),
  type text
);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  client_id uuid,
  customer_id uuid references public.customers(id) on delete set null,
  walk_in_name text,
  walk_in_phone text,
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  discount numeric(10, 2) not null default 0 check (discount >= 0),
  final_amount numeric(10, 2) not null check (final_amount >= 0),
  created_at timestamptz not null default now(),
  table_number text,
  status public.order_status not null default 'PENDING',
  constraint bills_customer_or_walk_in_chk check (customer_id is not null or walk_in_name is not null)
);

create table if not exists public.bill_items (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  price numeric(10, 2) not null check (price >= 0),
  total numeric(10, 2) not null check (total >= 0)
);
