grant usage on schema public to anon, authenticated;

grant select on
  public.real_estate_interest_targets,
  public.real_estate_complexes,
  public.real_estate_complex_pyeong_options,
  public.real_estate_articles,
  public.real_estate_pyeong_price_metrics
to anon, authenticated;

alter table public.real_estate_interest_targets enable row level security;
alter table public.real_estate_complexes enable row level security;
alter table public.real_estate_complex_pyeong_options enable row level security;
alter table public.real_estate_articles enable row level security;
alter table public.real_estate_pyeong_price_metrics enable row level security;

drop policy if exists "real_estate_interest_targets_read" on public.real_estate_interest_targets;
create policy "real_estate_interest_targets_read"
on public.real_estate_interest_targets
for select
to anon, authenticated
using (true);

drop policy if exists "real_estate_complexes_read" on public.real_estate_complexes;
create policy "real_estate_complexes_read"
on public.real_estate_complexes
for select
to anon, authenticated
using (true);

drop policy if exists "real_estate_complex_pyeong_options_read" on public.real_estate_complex_pyeong_options;
create policy "real_estate_complex_pyeong_options_read"
on public.real_estate_complex_pyeong_options
for select
to anon, authenticated
using (true);

drop policy if exists "real_estate_articles_read" on public.real_estate_articles;
create policy "real_estate_articles_read"
on public.real_estate_articles
for select
to anon, authenticated
using (true);

drop policy if exists "real_estate_pyeong_price_metrics_read" on public.real_estate_pyeong_price_metrics;
create policy "real_estate_pyeong_price_metrics_read"
on public.real_estate_pyeong_price_metrics
for select
to anon, authenticated
using (true);
