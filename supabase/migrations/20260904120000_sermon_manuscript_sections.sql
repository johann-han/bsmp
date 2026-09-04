alter table public.expository_sermons
    add column if not exists manuscript_sections jsonb not null default '[]'::jsonb;

comment on column public.expository_sermons.manuscript_sections is
    'Traceable preacher-authored manuscript sections. Each section may reference a sermon outline point by outlinePointId.';
