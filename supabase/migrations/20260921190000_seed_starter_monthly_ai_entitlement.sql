-- Seed the first enforced Starter Monthly entitlement.
-- This is the one entitlement already consumed by the server-side AI quota guard.
insert into public.subscription_plan_entitlements (
    plan_id,
    entitlement_key,
    enabled,
    limit_value,
    limit_unit,
    metadata
)
select
    p.id,
    'ai_monthly_operations',
    true,
    100,
    'count',
    jsonb_build_object(
        'description', 'Maximum recorded AI operations per calendar month.',
        'source', 'starter_monthly_default'
    )
from public.subscription_plans p
where p.code = 'starter-monthly'
  and not exists (
      select 1
      from public.subscription_plan_entitlements e
      where e.plan_id = p.id
        and e.entitlement_key = 'ai_monthly_operations'
  );
