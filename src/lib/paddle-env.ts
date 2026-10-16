// Shared (client + server): environment derived from the build-time token.
const token = import.meta.env['VITE_PAYMENTS_CLIENT_TOKEN'] as string | undefined;

export function getPaddleEnvironment(): "sandbox" | "live" {
  return token?.startsWith("test_") ? "sandbox" : "live";
}

export const PLAN_PRICE_IDS: Record<string, string> = {
  essencial: "essencial_monthly",
  banda: "banda_monthly",
  estudio: "estudio_monthly",
};

export function planIdFromProduct(productId: string): string | null {
  const id = productId.replace(/_plan$/, "");
  return Object.hasOwn(PLAN_PRICE_IDS, id) ? id : null;
}

/** Access status: Paddle keeps retrying past_due, canceled keeps access until period end. */
export function hasAccess(paddleStatus: string): boolean {
  return ["active", "trialing", "past_due", "canceled"].includes(paddleStatus);
}
