alter table public.study_observations
    add column if not exists target_translation text,
    add column if not exists target_word_index integer,
    add column if not exists target_word_text text,
    add column if not exists target_markup_symbol text;

alter table public.study_observations
    drop constraint if exists study_observations_target_word_index_check;

alter table public.study_observations
    add constraint study_observations_target_word_index_check
    check (target_word_index is null or target_word_index >= 0);

with ranked as (
    select
        id,
        row_number() over (
            partition by
                study_id,
                verse_book,
                verse_chapter,
                verse_verse,
                coalesce(target_translation, ''),
                coalesce(target_word_index, -1),
                coalesce(target_word_text, ''),
                coalesce(target_markup_symbol, ''),
                statement
            order by created_at asc, id asc
        ) as duplicate_rank
    from public.study_observations
)
delete from public.study_observations observation
using ranked
where observation.id = ranked.id
  and ranked.duplicate_rank > 1;

create unique index if not exists study_observations_unique_target_statement
    on public.study_observations (
        study_id,
        verse_book,
        verse_chapter,
        verse_verse,
        coalesce(target_translation, ''),
        coalesce(target_word_index, -1),
        coalesce(target_word_text, ''),
        coalesce(target_markup_symbol, ''),
        statement
    );
