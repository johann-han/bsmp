alter table public.expository_sermons
    add column if not exists manuscript text,
    add column if not exists delivery_notes text;
