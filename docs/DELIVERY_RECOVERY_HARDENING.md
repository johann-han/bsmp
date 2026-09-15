# Delivery Recovery Hardening

The Sermon Delivery workspace treats browser recovery state as optional convenience state rather than application state.

Current safeguards on `feat/final-sermon-drafting`:

- malformed or inaccessible `localStorage` never blocks Delivery Mode;
- saved `My Place` markers are checked against the currently loaded manuscript sections;
- stale section markers are removed silently when their section no longer exists;
- delivery manuscript section text is normalized defensively before rendering;
- stale `delivery-section-*` URL hashes are cleared only after the Delivery section-navigation DOM exists, preventing a valid recovery hash from being removed while the workspace is still loading;
- the route guard leaves unrelated URL hashes untouched.

The latest recovery-hash correction is commit `e93b33498d36032949267f6d8c2cc632bee8f18a` and repository CI run `902` completed successfully.

Recovery state must never become a permission mechanism, a persistence source of truth, or a requirement for opening the saved sermon. Supabase access remains governed by the authenticated client session and database row-level security.
