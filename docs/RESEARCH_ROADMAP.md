# BSMP Biblical Research Roadmap

## Current Research Stage

BSMP now provides an authenticated, Study-grounded Biblical Research workspace at `/research?studyId=...`.

Research guidance is generated from the selected Study's passage, recorded observations, interpretations, and Biblical Theology syntheses. The API verifies the signed-in Supabase session and Study ownership before loading that context.

The first Research slice has passed repository CI and authenticated browser verification. It does not claim that external sources were retrieved.

## Next Stage: External Research Sources

The next Research increment should introduce external-source retrieval as a distinct layer rather than mixing retrieved material into the student's Study record.

The source layer should preserve:

- source title
- source URL
- source publisher or author when available
- retrieval timestamp
- short retrieved excerpt or normalized evidence payload
- the research question that caused the source to be retrieved
- explicit distinction between retrieved source material and student-authored Study material

External material must never be silently written into observations, interpretations, Biblical Theology, Teaching, or sermon content as though it were student-authored.

## Retrieval Boundaries

External retrieval should be explicit about what was actually consulted. Failed requests, unsupported sources, blocked pages, unavailable search configuration, and provider errors must be surfaced as retrieval failures rather than replaced with invented citations.

AI synthesis may summarize retrieved material only when the source payload is actually present. The assistant should retain provenance to the source record used for the synthesis.

## Planned Verification

Before any source-derived material is allowed to influence later sermon stages, verify:

1. an authenticated user can submit a research question;
2. retrieved sources are displayed with provenance;
3. source failures are shown without fabricated substitutes;
4. Study-authored evidence remains visually and structurally distinct from retrieved material;
5. refresh preserves any persisted source records if persistence is introduced;
6. links back to Study, Biblical Theology, and Teaching preserve the same Study context.

## Branching

This roadmap is being developed from verified Research PR #4 merge `59d2f6b6285bacb86d87964e718af3250189f704` on `feat/research-source-planning`. `main` remains untouched.
