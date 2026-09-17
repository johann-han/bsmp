# BSMP Subscription & Entitlement Foundation

## Purpose

BSMP now has a provider-neutral subscription data model that can support future paid plans, AI quotas, feature entitlements, and payment-provider integration without coupling billing logic to Study content or AI provider implementations.

## Tables

### `subscription_plans`

Defines the plans BSMP may publish. A plan has a stable code, display name, description, active flag, ordering, and metadata. Pricing is intentionally not fixed in this foundation.

### `subscription_plan_entitlements`

Stores plan capabilities and limits as reusable entitlement records. This can represent AI operation limits, token limits, feature access, or other product entitlements without changing the subscription schema.

### `user_subscriptions`

Stores a user's current and historical subscription state. The model supports trialing, active, past-due, paused, canceled, and incomplete states, plus an abstract provider and optional external customer/subscription identifiers.

Only the user's own subscription rows are readable through the authenticated client. Plan definitions and active entitlements are readable, while subscription mutations remain server-side.

## Relationship to AI metering

`ai_usage_events` remains the usage ledger. Subscription entitlements do not copy prompts, generated content, or Study evidence into billing records. A future server-side quota service can read the user's active entitlement and compare it with usage recorded in `ai_usage_events` for the current subscription period.

## Deliberately deferred

This phase does not connect a payment provider, publish pricing, create checkout sessions, process webhooks, or enforce quotas. Those decisions require the final product plan and billing provider choice.
