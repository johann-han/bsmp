alter table public.sermon_outline_points
    add column if not exists supporting_biblical_theology_ids uuid[] not null default '{}';
