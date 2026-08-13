create table if not exists public.study_markups (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  verse_number integer not null,
  word_index integer not null,
  symbol text not null check (symbol in ('N', '?', '!', '→')),
  created_at timestamptz not null default now(),
  unique (study_id, verse_number, word_index)
);

alter table public.study_markups enable row level security;

create policy "Users can view their study markups"
  on public.study_markups
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their study markups"
  on public.study_markups
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their study markups"
  on public.study_markups
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their study markups"
  on public.study_markups
  for delete
  to authenticated
  using (auth.uid() = user_id);
