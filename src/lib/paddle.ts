import { resolvePaddlePrice } from "@/utils/payments.functions";
import { getPaddleEnvironment } from "@/lib/paddle-env";

export { getPaddleEnvironment };

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle: any;
  }
}

let ready: Promise<void> | null = null;

export function initializePaddle(): Promise<void> {
  if (ready) return ready;
  if (!clientToken) return Promise.reject(new Error("VITE_PAYMENTS_CLIENT_TOKEN is not set"));
  ready = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.onload = () => {
      window.Paddle.Environment.set(getPaddleEnvironment() === "sandbox" ? "sandbox" : "production");
      window.Paddle.Initialize({ token: clientToken });
      resolve();
    };
    script.onerror = (e) => {
      ready = null;
      reject(e);
    };
    document.head.appendChild(script);
  });
  return ready;
}

export async function openPlanCheckout(opts: { priceId: string; userId: string; email?: string }) {
  await initializePaddle();
  const paddlePriceId = await resolvePaddlePrice({
    data: { priceId: opts.priceId, environment: getPaddleEnvironment() },
  });
  window.Paddle.Checkout.open({
    items: [{ priceId: paddlePriceId, quantity: 1 }],
    customer: opts.email ? { email: opts.email } : undefined,
    customData: { userId: opts.userId },
    settings: {
      displayMode: "overlay",
      locale: "pt",
      successUrl: `${window.location.origin}/planos?checkout=success`,
      allowLogout: false,
      variant: "one-page",
    },
  });
}
