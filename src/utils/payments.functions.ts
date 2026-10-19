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

export const changePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { planId: string }) => ({ planId: String(data?.planId ?? "") }))
  .handler(async ({ data, context }): Promise<{ ok: boolean; message: string }> => {
    const priceExternalId = PLAN_PRICE_IDS[data.planId];
    if (!Object.hasOwn(PLAN_PRICE_IDS, data.planId) || !priceExternalId) return { ok: false, message: "Plano inválido." };
    const env = getPaddleEnvironment();
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("paddle_subscription_id, plan_id, paddle_status")
      .eq("user_id", context.userId)
      .eq("environment", env)
      .eq("status", "active")
      .not("paddle_subscription_id", "is", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.paddle_subscription_id) return { ok: false, message: "Nenhuma assinatura ativa para alterar." };
    if (sub.plan_id === data.planId) return { ok: false, message: "Este já é o seu plano." };
    if (sub.paddle_status !== "active" && sub.paddle_status !== "trialing") {
      return { ok: false, message: "Regularize o pagamento em Gerenciar assinatura antes de trocar de plano." };
    }
    const { gatewayFetch } = await import("@/lib/paddle.server");
    const priceRes = await gatewayFetch(env, `/prices?external_id=${encodeURIComponent(priceExternalId)}`);
    const priceJson = priceRes.ok ? await priceRes.json() : null;
    const paddlePriceId = priceJson?.data?.[0]?.id as string | undefined;
    if (!paddlePriceId) return { ok: false, message: "Plano indisponível no momento." };
    const res = await gatewayFetch(env, `/subscriptions/${encodeURIComponent(sub.paddle_subscription_id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        items: [{ price_id: paddlePriceId, quantity: 1 }],
        proration_billing_mode: "prorated_immediately",
        scheduled_change: null,
      }),
    });
    if (!res.ok) {
      console.error("Plan change failed", res.status, await res.text());
      return { ok: false, message: "Não foi possível trocar o plano. Verifique sua forma de pagamento e tente novamente." };
    }
    return { ok: true, message: "Plano alterado! A diferença proporcional foi cobrada e a nova cota já vale." };
  });
