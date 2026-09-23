# BSMP AI Usage Metering

BSMP now has a provider-neutral `ai_usage_events` ledger for recording AI operations without storing prompts or generated content in the usage ledger.

## Recorded fields

Each event can record:

- signed-in user
- optional Study
- feature and operation
- AI provider and model
- success or error status
- elapsed time
- provider-reported token counts when available
- estimated cost when available
- a small metadata object for non-content accounting dimensions
- creation timestamp

## Security boundary

The table is readable only by the owning authenticated user. It intentionally has no client insert, update, or delete policy. Server-side recording uses `SUPABASE_SERVICE_ROLE_KEY`, which must never be exposed through a `NEXT_PUBLIC_*` variable or committed to source control.

The usage logger is best-effort while this foundation is being introduced: missing server-role configuration does not block an otherwise valid AI request. Production subscription enforcement should require the service-role configuration and treat the usage ledger as the trusted accounting source.

## Current integration

Biblical Research is the first instrumented AI operation. The same ledger is designed to cover the existing mentor providers and future AI capabilities without changing the subscription model.

## Subscription roadmap

The ledger is intentionally separate from plan definitions and payment processing. A future subscription layer can add plan entitlements, monthly quotas, provider budgets, overage rules, payment status, and billing-provider integration while continuing to use `ai_usage_events` for actual consumption.
