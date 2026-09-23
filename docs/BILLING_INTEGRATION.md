# BSMP Billing Integration Boundary

## Purpose

BSMP now has a provider-neutral billing contract for the eventual payment and subscription provider.

The boundary deliberately keeps provider-specific concerns outside the subscription tables, AI metering, and Study workflow.

## Provider contract

`apps/web/src/lib/billingProvider.ts` defines the contract a future provider adapter must implement:

- create a checkout session for a BSMP plan;
- cancel an external subscription;
- verify provider webhooks and normalize them into BSMP subscription events.

A provider adapter returns normalized subscription events rather than allowing provider-specific payloads to flow through the rest of BSMP. Browser redirects are informational; verified provider notifications remain authoritative.

The normalized event includes the provider, optional external event id, affected user/account identifiers, optional plan code and external customer/subscription identifiers, subscription status, billing-period dates, cancellation timing, effective time, and metadata.

## Provider configuration

`BILLING_PROVIDER` is the reserved server-side configuration key for selecting the provider adapter.

PayFast is the intended BSMP payment provider. An unset `BILLING_PROVIDER` still means billing is not configured.

The configuration helper exposes only whether a provider id is configured and its normalized id. Provider secrets and webhook signing material remain server-only.

## Checkout boundary

The current checkout flow:

1. authenticates the current Supabase user;
2. resolves the requested active BSMP plan by its stable plan code;
3. passes the user, plan code, email, and trusted return URLs to the provider adapter;
4. creates a server-side checkout intent before returning the provider checkout session;
5. redirects the browser to the provider's returned checkout URL;
6. waits for the provider webhook to establish authoritative subscription state.

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

PayFast is the configured provider for the active billing integration branch. Checkout, recurring subscriptions, ITN verification, server confirmation, checkout-intent binding, and transactional subscription synchronization are implemented.

The provider-neutral contract remains available for another adapter in the future without changing the core subscription entitlement model. Stripe remains isolated and inactive.

## Atomic subscription synchronization

`public.apply_subscription_billing_event(jsonb)` is the server-side database boundary for applying a normalized provider event.

It requires an external event id and external subscription id, reserves the event idempotency key in `subscription_events`, resolves an existing provider subscription or creates one from a user and plan code, updates subscription state, and links the audit event to the resulting subscription within one database transaction.

The function is executable by `service_role` only. Anonymous and authenticated client roles cannot execute it directly.

`apps/web/src/lib/billingSubscriptionSync.ts` is the server-side application helper that validates the minimum event identity fields and calls this database function.

This transactional path is deliberately provider-neutral. Provider-specific adapters remain responsible for signature verification and normalization; they do not receive authority to write raw provider payloads directly into BSMP tables.


## Optional Stripe adapter

An optional Stripe adapter remains in the repository as a provider-neutral implementation example. It is not the payment provider used for BSMP.

`apps/web/src/lib/stripeBillingProvider.ts` calls Stripe server-side, creates hosted Checkout Sessions for recurring Prices, supports immediate or end-of-period cancellation, verifies `Stripe-Signature`, and normalizes subscription webhooks into the BSMP billing event contract. Stripe documents signature verification using the raw request body, the `Stripe-Signature` header, and the endpoint secret.

Plan-to-Price mapping is intentionally outside the public plan table: `STRIPE_PRICE_MAP` is a server-side JSON object keyed by stable BSMP plan code. This keeps provider price identifiers out of browser-visible configuration and avoids duplicating environment variables as plans are added.

Relevant server-only variables are `BILLING_PROVIDER`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the per-plan Stripe Price identifiers. They must not be prefixed with `NEXT_PUBLIC_`.

Stripe is not connected to the BSMP deployment. No Stripe credentials, products, or Prices have been added.


## PayFast integration

PayFast is the payment provider intended for BSMP. PayFast's current developer documentation supports custom hosted checkout forms and recurring subscriptions through its API. Recurring subscriptions use `subscription_type=1`; PayFast documents `cycles=0` for an indefinite subscription, with frequency values including monthly, quarterly, biannual, and annual. 

The BSMP PayFast adapter posts a signed subscription form to PayFast's hosted payment page. It uses the merchant ID, merchant key, passphrase, plan billing configuration, a server-generated `m_payment_id`, and a server-controlled `notify_url`. PayFast documents that the customer is redirected to its secure payment page and that the notification sent to the `notify_url` is the source used to confirm payment. 

PayFast ITNs are verified with the documented security checks: signature verification, source validation, expected amount comparison, and server confirmation against PayFast's `/eng/query/validate` endpoint. The ITN handler accepts both URL-encoded and multipart form submissions, including blank optional fields required for correct ITN signature reconstruction.

PayFast recurring-billing API operations use the subscription token returned in notifications. The current adapter supports cancellation; PayFast also exposes fetch, pause, unpause, update, and ad-hoc token operations for future management features. 

### PayFast configuration

Server-only environment variables:

- `BILLING_PROVIDER=payfast`
- `PAYFAST_MERCHANT_ID`
- `PAYFAST_MERCHANT_KEY`
- `PAYFAST_PASSPHRASE`
- `PAYFAST_SANDBOX=true` while testing
- `PUBLIC_APP_URL` for the public application origin used to construct the PayFast `notify_url` (use a public HTTPS development URL/tunnel for ITN testing)
- `PAYFAST_PLAN_CONFIG` containing recurring amount/frequency/cycles for each BSMP plan code
- `PAYFAST_ITN_ALLOWED_IPS` as an optional explicit allowlist in addition to DNS-based PayFast source validation

Do not expose PayFast credentials through `NEXT_PUBLIC_*` variables.

`billing_checkout_intents` records a server-generated payment reference and the expected initial amount. This lets the ITN handler bind PayFast's notification to the correct signed-in BSMP account and compare the received payment amount before activating subscription state.

Browser return URLs are informational only. BSMP treats a verified PayFast ITN, not the browser redirect, as the authoritative payment confirmation. Recurring COMPLETE notifications reactivate/update the existing PayFast subscription identified by its token; CANCELLED notifications move it to the canceled state. Provider event ids are persisted uniquely so a repeated ITN does not create a duplicate lifecycle event.

PayFast's sandbox is intended for testing without moving real funds and supports recurring-payment testing. A public `notify_url` is required for end-to-end ITN testing; local development therefore needs a publicly reachable development URL/tunnel. 

