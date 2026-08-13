alter table public.study_markups
  add column if not exists translation text not null default 'asv';

alter table public.study_markups
  drop constraint if exists study_markups_study_id_verse_number_word_index_key;

alter table public.study_markups
  add constraint study_markups_study_translation_verse_word_key
  unique (study_id, translation, verse_number, word_index);
