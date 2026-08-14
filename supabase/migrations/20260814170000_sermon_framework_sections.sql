alter table public.expository_sermons
    add column if not exists introduction text,
    add column if not exists context text,
    add column if not exists conclusion text;
