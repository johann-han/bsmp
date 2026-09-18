# BSMP Billing Integration Boundary

## Purpose

BSMP now has a provider-neutral billing contract for the eventual payment and subscription provider.

The boundary deliberately keeps provider-specific concerns outside the subscription tables, AI metering, and Study workflow.

## Provider contract

`apps/web/src/lib/billingProvider.ts` defines the contract a future provider adapter must implement:

- create a checkout session for a BSMP plan;
- cancel an external subscription;
- verify provider webhooks and normalize them into BSMP subscription events.

A provider adapter returns normalized subscription events rather than allowing provider-specific payloads to flow through the rest of BSMP.

The normalized event includes the provider, optional external event id, affected user/account identifiers, optional plan code and external customer/subscription identifiers, subscription status, billing-period dates, cancellation timing, effective time, and metadata.

## Provider configuration

`BILLING_PROVIDER` is the reserved server-side configuration key for selecting the provider adapter.

At present no adapter is registered and no payment provider is connected. An unset `BILLING_PROVIDER` therefore means billing is not configured.

The configuration helper exposes only whether a provider id is configured and its normalized id. Provider secrets and webhook signing material remain server-only.

## Checkout boundary

Future checkout flow should:

1. authenticate the current Supabase user;
2. resolve the requested active BSMP plan by its stable plan code;
3. pass the user, plan code, email, and trusted return URLs to the provider adapter;
4. redirect the browser to the provider's returned checkout URL;
5. wait for the provider webhook to establish authoritative subscription state.

The browser should not create or directly mutate `user_subscriptions`.

## Webhook boundary

Future provider webhooks should:

1. receive the raw request body and signature headers;
2. let the provider adapter verify the signature;
3. normalize provider events into `NormalizedBillingEvent`;
4. use `externalEventId` as the provider idempotency key;
5. update `user_subscriptions` and append `subscription_events` using one server-side transactional path.

`subscription_events.external_event_id` already provides the database uniqueness boundary for provider/event pairs.

The webhook path must remain separate from AI usage records and Study content.

## Current state

No payment provider, checkout session, customer portal, webhook endpoint, product price, or public pricing value is configured by this phase.

The next provider-specific phase can add an adapter without changing the core subscription entitlement model.

## Atomic subscription synchronization

`public.apply_subscription_billing_event(jsonb)` is the server-side database boundary for applying a normalized provider event.

It requires an external event id and external subscription id, reserves the event idempotency key in `subscription_events`, resolves an existing provider subscription or creates one from a user and plan code, updates subscription state, and links the audit event to the resulting subscription within one database transaction.

The function is executable by `service_role` only. Anonymous and authenticated client roles cannot execute it directly.

`apps/web/src/lib/billingSubscriptionSync.ts` is the server-side application helper that validates the minimum event identity fields and calls this database function.

This transactional path is deliberately provider-neutral. Provider-specific adapters remain responsible for signature verification and normalization; they do not receive authority to write raw provider payloads directly into BSMP tables.

