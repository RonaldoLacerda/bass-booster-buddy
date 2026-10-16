import { describe, expect, test } from "bun:test";
import { PLANS, FREE_TRACKS } from "./plans";
import { subscriptionRecord } from "./payment-subscription";

const event = (id = "essencial") => ({
  id: "sub_test", customerId: "ctm_test", status: "active", createdAt: "2026-01-01T00:00:00Z",
  customData: { userId: "11111111-1111-4111-8111-111111111111" },
  items: [{ product: { importMeta: { externalId: `${id}_plan` } }, price: { importMeta: { externalId: `${id}_monthly` } } }],
  currentBillingPeriod: { startsAt: "2026-01-01T00:00:00Z", endsAt: "2099-01-01T00:00:00Z" },
});
describe("AudioMix payment rules", () => {
  test("free grants exactly one lifetime track", () => expect(FREE_TRACKS).toBe(1));
  for (const [id, price, tracks] of [["essencial",12.99,7],["banda",16.99,12],["estudio",22.99,30]]) {
    test(`${id} preserves price ${price} and ${tracks} monthly tracks`, () => {
      expect(PLANS.find(p => p.id === id)?.price).toBe(price);
      expect(subscriptionRecord(event(id), "live", "2026-01-01T00:00:00Z").tracks_limit).toBe(tracks);
    });
  }
  test("test subscriptions retain their environment", () => expect(subscriptionRecord(event(), "sandbox", "2026-01-01T00:00:00Z").environment).toBe("sandbox"));
  test("canceling retains future paid period", () => {
    expect(subscriptionRecord({ ...event(), status: "canceled", currentBillingPeriod: null }, "live", "2026-01-01T00:00:00Z", "2099-01-01T00:00:00Z").status).toBe("active");
  });
  test("expired cancellation does not grant access", () => {
    expect(subscriptionRecord({ ...event(), status: "canceled", currentBillingPeriod: null }, "live", "2026-01-01T00:00:00Z", "2020-01-01T00:00:00Z").status).toBe("inactive");
  });
  test("missing catalog metadata is rejected", () => {
    expect(() => subscriptionRecord({ ...event(), items: [] }, "live", "2026-01-01T00:00:00Z")).toThrow();
  });
});