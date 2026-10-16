import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPaddleEnvironment, PLAN_PRICE_IDS } from "@/lib/paddle-env";

export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .inputValidator((data: { priceId: string; environment: "sandbox" | "live" }) => ({
    priceId: String(data?.priceId ?? "").replace(/[^a-z0-9_]/gi, "").slice(0, 60),
    environment: data?.environment === "live" ? ("live" as const) : ("sandbox" as const),
  }))
  .handler(async ({ data }) => {
    if (!Object.values(PLAN_PRICE_IDS).includes(data.priceId)) throw new Error("Invalid price");
    const { gatewayFetch } = await import("@/lib/paddle.server");
    const response = await gatewayFetch(data.environment, `/prices?external_id=${encodeURIComponent(data.priceId)}`);
    if (!response.ok) throw new Error("Price unavailable");
    const result = await response.json();
    if (!result.data?.length) throw new Error("Price not found");
    return result.data[0].id as string;
  });

export const getCustomerPortalUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ url: string | null }> => {
    const { supabase, userId } = context;
    const env = getPaddleEnvironment();
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("paddle_customer_id, paddle_subscription_id")
      .eq("user_id", userId)
      .eq("environment", env)
      .not("paddle_customer_id", "is", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.paddle_customer_id) return { url: null };
    const { getPaddleClient } = await import("@/lib/paddle.server");
    const session = await getPaddleClient(env).customerPortalSessions.create(
      sub.paddle_customer_id,
      sub.paddle_subscription_id ? [sub.paddle_subscription_id] : [],
    );
    return { url: session.urls.general.overview };
  });
