import { createFileRoute } from "@tanstack/react-router";
import { subscriptionRecord } from "@/lib/payment-subscription";
import type { PaddleEnv } from "@/lib/paddle.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertSubscription(data: any, env: PaddleEnv, occurredAt: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: prior, error: readError } = await supabaseAdmin.from("subscriptions")
    .select("expires_at, started_at").eq("paddle_subscription_id", data.id).eq("environment", env).maybeSingle();
  if (readError) throw readError;
  const record = subscriptionRecord(data, env, occurredAt, prior?.expires_at, prior?.started_at);
  const { error } = await supabaseAdmin.rpc("apply_payment_subscription", { payment: record });
  if (error) throw error;
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = url.searchParams.get("env");
        if (env !== "sandbox" && env !== "live") return new Response("Invalid environment", { status: 400 });
        try {
          const { verifyWebhook, EventName } = await import("@/lib/paddle.server");
          const event = await verifyWebhook(request, env);
          switch (event.eventType) {
            case EventName.SubscriptionCreated:
            case EventName.SubscriptionActivated:
            case EventName.SubscriptionTrialing:
            case EventName.SubscriptionUpdated:
            case EventName.SubscriptionPastDue:
            case EventName.SubscriptionPaused:
            case EventName.SubscriptionResumed:
            case EventName.SubscriptionCanceled:
              await upsertSubscription(event.data, env, event.occurredAt);
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
