create or replace function public.sync_research_run_sources()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    delete from public.research_run_sources where research_run_id = new.id;

    insert into public.research_run_sources (
        user_id,
        research_run_id,
        research_source_id,
        url,
        title,
        provenance_type,
        citation_returned,
        created_at
    )
    select
        new.user_id,
        new.id,
        rs.id,
        trim(src.url),
        coalesce(nullif(trim(src.title), ''), trim(src.url)),
        'provider_citation',
        true,
        new.created_at
    from jsonb_to_recordset(new.sources) as src(url text, title text)
    left join public.research_sources rs
        on rs.user_id = new.user_id
       and rs.url = trim(src.url)
    where src.url is not null
      and trim(src.url) <> ''
    on conflict (research_run_id, url, provenance_type) do nothing;

    insert into public.research_run_sources (
        user_id,
        research_run_id,
        research_source_id,
        url,
        title,
        provenance_type,
        citation_returned,
        created_at
    )
    select
        new.user_id,
        new.id,
        rs.id,
        trim(src.url),
        coalesce(rs.title, trim(src.url)),
        'supplied_url',
        false,
        new.created_at
    from jsonb_array_elements_text(new.source_urls) as src(url)
    left join public.research_sources rs
        on rs.user_id = new.user_id
       and rs.url = trim(src.url)
    where trim(src.url) <> ''
    on conflict (research_run_id, url, provenance_type) do nothing;

    return new;
end;
$$;

drop trigger if exists research_runs_sync_source_provenance on public.research_runs;
create trigger research_runs_sync_source_provenance
after insert or update of sources, source_urls on public.research_runs
for each row execute function public.sync_research_run_sources();
