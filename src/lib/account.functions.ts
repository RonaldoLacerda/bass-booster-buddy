import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { FREE_TRACKS, planById } from "./plans";

export type AccountState = {
  email: string;
  isAdmin: boolean;
  planId: string;
  planName: string;
  limit: number;
  used: number;
  remaining: number;
  periodLabel: string;
  pendingRequest: { planName: string; createdAt: string } | null;
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

    const [{ data: sub }, { data: roles }, { data: pending }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("plan_id, tracks_limit, expires_at")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase
        .from("plan_requests")
        .select("plan_name, created_at")
        .eq("user_id", userId)
        .eq("status", "pendente")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const active = sub && (!sub.expires_at || new Date(sub.expires_at) > new Date()) ? sub : null;

    let used = 0;
    if (active) {
      const { count } = await supabase
        .from("track_usages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", monthStart());
      used = count ?? 0;
    } else {
      const { count } = await supabase
        .from("track_usages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      used = count ?? 0;
    }

    const limit = active ? active.tracks_limit : FREE_TRACKS;

    return {
      email,
      isAdmin: (roles ?? []).some((r) => r.role === "admin"),
      planId: active ? active.plan_id : "free",
      planName: active ? (planById(active.plan_id)?.name ?? active.plan_id) : "Gratuito",
      limit,
      used,
      remaining: Math.max(0, limit - used),
      periodLabel: active ? "neste mês" : "no total (teste gratuito)",
      pendingRequest: pending ? { planName: pending.plan_name, createdAt: pending.created_at } : null,
    };
  });

export const consumeTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { fileName?: string; goalId?: string }) => ({
    fileName: String(data?.fileName ?? "").slice(0, 200),
    goalId: String(data?.goalId ?? "").slice(0, 50),
  }))
  .handler(async ({ data, context }): Promise<{ ok: boolean; remaining: number; reason?: string }> => {
    const { supabase, userId } = context;

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("tracks_limit, expires_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const active = sub && (!sub.expires_at || new Date(sub.expires_at) > new Date()) ? sub : null;
    const limit = active ? active.tracks_limit : FREE_TRACKS;

    const query = supabase
      .from("track_usages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    const { count } = active ? await query.gte("created_at", monthStart()) : await query;
    const used = count ?? 0;

    if (used >= limit) {
      return {
        ok: false,
        remaining: 0,
        reason: active
          ? "Você já usou todas as faixas do seu plano neste mês."
          : "Seu teste gratuito já foi usado. Escolha um plano para continuar.",
      };
    }

    const { error } = await supabase.from("track_usages").insert({
      user_id: userId,
      file_name: data.fileName || null,
      goal_id: data.goalId || null,
    });
    if (error) return { ok: false, remaining: limit - used, reason: "Não foi possível registrar o uso." };

    return { ok: true, remaining: Math.max(0, limit - used - 1) };
  });

export const requestPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { planId: string; note?: string }) => ({
    planId: String(data?.planId ?? ""),
    note: String(data?.note ?? "").slice(0, 500),
  }))
  .handler(async ({ data, context }): Promise<{ ok: boolean; message: string }> => {
    const plan = planById(data.planId);
    if (!plan) return { ok: false, message: "Plano inválido." };

    const { supabase, userId, claims } = context;
    const email = (claims as { email?: string }).email ?? "";

    const { error } = await supabase.from("plan_requests").insert({
      user_id: userId,
      email,
      plan_id: plan.id,
      plan_name: plan.name,
      price: plan.price,
      note: data.note || null,
    });
    if (error) return { ok: false, message: "Não conseguimos registrar sua solicitação." };

    return { ok: true, message: "Solicitação enviada! Vamos entrar em contato pelo seu e-mail." };
  });

export type PlanRequestRow = {
  id: string;
  email: string;
  plan_name: string;
  plan_id: string;
  price: number;
  status: string;
  note: string | null;
  created_at: string;
};

export const listPlanRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PlanRequestRow[]> => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso restrito");

    const { data } = await supabase
      .from("plan_requests")
      .select("id, email, plan_name, plan_id, price, status, note, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    return (data ?? []).map((r) => ({ ...r, price: Number(r.price) }));
  });

export const resolvePlanRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: "pendente" | "aprovado" | "recusado" }) => ({
    id: String(data?.id ?? ""),
    status: data?.status,
  }))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso restrito");
    if (!["pendente", "aprovado", "recusado"].includes(data.status)) return { ok: false };

    const { data: row, error } = await supabase
      .from("plan_requests")
      .update({ status: data.status })
      .eq("id", data.id)
      .select("user_id, plan_id")
      .maybeSingle();
    if (error || !row) return { ok: false };

    if (data.status === "aprovado") {
      const plan = planById(row.plan_id);
      if (plan) {
        const expires = new Date();
        expires.setUTCMonth(expires.getUTCMonth() + 1);
        await supabase.from("subscriptions").insert({
          user_id: row.user_id,
          plan_id: plan.id,
          tracks_limit: plan.tracks,
          status: "active",
          expires_at: expires.toISOString(),
        });
      }
    }

    return { ok: true };
  });
