-- Guard JSONB sermon support mappings against malformed shapes and invalid UUID values.
-- The underlying RLS and Study-boundary checks remain authoritative; this prevents
-- malformed JSONB from causing unexpected cast/function errors during persistence.

create or replace function public.validate_sermon_outline_traceability()
returns trigger
language plpgsql
set search_path = public
as $$
declare
    sermon_study_id uuid;
    uuid_pattern constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
begin
    select s.study_id
      into sermon_study_id
      from public.expository_sermons s
     where s.id = new.sermon_id
       and s.user_id = auth.uid();

    if sermon_study_id is null then
        raise exception 'Sermon outline point must reference a sermon owned by the current user.';
    end if;

    -- Supporting observation/interpretation/evidence/application mappings are JSONB arrays.
    -- Reject non-array values and array members that are not valid UUID strings before casting.
    if jsonb_typeof(coalesce(new.supporting_observation_ids, '[]'::jsonb)) <> 'array'
       or exists (
            select 1
              from jsonb_array_elements(coalesce(new.supporting_observation_ids, '[]'::jsonb)) as item
             where jsonb_typeof(item) <> 'string'
                or (item #>> '{}') !~* uuid_pattern
       ) then
        raise exception 'Sermon outline supporting observations must be an array of UUID strings.';
    end if;

    if jsonb_typeof(coalesce(new.supporting_interpretation_ids, '[]'::jsonb)) <> 'array'
       or exists (
            select 1
              from jsonb_array_elements(coalesce(new.supporting_interpretation_ids, '[]'::jsonb)) as item
             where jsonb_typeof(item) <> 'string'
                or (item #>> '{}') !~* uuid_pattern
       ) then
        raise exception 'Sermon outline supporting interpretations must be an array of UUID strings.';
    end if;

    if jsonb_typeof(coalesce(new.supporting_evidence_ids, '[]'::jsonb)) <> 'array'
       or exists (
            select 1
              from jsonb_array_elements(coalesce(new.supporting_evidence_ids, '[]'::jsonb)) as item
             where jsonb_typeof(item) <> 'string'
       ) then
        raise exception 'Sermon outline supporting evidence must be an array of identifiers.';
    end if;

    if jsonb_typeof(coalesce(new.supporting_application_ids, '[]'::jsonb)) <> 'array'
       or exists (
            select 1
              from jsonb_array_elements(coalesce(new.supporting_application_ids, '[]'::jsonb)) as item
             where jsonb_typeof(item) <> 'string'
       ) then
        raise exception 'Sermon outline supporting applications must be an array of identifiers.';
    end if;

    -- UUID-backed traceability arrays.
    if exists (
        select 1
          from unnest(coalesce(new.text_observation_ids, '{}'::uuid[])) as source_id
         where not exists (
            select 1
              from public.study_observations o
             where o.id = source_id
               and o.study_id = sermon_study_id
               and o.user_id = auth.uid()
         )
    ) or exists (
        select 1
          from jsonb_array_elements_text(coalesce(new.supporting_observation_ids, '[]'::jsonb)) as source_id
         where not exists (
            select 1
              from public.study_observations o
             where o.id = source_id::uuid
               and o.study_id = sermon_study_id
               and o.user_id = auth.uid()
         )
    ) then
        raise exception 'Sermon outline traceability contains an observation outside the current Study.';
    end if;

    if exists (
        select 1
          from unnest(coalesce(new.meaning_interpretation_ids, '{}'::uuid[])) as source_id
         where not exists (
            select 1
              from public.study_interpretations i
             where i.id = source_id
               and i.study_id = sermon_study_id
               and i.user_id = auth.uid()
         )
    ) or exists (
        select 1
          from jsonb_array_elements_text(coalesce(new.supporting_interpretation_ids, '[]'::jsonb)) as source_id
         where not exists (
            select 1
              from public.study_interpretations i
             where i.id = source_id::uuid
               and i.study_id = sermon_study_id
               and i.user_id = auth.uid()
         )
    ) then
        raise exception 'Sermon outline traceability contains an interpretation outside the current Study.';
    end if;

    if exists (
        select 1
          from unnest(coalesce(new.meaning_evidence_ids, '{}'::text[])) as source_id
         where not exists (
            select 1
              from public.interpretation_evidence e
             where e.id::text = source_id
               and e.study_id = sermon_study_id
               and e.user_id = auth.uid()
         )
    ) or exists (
        select 1
          from jsonb_array_elements_text(coalesce(new.supporting_evidence_ids, '[]'::jsonb)) as source_id
         where not exists (
            select 1
              from public.interpretation_evidence e
             where e.id::text = source_id
               and e.study_id = sermon_study_id
               and e.user_id = auth.uid()
         )
    ) then
        raise exception 'Sermon outline traceability contains evidence outside the current Study.';
    end if;

    if exists (
        select 1
          from unnest(coalesce(new.response_application_ids, '{}'::text[])) as source_id
         where not exists (
            select 1
              from public.study_applications a
             where a.id::text = source_id
               and a.study_id = sermon_study_id
               and a.user_id = auth.uid()
         )
    ) or exists (
        select 1
          from jsonb_array_elements_text(coalesce(new.supporting_application_ids, '[]'::jsonb)) as source_id
         where not exists (
            select 1
              from public.study_applications a
             where a.id::text = source_id
               and a.study_id = sermon_study_id
               and a.user_id = auth.uid()
         )
    ) then
        raise exception 'Sermon outline traceability contains an application outside the current Study.';
    end if;

    if exists (
        select 1
          from unnest(coalesce(new.supporting_biblical_theology_ids, '{}'::uuid[])) as source_id
         where not exists (
            select 1
              from public.biblical_theology_entries bt
             where bt.id = source_id
               and bt.study_id = sermon_study_id
               and bt.user_id = auth.uid()
         )
    ) then
        raise exception 'Sermon outline traceability contains Biblical Theology outside the current Study.';
    end if;

    return new;
end;
$$;
