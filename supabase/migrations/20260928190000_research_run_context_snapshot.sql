alter table public.research_runs
    add column if not exists study_context_snapshot jsonb not null default '{
        "studyTitle": "",
        "passage": "",
        "observations": [],
        "interpretations": [],
        "biblicalTheology": []
    }'::jsonb;

comment on column public.research_runs.study_context_snapshot is
    'Immutable snapshot of the Study context supplied to the research run: title, passage, observations, interpretations, and Biblical Theology syntheses.';
