import { createFileRoute } from "@tanstack/react-router";
import { hasAccess, planIdFromProduct } from "@/lib/paddle-env";
import { planById } from "@/lib/plans";
import type { PaddleEnv } from "@/lib/paddle.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertSubscription(data: any, env: PaddleEnv) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const userId = data.customData?.userId;
  const item = data.items?.[0];
  const productId = item?.product?.importMeta?.externalId ?? item?.product?.externalId;
  const priceId = item?.price?.importMeta?.externalId ?? item?.price?.externalId;
  const planId = productId ? planIdFromProduct(productId) : null;
  const plan = planId ? planById(planId) : undefined;
  if (!userId || !plan) {
    console.warn("Skipping subscription: missing userId or plan", { productId });
    return;
  }
  const status: string = data.status;
  const periodEnd: string | null = data.currentBillingPeriod?.endsAt ?? null;
  const { error } = await supabaseAdmin.from("subscriptions").upsert(
    {
      user_id: userId,
      paddle_subscription_id: data.id,
      paddle_customer_id: data.customerId,
      plan_id: plan.id,
      price_id: priceId,
      tracks_limit: plan.tracks,
      paddle_status: status,
      status: hasAccess(status) ? "active" : "inactive",
      started_at: data.currentBillingPeriod?.startsAt ?? data.createdAt ?? new Date().toISOString(),
      expires_at: periodEnd,
      cancel_at_period_end: data.scheduledChange?.action === "cancel",
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "paddle_subscription_id" },
  );
  if (error) throw error;
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env: PaddleEnv = url.searchParams.get("env") === "live" ? "live" : "sandbox";
        try {
          const { verifyWebhook, EventName } = await import("@/lib/paddle.server");
          const event = await verifyWebhook(request, env);
          switch (event.eventType) {
            case EventName.SubscriptionCreated:
            case EventName.SubscriptionUpdated:
            case EventName.SubscriptionCanceled:
              await upsertSubscription(event.data, env);
              break;
            default:
              console.log("Unhandled event:", event.eventType);
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
