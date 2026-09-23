# BSMP Subscription & Entitlement Foundation

## Purpose

BSMP has a provider-neutral subscription data model that can support future paid plans, AI quotas, feature entitlements, and payment-provider integration without coupling billing logic to Study content or AI provider implementations.

## Tables

### `subscription_plans`

Defines the plans BSMP may publish. A plan has a stable code, display name, description, active flag, ordering, and metadata. Pricing is intentionally not fixed in this foundation.

### `subscription_plan_entitlements`

Stores plan capabilities and limits as reusable entitlement records. This can represent AI operation limits, token limits, feature access, or other product entitlements without changing the subscription schema.

### `user_subscriptions`

Stores a user's current and historical subscription state. The model supports trialing, active, past-due, paused, canceled, and incomplete states, plus an abstract provider and optional external customer/subscription identifiers.

Only the user's own subscription rows are readable through the authenticated client. Plan definitions and active entitlements are readable, while subscription mutations remain server-side.

## Subscription administration

`platform_user_roles` stores the small platform-level authorization boundary used by administrative workflows. The current role vocabulary contains `admin`. Authenticated users can only read their own role rows; role assignment and removal remain server-side operations.

`/settings/subscription/admin` is protected by a server-side admin check. The page can create and update plan definitions and plan entitlements through a server API. The Supabase service-role credential is never sent to the browser.

The administration layer also supports controlled **manual subscription assignment** and ending an existing subscription. Manual assignments use provider `manual`, start immediately, and remain open-ended unless a later billing integration supplies period dates. An active or trialing subscription must be ended before another plan can be assigned to the same account.

These manual controls are intended for administration and development/testing. They do not represent a payment, do not charge an account, and do not replace payment-provider webhooks.

## Subscription event history

`subscription_events` is the lifecycle audit ledger for subscription changes. It records the affected account, subscription, acting administrator when applicable, event type, provider, effective time, and non-sensitive metadata.

Manual plan assignments currently create `manual_assigned` events, and administrators ending a subscription create `canceled` events. PayFast COMPLETE and CANCELLED notifications are normalized into the same lifecycle ledger. Client applications can read only events belonging to the signed-in account. Administrative reads and writes use the server-side service role.

The `external_event_id` plus unique provider/event index is the idempotency boundary for provider webhook processing. A repeated PayFast ITN therefore returns the existing event instead of creating a second lifecycle record.

The audit ledger is deliberately separate from `ai_usage_events`: subscription lifecycle records do not contain prompts, generated content, or Study evidence.

## AI quota enforcement

The reserved entitlement key `ai_monthly_operations` represents a finite monthly count of AI operations when its `limit_unit` is `count` and `limit_value` is populated on the user's active or trialing plan.

Before any metered AI mentor call, the server checks the user's current-month `ai_usage_events` count against that entitlement. Biblical Research performs the same preflight check. A request that reaches the configured limit is rejected before the provider is called and returns HTTP 429 with an account-facing quota message.

When no service-role key is configured, quota enforcement is intentionally disabled so local development and existing non-metered deployments are not broken. When a signed-in user has no active/trialing subscription, or the current plan has no finite `ai_monthly_operations` entitlement, the request remains allowed and the UI reports that no finite quota is configured.

The current implementation is a lightweight preflight guard. It deliberately does not attempt to make external-provider calls and database usage accounting one atomic transaction. Concurrent requests can therefore race near the limit. Production billing should add an atomic reservation/allowance mechanism before hard enforcement becomes a financial control.

## Relationship to AI metering

`ai_usage_events` remains the usage ledger. Subscription entitlements read that ledger rather than copying prompts, generated content, or Study evidence into billing records. The AI Usage page displays both recorded activity and the current subscription allowance when one is configured.

## Deliberately deferred

Plan prices, live PayFast credentials, and production payment activation remain deployment configuration rather than repository data. Checkout and webhook code are implemented. PayFast sandbox billing has been exercised end-to-end; production activation remains deployment-controlled and requires live merchant credentials, recurring plan configuration, a public HTTPS notification URL, and final security/operational checks.

## Billing provider boundary

The reserved provider-neutral billing contract lives in `apps/web/src/lib/billingProvider.ts`. It defines future checkout-session creation, external-subscription cancellation, and verified webhook normalization without selecting a payment provider.

`BILLING_PROVIDER` is reserved for the future provider adapter selection. It is intentionally unset until a provider is chosen and connected. No provider secret belongs in client-exposed environment variables.

Future checkout should create a provider session and allow the provider webhook to establish authoritative `user_subscriptions` state. The browser must not directly create or mutate subscription records.

Provider synchronization now has a transactional server-side database boundary at `public.apply_subscription_billing_event(jsonb)`. The function is executable by the server service role only, uses the external provider event id for idempotency, updates `user_subscriptions`, and links the resulting state change to `subscription_events` in one transaction.

## PayFast billing

BSMP's intended payment provider is PayFast. The integration uses PayFast-hosted checkout for recurring subscriptions and keeps payment credentials and provider state on the server.

The `billing_checkout_intents` table records the server-generated payment reference and expected amount used to validate PayFast ITNs before subscription activation.

Once a verified PayFast notification is received, BSMP synchronizes the subscription through the transactional `apply_subscription_billing_event` database boundary and records the provider event in `subscription_events`.

