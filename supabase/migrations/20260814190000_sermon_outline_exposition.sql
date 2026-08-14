alter table public.sermon_outline_points
    add column if not exists explanation text,
    add column if not exists illustration text,
    add column if not exists application text,
    add column if not exists transition text;
