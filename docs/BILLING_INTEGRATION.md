# BSMP Billing Integration

## Current provider

BSMP uses PayFast as its first provider-specific payment integration. PayFast supports South African merchants and recurring subscriptions, including monthly, quarterly, biannual, and annual schedules. citeturn445863search1turn445863search10

`apps/web/src/lib/payfastBillingProvider.ts` implements the PayFast custom integration using the hosted PayFast payment form, recurring subscription fields, PayFast API subscription cancellation, and server-side ITN validation.

## Subscription buttons

Each active BSMP plan is rendered with a **Subscribe with PayFast** button on the Subscription page. The browser asks the authenticated BSMP server for a signed PayFast checkout form, then submits that form directly to the PayFast hosted payment page. This keeps the PayFast merchant credentials and passphrase on the server.

PayFast's official custom-integration documentation describes the same hosted form approach and supports subscription checkout through `subscription_type=1`, a recurring amount, frequency, and cycle count. citeturn436828search0

## Required server configuration

```text
BILLING_PROVIDER=payfast
PAYFAST_SANDBOX=true
PAYFAST_MERCHANT_ID=...
PAYFAST_MERCHANT_KEY=...
PAYFAST_PASSPHRASE=...
PUBLIC_APP_URL=https://your-public-domain.example
PAYFAST_PLAN_CONFIG={"starter-monthly":{"amount":99.00,"recurringAmount":99.00,"frequency":3,"cycles":0}}
PAYFAST_ITN_ALLOWED_IPS=...
```

`PAYFAST_PLAN_CONFIG` is keyed by the stable BSMP plan code. `frequency` values are 1 daily, 2 weekly, 3 monthly, 4 quarterly, 5 biannually, and 6 annually; `cycles=0` means an indefinite subscription. PayFast documents a minimum recurring amount of R5.00 for subscriptions. citeturn436828search0

All PayFast credentials and the subscription passphrase are server-only. They must not use `NEXT_PUBLIC_` prefixes.

## ITN security and synchronization

PayFast sends an Instant Transaction Notification to the `notify_url` before returning the buyer to the configured return URL. PayFast recommends verifying the signature, validating the source, confirming the merchant and payment data, and performing server-side validation of the notification. citeturn436828search0

BSMP therefore:

1. checks the incoming PayFast source IP against the currently published PayFast ranges;
2. checks the configured merchant ID;
3. verifies the MD5 security signature with the merchant passphrase;
4. POSTs the original notification back to the PayFast validation endpoint and requires `VALID`;
5. matches the notification to the pending BSMP payment attempt or existing PayFast subscription;
6. sends the normalized event through the atomic `apply_subscription_billing_event(jsonb)` synchronization path.

PayFast currently publishes these IPv4 ranges for ITN/source validation: `197.97.145.144/28`, `41.74.179.192/27`, `102.216.36.0/28`, `102.216.36.128/28`, and `144.126.193.139`. citeturn123401search1

## Subscription cancellation

PayFast's recurring-billing API exposes `PUT /subscriptions/:token/cancel`. BSMP uses that API when an administrator ends a PayFast-backed subscription. citeturn278835search0

## Sandbox

PayFast provides a sandbox for testing one-off and recurring payments without transferring real money. Their documentation recommends using the sandbox before switching to live credentials. citeturn436828search0

## Deliberately not automated

BSMP does not store or process card details. PayFast hosts the payment page, and BSMP receives server-side ITNs rather than handling payment-card data directly. PayFast describes itself as a PCI DSS Level 1 service provider. citeturn445863search14

No live PayFast credentials have been added to this repository, and no live customer payment has been initiated by this implementation phase.

