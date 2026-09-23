# BSMP AI Provider Architecture

BSMP treats AI services as replaceable providers rather than making one vendor part of the application's core architecture.

## Current provider roles

- **Gemini** is the primary provider for external contextual research because its integration can perform provider-side web retrieval.
- **OpenRouter free models** provide a no-token-cost fallback for Study-grounded research when Gemini is unavailable. OpenRouter's free access is rate-limited, so it is not an unlimited service.
- **OpenRouter web fetch** can support the fallback for externally supplied source URLs. General free web search is not assumed to be unlimited or free.

## Routing policy

The research API routes requests through a provider abstraction. A Gemini quota/rate-limit or configuration failure can trigger the OpenRouter fallback where the fallback has the information needed to operate safely.

For contextual external research, the OpenRouter fallback requires supplied HTTPS source URLs. It must not claim to have searched the wider web when it has only fetched supplied sources.

## Cost and subscription readiness

The architecture deliberately keeps provider selection separate from Study data. This allows future BSMP subscription and usage controls to be added without changing the Study/Observation/Interpretation/Biblical Theology data model.

A future paid system can add:

- user subscription tiers and entitlements
- AI usage accounting by request/token/provider
- monthly quotas and configurable overage behavior
- provider cost budgets and alerts
- administrator controls for provider priority and maximum spend
- billing integration without storing provider API keys in browser code

Until billing is implemented, provider availability and provider quotas remain external constraints. BSMP should never represent a free provider as unlimited.
