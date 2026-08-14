alter table public.sermon_outline_points
    add column if not exists text_observation_ids uuid[] not null default '{}'::uuid[],
    add column if not exists meaning_interpretation_ids uuid[] not null default '{}'::uuid[];
