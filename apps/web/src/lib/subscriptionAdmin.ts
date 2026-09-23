import { createClient } from "@supabase/supabase-js";

export class SubscriptionAdminError extends Error {
    readonly status: 401 | 403 | 503;

    constructor(message: string, status: 401 | 403 | 503) {
        super(message);
        this.name = "SubscriptionAdminError";
        this.status = status;
    }
}

function requiredEnvironment() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !publishableKey || !serviceRoleKey) {
        throw new SubscriptionAdminError("Subscription administration is not configured on the server.", 503);
    }
    return { url, publishableKey, serviceRoleKey };
}

function bearer(request: Request): string {
    const value = request.headers.get("authorization");
    if (!value?.startsWith("Bearer ")) {
        throw new SubscriptionAdminError("A signed-in Supabase session is required.", 401);
    }
    const token = value.slice(7).trim();
    if (!token) throw new SubscriptionAdminError("A signed-in Supabase session is required.", 401);
    return token;
}

export async function requireSubscriptionAdmin(request: Request) {
    const { url, publishableKey, serviceRoleKey } = requiredEnvironment();
    const token = bearer(request);
    const authClient = createClient(url, publishableKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await authClient.auth.getUser(token);
    if (error || !data.user) {
        throw new SubscriptionAdminError("A valid signed-in Supabase session is required.", 401);
    }

    const adminClient = createClient(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: role, error: roleError } = await adminClient
        .from("platform_user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();
    if (roleError) throw new SubscriptionAdminError("Unable to verify subscription administration access.", 503);
    if (!role) throw new SubscriptionAdminError("Subscription administration access is required.", 403);

    return { userId: data.user.id, adminClient };
}
