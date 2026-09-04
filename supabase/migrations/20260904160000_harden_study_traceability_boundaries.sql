-- Production hardening for the study -> theology -> teaching -> sermon pipeline.
-- Existing RLS policies establish row ownership; these policies additionally require
-- every new foreign/traceability relationship to stay inside the signed-in user's Study.

-- Teaching plans must belong to a Study owned by the current user.
drop policy if exists "teaching_plans_insert_own" on public.teaching_plans;
create policy "teaching_plans_insert_own"
    on public.teaching_plans for insert
    with check (
        auth.uid() = user_id
        and exists (
            select 1 from public.studies s
            where s.id = teaching_plans.study_id
              and s.user_id = auth.uid()
        )
    );

drop policy if exists "teaching_plans_update_own" on public.teaching_plans;
create policy "teaching_plans_update_own"
    on public.teaching_plans for update
    using (auth.uid() = user_id)
    with check (
        auth.uid() = user_id
        and exists (
            select 1 from public.studies s
            where s.id = teaching_plans.study_id
              and s.user_id = auth.uid()
        )
    );

-- Biblical Theology entries must remain attached to the user's Study.
drop policy if exists "biblical theology insert own" on public.biblical_theology_entries;
create policy "biblical theology insert own"
    on public.biblical_theology_entries for insert
    with check (
        auth.uid() = user_id
        and exists (
            select 1 from public.studies s
            where s.id = biblical_theology_entries.study_id
              and s.user_id = auth.uid()
        )
    );

drop policy if exists "biblical theology update own" on public.biblical_theology_entries;
create policy "biblical theology update own"
    on public.biblical_theology_entries for update
    using (auth.uid() = user_id)
    with check (
        auth.uid() = user_id
        and exists (
            select 1 from public.studies s
            where s.id = biblical_theology_entries.study_id
              and s.user_id = auth.uid()
        )
    );

-- A sermon may only reference a Study and Teaching Plan owned by the same user,
-- and the Teaching Plan must belong to the same Study as the sermon.
drop policy if exists "Users can create their own sermons" on public.expository_sermons;
create policy "Users can create their own sermons"
    on public.expository_sermons for insert
    with check (
        auth.uid() = user_id
        and exists (
            select 1 from public.studies s
            where s.id = expository_sermons.study_id
              and s.user_id = auth.uid()
        )
        and (
            teaching_plan_id is null
            or exists (
                select 1 from public.teaching_plans tp
                where tp.id = expository_sermons.teaching_plan_id
                  and tp.study_id = expository_sermons.study_id
                  and tp.user_id = auth.uid()
            )
        )
    );

drop policy if exists "Users can update their own sermons" on public.expository_sermons;
create policy "Users can update their own sermons"
    on public.expository_sermons for update
    using (auth.uid() = user_id)
    with check (
        auth.uid() = user_id
        and exists (
            select 1 from public.studies s
            where s.id = expository_sermons.study_id
              and s.user_id = auth.uid()
        )
        and (
            teaching_plan_id is null
            or exists (
                select 1 from public.teaching_plans tp
                where tp.id = expository_sermons.teaching_plan_id
                  and tp.study_id = expository_sermons.study_id
                  and tp.user_id = auth.uid()
            )
        )
    );

-- Outline points and preaching occurrences must reference the current user's sermon.
drop policy if exists "Users can create their own sermon outline points" on public.sermon_outline_points;
create policy "Users can create their own sermon outline points"
    on public.sermon_outline_points for insert
    with check (
        auth.uid() = user_id
        and exists (
            select 1 from public.expository_sermons s
            where s.id = sermon_outline_points.sermon_id
              and s.user_id = auth.uid()
        )
    );

drop policy if exists "Users can update their own sermon outline points" on public.sermon_outline_points;
create policy "Users can update their own sermon outline points"
    on public.sermon_outline_points for update
    using (auth.uid() = user_id)
    with check (
        auth.uid() = user_id
        and exists (
            select 1 from public.expository_sermons s
            where s.id = sermon_outline_points.sermon_id
              and s.user_id = auth.uid()
        )
    );

drop policy if exists "sermon_occurrences_insert_own" on public.sermon_occurrences;
create policy "sermon_occurrences_insert_own"
    on public.sermon_occurrences for insert
    with check (
        auth.uid() = user_id
        and exists (
            select 1 from public.expository_sermons s
            where s.id = sermon_occurrences.sermon_id
              and s.user_id = auth.uid()
        )
    );

drop policy if exists "sermon_occurrences_update_own" on public.sermon_occurrences;
create policy "sermon_occurrences_update_own"
    on public.sermon_occurrences for update
    using (auth.uid() = user_id)
    with check (
        auth.uid() = user_id
        and exists (
            select 1 from public.expository_sermons s
            where s.id = sermon_occurrences.sermon_id
              and s.user_id = auth.uid()
        )
    );

-- Validate the source-traceability UUID arrays stored on teaching plans.
create or replace function public.validate_teaching_plan_traceability()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    if exists (
        select 1
        from unnest(coalesce(new.supporting_interpretation_ids, '{}'::uuid[])) as source_id
        where not exists (
            select 1 from public.study_interpretations i
            where i.id = source_id
              and i.study_id = new.study_id
              and i.user_id = auth.uid()
        )
    ) then
        raise exception 'Teaching Plan traceability contains an interpretation outside the current Study.';
    end if;

    if exists (
        select 1
        from unnest(coalesce(new.supporting_biblical_theology_ids, '{}'::uuid[])) as source_id
        where not exists (
            select 1 from public.biblical_theology_entries bt
            where bt.id = source_id
              and bt.study_id = new.study_id
              and bt.user_id = auth.uid()
        )
    ) then
        raise exception 'Teaching Plan traceability contains a Biblical Theology entry outside the current Study.';
    end if;

    return new;
end;
$$;

drop trigger if exists validate_teaching_plan_traceability on public.teaching_plans;
create trigger validate_teaching_plan_traceability
before insert or update on public.teaching_plans
for each row execute function public.validate_teaching_plan_traceability();

-- Validate Biblical Theology's linked interpretations against its Study.
create or replace function public.validate_biblical_theology_traceability()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    if exists (
        select 1
        from unnest(coalesce(new.interpretation_ids, '{}'::uuid[])) as source_id
        where not exists (
            select 1 from public.study_interpretations i
            where i.id = source_id
              and i.study_id = new.study_id
              and i.user_id = auth.uid()
        )
    ) then
        raise exception 'Biblical Theology traceability contains an interpretation outside the current Study.';
    end if;

    return new;
end;
$$;

drop trigger if exists validate_biblical_theology_traceability on public.biblical_theology_entries;
create trigger validate_biblical_theology_traceability
before insert or update on public.biblical_theology_entries
for each row execute function public.validate_biblical_theology_traceability();

-- Validate all sermon-outline source arrays against the sermon Study.
create or replace function public.validate_sermon_outline_traceability()
returns trigger
language plpgsql
set search_path = public
as $$
declare
    sermon_study_id uuid;
begin
    select s.study_id
      into sermon_study_id
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
        select 1 from unnest(coalesce(new.supporting_observation_ids, '{}'::uuid[])) as source_id
        where not exists (
            select 1 from public.study_observations o
            where o.id = source_id and o.study_id = sermon_study_id and o.user_id = auth.uid()
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
        select 1 from unnest(coalesce(new.supporting_interpretation_ids, '{}'::uuid[])) as source_id
        where not exists (
            select 1 from public.study_interpretations i
            where i.id = source_id and i.study_id = sermon_study_id and i.user_id = auth.uid()
        )
    ) then
        raise exception 'Sermon outline traceability contains an interpretation outside the current Study.';
    end if;

    if exists (
        select 1 from unnest(coalesce(new.meaning_evidence_ids, '{}'::uuid[])) as source_id
        where not exists (
            select 1 from public.interpretation_evidence e
            where e.id = source_id and e.study_id = sermon_study_id and e.user_id = auth.uid()
        )
    ) or exists (
        select 1 from unnest(coalesce(new.supporting_evidence_ids, '{}'::uuid[])) as source_id
        where not exists (
            select 1 from public.interpretation_evidence e
            where e.id = source_id and e.study_id = sermon_study_id and e.user_id = auth.uid()
        )
    ) then
        raise exception 'Sermon outline traceability contains evidence outside the current Study.';
    end if;

    if exists (
        select 1 from unnest(coalesce(new.response_application_ids, '{}'::uuid[])) as source_id
        where not exists (
            select 1 from public.study_applications a
            where a.id = source_id and a.study_id = sermon_study_id and a.user_id = auth.uid()
        )
    ) or exists (
        select 1 from unnest(coalesce(new.supporting_application_ids, '{}'::uuid[])) as source_id
        where not exists (
            select 1 from public.study_applications a
            where a.id = source_id and a.study_id = sermon_study_id and a.user_id = auth.uid()
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

drop trigger if exists validate_sermon_outline_traceability on public.sermon_outline_points;
create trigger validate_sermon_outline_traceability
before insert or update on public.sermon_outline_points
for each row execute function public.validate_sermon_outline_traceability();
