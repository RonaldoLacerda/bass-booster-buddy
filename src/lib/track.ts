/**
 * Analytics sem cookies e sem dados pessoais.
 *
 * - Desligado por padrão: nada é carregado nem enviado até VITE_ANALYTICS_DOMAIN existir.
 * - Lista fechada de eventos e de propriedades (só enums, booleanos e faixas).
 *   Nunca enviar áudio, nome de arquivo, e-mail, id de usuário ou texto livre.
 * - Compatível com a API `window.plausible(evento, { props })` (Plausible ou Umami com o mesmo shim).
 */

export type SizeBucket = "lt10mb" | "10to50mb" | "50to200mb" | "gt200mb";
export type DurationBucket = "lt1min" | "1to5min" | "5to20min" | "gt20min";

export type EventMap = {
  cta_click: { cta: "hero" | "nav" | "plano" | "cta_final" | "guia"; plan_id?: string };
  upload_start: { is_video: boolean; size: SizeBucket };
  upload_error: { is_video: boolean; size: SizeBucket };
  analysis_done: { duration: DurationBucket; channels: 1 | 2 };
  goal_selected: { goal_id: string };
  process_click: { goal_id: string; intensity: string; focus: string };
  result_viewed: { goal_id: string };
  download_click: { signed_in: boolean };
  signup_wall_shown: Record<never, never>;
  paywall_shown: { plan_id: string };
  auth_view: { mode: "login" | "signup" };
  signup_submit: Record<never, never>;
  signup_error: { reason: "invalid_email" | "weak_password" | "exists" | "other" };
  plans_view: { plan_id: string };
  checkout_start: { plan_id: string };
  checkout_error: { plan_id: string };
  payment_success: Record<never, never>;
};

type Plausible = ((event: string, options?: { props?: Record<string, string | number | boolean> }) => void) & {
  q?: unknown[];
};

declare global {
  interface Window {
    plausible?: Plausible;
  }
}

export const analyticsDomain = (import.meta.env["VITE_ANALYTICS_DOMAIN"] as string | undefined) || undefined;
export const analyticsSrc =
  (import.meta.env["VITE_ANALYTICS_SRC"] as string | undefined) || "https://plausible.io/js/script.js";

export function sizeBucket(bytes: number): SizeBucket {
  const mb = bytes / (1024 * 1024);
  return mb < 10 ? "lt10mb" : mb < 50 ? "10to50mb" : mb < 200 ? "50to200mb" : "gt200mb";
}

export function durationBucket(seconds: number): DurationBucket {
  const min = seconds / 60;
  return min < 1 ? "lt1min" : min < 5 ? "1to5min" : min < 20 ? "5to20min" : "gt20min";
}

/** Head tags for the analytics script; empty when analytics is not configured. */
export function analyticsHead() {
  if (!analyticsDomain) return { scripts: [] as Array<Record<string, unknown>> };
  return {
    scripts: [
      {
        children:
          "window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}",
      },
      { src: analyticsSrc, defer: true, "data-domain": analyticsDomain },
    ],
  };
}

export function track<K extends keyof EventMap>(name: K, ...props: keyof EventMap[K] extends never ? [] : [EventMap[K]]) {
  if (!analyticsDomain || typeof window === "undefined") return;
  try {
    const clean = props[0]
      ? Object.fromEntries(Object.entries(props[0]).filter(([, v]) => v !== undefined))
      : undefined;
    window.plausible?.(name, clean ? { props: clean as Record<string, string | number | boolean> } : undefined);
  } catch {
    // Analytics must never break the app.
  }
}
