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

The administration layer deliberately manages product capability data only. It does not expose payment credentials, choose a payment provider, or make customer billing changes.

## AI quota enforcement

The reserved entitlement key `ai_monthly_operations` represents a finite monthly count of AI operations when its `limit_unit` is `count` and `limit_value` is populated on the user's active or trialing plan.

Before any metered AI mentor call, the server checks the user's current-month `ai_usage_events` count against that entitlement. Biblical Research performs the same preflight check. A request that reaches the configured limit is rejected before the provider is called and returns HTTP 429 with an account-facing quota message.

When no service-role key is configured, quota enforcement is intentionally disabled so local development and existing non-metered deployments are not broken. When a signed-in user has no active/trialing subscription, or the current plan has no finite `ai_monthly_operations` entitlement, the request remains allowed and the UI reports that no finite quota is configured.

The current implementation is a lightweight preflight guard. It deliberately does not attempt to make external-provider calls and database usage accounting one atomic transaction. Concurrent requests can therefore race near the limit. Production billing should add an atomic reservation/allowance mechanism before hard enforcement becomes a financial control.

## Relationship to AI metering

`ai_usage_events` remains the usage ledger. Subscription entitlements read that ledger rather than copying prompts, generated content, or Study evidence into billing records. The AI Usage page displays both recorded activity and the current subscription allowance when one is configured.

## Deliberately deferred

This phase does not connect a payment provider, publish pricing, create checkout sessions, process webhooks, or choose final plan values. Those decisions remain separate from the entitlement and metering infrastructure.
