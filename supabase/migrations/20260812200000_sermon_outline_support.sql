alter table public.sermon_outline_points
    add column if not exists supporting_observation_ids jsonb not null default '[]'::jsonb,
    add column if not exists supporting_interpretation_ids jsonb not null default '[]'::jsonb,
    add column if not exists supporting_evidence_ids jsonb not null default '[]'::jsonb,
    add column if not exists supporting_application_ids jsonb not null default '[]'::jsonb;
