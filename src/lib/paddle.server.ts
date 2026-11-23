import { Environment, Paddle, EventName } from "@paddle/paddle-node-sdk";

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

export { EventName };

export type PaddleEnv = "sandbox" | "live";

const API_BASE_URL: Record<PaddleEnv, string> = {
  live: "https://api.paddle.com",
  sandbox: "https://sandbox-api.paddle.com",
};

/** Paddle API key created in the Paddle dashboard (Developer Tools > Authentication). */
export function getApiKey(env: PaddleEnv): string {
  return env === "sandbox" ? getEnv("PADDLE_SANDBOX_API_KEY") : getEnv("PADDLE_LIVE_API_KEY");
}

export function getPaddleClient(env: PaddleEnv): Paddle {
  return new Paddle(getApiKey(env), {
    environment: env === "sandbox" ? Environment.sandbox : Environment.production,
  });
}

export async function paddleFetch(env: PaddleEnv, path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE_URL[env]}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey(env)}`,
      ...init?.headers,
    },
  });
}

/**
 * Resolve our stable price id (import_meta.external_id, e.g. "essencial_monthly")
 * to the Paddle price id. The Paddle API cannot filter by external id, so list and match.
 */
export async function findPaddlePriceId(env: PaddleEnv, externalId: string): Promise<string | null> {
  let path: string | null = "/prices?status=active&per_page=200";
  for (let page = 0; path && page < 10; page++) {
    const response = await paddleFetch(env, path);
    if (!response.ok) throw new Error(`Paddle prices request failed (${response.status})`);
    const body = (await response.json()) as {
      data?: Array<{ id: string; import_meta?: { external_id?: string | null } | null }>;
      meta?: { pagination?: { has_more?: boolean; next?: string } };
    };
    const match = body.data?.find((price) => price.import_meta?.external_id === externalId);
    if (match) return match.id;
    const next = body.meta?.pagination;
    path = next?.has_more && next.next ? next.next.replace(API_BASE_URL[env], "") : null;
  }
  return null;
}

export function getWebhookSecret(env: PaddleEnv): string {
  return env === "sandbox"
    ? getEnv("PAYMENTS_SANDBOX_WEBHOOK_SECRET")
    : getEnv("PAYMENTS_LIVE_WEBHOOK_SECRET");
}

export async function verifyWebhook(req: Request, env: PaddleEnv) {
  const signature = req.headers.get("paddle-signature");
  const body = await req.text();
  const secret = getWebhookSecret(env);
  if (!signature || !body) throw new Error("Missing signature or body");
  return await getPaddleClient(env).webhooks.unmarshal(body, secret, signature);
}
