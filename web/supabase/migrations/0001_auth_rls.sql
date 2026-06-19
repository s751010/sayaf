-- CloudMenu — recommended Row Level Security for the Next.js rebuild.
--
-- ⚠️ Apply this MANUALLY on the CloudMenu Supabase project
-- (ref: wjqpsbpebpntpeinqccl). This workspace's Supabase MCP is connected to a
-- different project, so it cannot run this for you.
--
-- Model: each row is owned by the authenticated user via `user_id = auth.uid()`.
-- Public menu pages read with the anon key, so SELECT stays public; writes are
-- restricted to the owner. Review against your real schema before applying.

-- ── restaurants ────────────────────────────────────────────────────
alter table public.restaurants enable row level security;

create policy "restaurants public read"
  on public.restaurants for select
  using (true);

create policy "restaurants owner write"
  on public.restaurants for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── menus ──────────────────────────────────────────────────────────
alter table public.menus enable row level security;

create policy "menus public read"
  on public.menus for select
  using (true);

create policy "menus owner write"
  on public.menus for all
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = menus.restaurant_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.restaurants r
      where r.id = menus.restaurant_id and r.user_id = auth.uid()
    )
  );

-- ── dishes ─────────────────────────────────────────────────────────
alter table public.dishes enable row level security;

create policy "dishes public read available"
  on public.dishes for select
  using (true);

create policy "dishes owner write"
  on public.dishes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
