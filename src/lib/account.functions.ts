import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { FREE_TRACKS, planById } from "./plans";
import { getPaddleEnvironment } from "./paddle-env";

export type AccountState = {
  userId: string;
  email: string;
  isAdmin: boolean;
  planId: string;
  planName: string;
  limit: number;
  used: number;
  remaining: number;
  periodLabel: string;
  paymentStatus: string | null;
  hasPaymentSubscription: boolean;
  cancelAtPeriodEnd: boolean;
};

function monthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export const getAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccountState> => {
    const { supabase, userId, claims } = context;
    const email = (claims as { email?: string }).email ?? "";

    const [{ data: sub }, { data: roles }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("plan_id, tracks_limit, expires_at, started_at, paddle_status, paddle_subscription_id, cancel_at_period_end")
        .eq("user_id", userId)
        .eq("status", "active")
        .or(`environment.eq.${getPaddleEnvironment()},and(environment.is.null,paddle_subscription_id.is.null)`)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    const active = sub && (!sub.expires_at || new Date(sub.expires_at) > new Date()) ? sub : null;

    let used = 0;
    if (active) {
      const { count } = await supabase
        .from("track_usages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .or(`environment.eq.${getPaddleEnvironment()},environment.is.null`)
        .gte("created_at", active.paddle_subscription_id ? active.started_at : monthStart());
      used = count ?? 0;
    } else {
      const { count } = await supabase
        .from("track_usages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .or(`environment.eq.${getPaddleEnvironment()},environment.is.null`);
      used = count ?? 0;
    }

    const limit = active ? active.tracks_limit : FREE_TRACKS;

    return {
      userId,
      email,
      isAdmin: (roles ?? []).some((r) => r.role === "admin"),
      planId: active ? active.plan_id : "free",
      planName: active ? (planById(active.plan_id)?.name ?? active.plan_id) : "Gratuito",
      limit,
      used,
      remaining: Math.max(0, limit - used),
      periodLabel: active ? "neste mês" : "no total (teste gratuito)",
      paymentStatus: active?.paddle_status ?? null,
      hasPaymentSubscription: Boolean(active?.paddle_subscription_id),
      cancelAtPeriodEnd: Boolean(active?.cancel_at_period_end),
    };
  });

export const consumeTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { fileName?: string; goalId?: string }) => ({
    fileName: String(data?.fileName ?? "").slice(0, 200),
    goalId: String(data?.goalId ?? "").slice(0, 50),
  }))
  .handler(async ({ data, context }): Promise<{ ok: boolean; remaining: number; reason?: string }> => {
    const { data: result, error } = await context.supabase.rpc("consume_audio_track", {
      p_environment: getPaddleEnvironment(),
      p_file_name: data.fileName,
      p_goal_id: data.goalId,
    });
    if (error) throw new Error("Não foi possível registrar o uso.");
    return result as { ok: boolean; remaining: number; reason?: string };
  });

