// Shared (client + server): environment derived from the build-time token.
const token = import.meta.env['VITE_PAYMENTS_CLIENT_TOKEN'] as string | undefined;

/**
 * Fail closed: only the documented Paddle client-token prefixes select an
 * environment. A missing or unrecognized token must never silently mean "live".
 */
export function paddleEnvironmentFromToken(value: string | undefined): "sandbox" | "live" {
  if (value?.startsWith("test_")) return "sandbox";
  if (value?.startsWith("live_")) return "live";
  throw new Error("VITE_PAYMENTS_CLIENT_TOKEN must start with test_ or live_");
}

export function getPaddleEnvironment(): "sandbox" | "live" {
  return paddleEnvironmentFromToken(token);
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
