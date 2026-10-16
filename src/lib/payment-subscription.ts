import { planById } from "./plans";
import { PLAN_PRICE_IDS, planIdFromProduct } from "./paddle-env";

type SubscriptionEvent = {
  id: string;
  customerId: string;
  status: string;
  customData?: { userId?: string } | null;
  items: Array<{ product?: { importMeta?: { externalId?: string } | null }; price?: { importMeta?: { externalId?: string } | null } }>;
  currentBillingPeriod?: { startsAt: string; endsAt: string } | null;
  createdAt: string;
  scheduledChange?: { action?: string } | null;
};

export function subscriptionRecord(data: SubscriptionEvent, environment: "sandbox" | "live", occurredAt: string, priorEnd?: string | null, priorStart?: string) {
  const item = data.items[0];
  const productId = item?.product?.importMeta?.externalId;
  const priceId = item?.price?.importMeta?.externalId;
  const planId = productId ? planIdFromProduct(productId) : null;
  const plan = planId ? planById(planId) : undefined;
  const userId = data.customData?.userId;
  if (!plan || !userId || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(userId) || priceId !== PLAN_PRICE_IDS[plan.id]) {
    throw new Error("Subscription missing valid owner or catalog mapping");
  }
  const end = data.currentBillingPeriod?.endsAt ?? priorEnd ?? null;
  const access = data.status === "canceled"
    ? Boolean(end && new Date(end).getTime() > Date.now())
    : ["active", "trialing", "past_due"].includes(data.status);
  return {
    user_id: userId, paddle_subscription_id: data.id, paddle_customer_id: data.customerId,
    plan_id: plan.id, price_id: priceId, tracks_limit: plan.tracks, paddle_status: data.status,
    status: access ? "active" : "inactive",
    started_at: data.currentBillingPeriod?.startsAt ?? priorStart ?? data.createdAt,
    expires_at: end, cancel_at_period_end: data.scheduledChange?.action === "cancel",
    environment, updated_at: new Date().toISOString(), webhook_occurred_at: occurredAt,
  };
}