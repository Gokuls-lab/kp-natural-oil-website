-- Add array column for multiple product images used by carousels
alter table public.products
  add column if not exists image_urls text[];

-- Optional normalized table for future flexibility (ordering, metadata)
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  position int default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_images_product_id on public.product_images(product_id);
create index if not exists idx_product_images_position on public.product_images(product_id, position);
