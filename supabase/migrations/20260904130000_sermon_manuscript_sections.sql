alter table public.expository_sermons
    add column if not exists manuscript_sections jsonb not null default '[]'::jsonb;
