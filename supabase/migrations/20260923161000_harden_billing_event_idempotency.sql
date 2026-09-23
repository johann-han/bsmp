-- Harden provider-event idempotency so unrelated unique violations cannot be
-- misclassified as duplicate provider events.
create or replace function public.apply_subscription_billing_event(p_event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_provider text;
    v_external_event_id text;
    v_event_type text;
    v_user_id uuid;
    v_plan_code text;
    v_plan_id uuid;
    v_external_customer_id text;
    v_external_subscription_id text;
    v_status text;
    v_current_period_start timestamptz;
    v_current_period_end timestamptz;
    v_cancel_at_period_end boolean;
    v_effective_at timestamptz;
    v_metadata jsonb;
    v_subscription_id uuid;
    v_event_id uuid;
    v_existing_user_id uuid;
    v_existing_plan_id uuid;
begin
    if p_event is null or jsonb_typeof(p_event) <> 'object' then
        raise exception using message = 'Billing event must be a JSON object.';
    end if;

    v_provider := lower(trim(coalesce(p_event->>'provider', '')));
    v_external_event_id := nullif(trim(coalesce(p_event->>'externalEventId', '')), '');
    v_event_type := lower(trim(coalesce(p_event->>'eventType', '')));
    v_plan_code := nullif(lower(trim(coalesce(p_event->>'planCode', ''))), '');
    v_external_customer_id := nullif(trim(coalesce(p_event->>'externalCustomerId', '')), '');
    v_external_subscription_id := nullif(trim(coalesce(p_event->>'externalSubscriptionId', '')), '');
    v_status := nullif(lower(trim(coalesce(p_event->>'status', ''))), '');
    v_current_period_start := case
        when nullif(trim(coalesce(p_event->>'currentPeriodStart', '')), '') is null then null
        else (p_event->>'currentPeriodStart')::timestamptz
    end;
    v_current_period_end := case
        when nullif(trim(coalesce(p_event->>'currentPeriodEnd', '')), '') is null then null
        else (p_event->>'currentPeriodEnd')::timestamptz
    end;
    v_cancel_at_period_end := case
        when p_event ? 'cancelAtPeriodEnd' then coalesce((p_event->>'cancelAtPeriodEnd')::boolean, false)
        else false
    end;
    v_effective_at := case
        when nullif(trim(coalesce(p_event->>'effectiveAt', '')), '') is null then now()
        else (p_event->>'effectiveAt')::timestamptz
    end;
    v_metadata := coalesce(p_event->'metadata', '{}'::jsonb);

    if v_provider = '' then
        raise exception using message = 'Billing provider is required.';
    end if;
    if v_external_event_id is null then
        raise exception using message = 'Billing event id is required for idempotent provider synchronization.';
    end if;
    if v_external_subscription_id is null then
        raise exception using message = 'External subscription id is required for provider subscription synchronization.';
    end if;
    if v_event_type not in ('activated', 'trial_started', 'past_due', 'paused', 'canceled', 'ended', 'provider_synced') then
        raise exception using message = 'Unsupported normalized billing event type.';
    end if;
    if v_status not in ('trialing', 'active', 'past_due', 'paused', 'canceled', 'incomplete') then
        raise exception using message = 'Unsupported normalized billing subscription status.';
    end if;
    if jsonb_typeof(v_metadata) <> 'object' then
        raise exception using message = 'Billing event metadata must be a JSON object.';
    end if;

    begin
        v_user_id := nullif(trim(coalesce(p_event->>'userId', '')), '')::uuid;
    exception when invalid_text_representation then
        raise exception using message = 'Billing event userId must be a valid UUID.';
    end;

    select id, user_id, plan_id
    into v_subscription_id, v_existing_user_id, v_existing_plan_id
    from public.user_subscriptions
    where provider = v_provider
      and external_subscription_id = v_external_subscription_id
    for update;

    if v_subscription_id is not null and v_user_id is not null and v_existing_user_id <> v_user_id then
        raise exception using message = 'Billing event user does not match the existing subscription.';
    end if;
    v_user_id := coalesce(v_user_id, v_existing_user_id);
    if v_user_id is null then
        raise exception using message = 'A userId is required when no existing provider subscription can be matched.';
    end if;

    insert into public.subscription_events (
        user_id, subscription_id, actor_user_id, event_type, provider,
        external_event_id, effective_at, metadata
    )
    values (
        v_user_id, v_subscription_id, null, v_event_type, v_provider,
        v_external_event_id, v_effective_at, v_metadata
    )
    on conflict (provider, external_event_id) where external_event_id is not null do nothing
    returning id into v_event_id;

    if v_event_id is null then
        select id, subscription_id
        into v_event_id, v_subscription_id
        from public.subscription_events
        where provider = v_provider
          and external_event_id = v_external_event_id;

        return jsonb_build_object('duplicate', true, 'eventId', v_event_id, 'subscriptionId', v_subscription_id);
    end if;

    if v_plan_code is not null then
        select id into v_plan_id
        from public.subscription_plans
        where code = v_plan_code;
        if v_plan_id is null then
            raise exception using message = 'Billing event plan code does not match a BSMP plan.';
        end if;
    end if;

    if v_subscription_id is not null then
        update public.user_subscriptions
        set
            plan_id = coalesce(v_plan_id, plan_id),
            status = v_status,
            external_customer_id = coalesce(v_external_customer_id, external_customer_id),
            current_period_start = case when p_event ? 'currentPeriodStart' then v_current_period_start else current_period_start end,
            current_period_end = case when p_event ? 'currentPeriodEnd' then v_current_period_end else current_period_end end,
            cancel_at_period_end = case when p_event ? 'cancelAtPeriodEnd' then v_cancel_at_period_end else cancel_at_period_end end,
            metadata = coalesce(metadata, '{}'::jsonb) || v_metadata,
            updated_at = now()
        where id = v_subscription_id;
    else
        if v_plan_id is null then
            raise exception using message = 'A planCode is required when creating a subscription from a provider event.';
        end if;

        insert into public.user_subscriptions (
            user_id, plan_id, status, provider, external_customer_id,
            external_subscription_id, current_period_start, current_period_end,
            cancel_at_period_end, metadata
        )
        values (
            v_user_id, v_plan_id, v_status, v_provider, v_external_customer_id,
            v_external_subscription_id, coalesce(v_current_period_start, v_effective_at),
            v_current_period_end, v_cancel_at_period_end, v_metadata
        )
        returning id into v_subscription_id;
    end if;

    update public.subscription_events
    set subscription_id = v_subscription_id
    where id = v_event_id;

    return jsonb_build_object('duplicate', false, 'eventId', v_event_id, 'subscriptionId', v_subscription_id);
end;
$;

revoke execute on function public.apply_subscription_billing_event(jsonb) from public, anon, authenticated;
grant execute on function public.apply_subscription_billing_event(jsonb) to service_role;
