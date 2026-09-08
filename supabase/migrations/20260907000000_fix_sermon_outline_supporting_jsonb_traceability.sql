CREATE OR REPLACE FUNCTION public.validate_sermon_outline_traceability()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
declare
  sermon_study_id uuid;
begin
  select s.study_id into sermon_study_id
  from public.expository_sermons s
  where s.id = new.sermon_id
    and s.user_id = auth.uid();

  if sermon_study_id is null then
    raise exception 'Sermon outline point must reference a sermon owned by the current user.';
  end if;

  if exists (
    select 1 from unnest(coalesce(new.text_observation_ids, '{}'::uuid[])) as source_id
    where not exists (
      select 1 from public.study_observations o
      where o.id = source_id and o.study_id = sermon_study_id and o.user_id = auth.uid()
    )
  ) or exists (
    select 1 from jsonb_array_elements_text(coalesce(new.supporting_observation_ids, '[]'::jsonb)) as source_id
    where not exists (
      select 1 from public.study_observations o
      where o.id = source_id::uuid and o.study_id = sermon_study_id and o.user_id = auth.uid()
    )
  ) then
    raise exception 'Sermon outline traceability contains an observation outside the current Study.';
  end if;

  if exists (
    select 1 from unnest(coalesce(new.meaning_interpretation_ids, '{}'::uuid[])) as source_id
    where not exists (
      select 1 from public.study_interpretations i
      where i.id = source_id and i.study_id = sermon_study_id and i.user_id = auth.uid()
    )
  ) or exists (
    select 1 from jsonb_array_elements_text(coalesce(new.supporting_interpretation_ids, '[]'::jsonb)) as source_id
    where not exists (
      select 1 from public.study_interpretations i
      where i.id = source_id::uuid and i.study_id = sermon_study_id and i.user_id = auth.uid()
    )
  ) then
    raise exception 'Sermon outline traceability contains an interpretation outside the current Study.';
  end if;

  if exists (
    select 1 from unnest(coalesce(new.meaning_evidence_ids, '{}'::text[])) as source_id
    where not exists (
      select 1 from public.interpretation_evidence e
      where e.id::text = source_id and e.study_id = sermon_study_id and e.user_id = auth.uid()
    )
  ) or exists (
    select 1 from jsonb_array_elements_text(coalesce(new.supporting_evidence_ids, '[]'::jsonb)) as source_id
    where not exists (
      select 1 from public.interpretation_evidence e
      where e.id::text = source_id and e.study_id = sermon_study_id and e.user_id = auth.uid()
    )
  ) then
    raise exception 'Sermon outline traceability contains evidence outside the current Study.';
  end if;

  if exists (
    select 1 from unnest(coalesce(new.response_application_ids, '{}'::text[])) as source_id
    where not exists (
      select 1 from public.study_applications a
      where a.id::text = source_id and a.study_id = sermon_study_id and a.user_id = auth.uid()
    )
  ) or exists (
    select 1 from jsonb_array_elements_text(coalesce(new.supporting_application_ids, '[]'::jsonb)) as source_id
    where not exists (
      select 1 from public.study_applications a
      where a.id::text = source_id and a.study_id = sermon_study_id and a.user_id = auth.uid()
    )
  ) then
    raise exception 'Sermon outline traceability contains an application outside the current Study.';
  end if;

  if exists (
    select 1 from unnest(coalesce(new.supporting_biblical_theology_ids, '{}'::uuid[])) as source_id
    where not exists (
      select 1 from public.biblical_theology_entries bt
      where bt.id = source_id and bt.study_id = sermon_study_id and bt.user_id = auth.uid()
    )
  ) then
    raise exception 'Sermon outline traceability contains Biblical Theology outside the current Study.';
  end if;

  return new;
end;
$$;
