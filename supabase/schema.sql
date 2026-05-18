create extension if not exists pgcrypto;

create table if not exists public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  table_number text not null unique,
  active boolean not null default true
);

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories(id) on delete restrict,
  name text not null,
  description text,
  image_url text,
  price numeric(10, 2) not null check (price >= 0),
  is_veg boolean not null default false,
  is_non_veg boolean not null default false,
  is_bestseller boolean not null default false,
  active boolean not null default true
);

create table if not exists public.qr_orders (
  id uuid primary key default gen_random_uuid(),
  table_number text not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  customer_dob text,
  notes text,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  total numeric(10, 2) not null check (total >= 0),
  status text not null default 'NEW' check (status in ('NEW', 'PREPARING', 'READY', 'COMPLETED')),
  payment_status text not null default 'UNPAID' check (payment_status in ('UNPAID', 'PAID')),
  client_order_token text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.qr_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.qr_orders(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete restrict,
  item_name text not null,
  qty int not null check (qty > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  total_price numeric(10, 2) not null check (total_price >= 0)
);

create index if not exists idx_menu_items_category on public.menu_items(category_id);
create index if not exists idx_qr_orders_table_created on public.qr_orders(table_number, created_at desc);
create index if not exists idx_qr_order_items_order on public.qr_order_items(order_id);

alter table public.restaurant_tables enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.qr_orders enable row level security;
alter table public.qr_order_items enable row level security;

create policy if not exists "Public can read active tables" on public.restaurant_tables
for select
using (active = true);

create policy if not exists "Public can read categories" on public.menu_categories
for select
using (true);

create policy if not exists "Public can read active items" on public.menu_items
for select
using (active = true);
