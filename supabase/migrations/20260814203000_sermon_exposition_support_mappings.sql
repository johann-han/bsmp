alter table public.sermon_outline_points
    add column if not exists meaning_evidence_ids text[] not null default '{}',
    add column if not exists response_application_ids text[] not null default '{}';
