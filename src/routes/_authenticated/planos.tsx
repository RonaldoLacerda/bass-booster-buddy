import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";

import { AppNav } from "@/components/AppNav";
import { PolicyLinks } from "@/components/LegalPage";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { getAccount } from "@/lib/account.functions";
import { PLANS, formatBRL } from "@/lib/plans";
import { openPlanCheckout } from "@/lib/paddle";
import { getPaddleEnvironment, PLAN_PRICE_IDS } from "@/lib/paddle-env";
import { getCustomerPortalUrl } from "@/utils/payments.functions";

export const Route = createFileRoute("/_authenticated/planos")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Planos e assinatura | AudioMix" },
      {
        name: "description",
        content:
          "Escolha o plano de masterização por número de faixas por mês: 7, 12 ou 30 faixas com diagnóstico e exportação profissional.",
      },
      { property: "og:title", content: "Planos e assinatura | AudioMix" },
      { property: "og:description", content: "Planos de 7, 12 ou 30 faixas por mês." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlanosPage,
});

function PlanosPage() {
  const { data: account, isError } = useQuery({ queryKey: ["account"], queryFn: () => getAccount(), refetchInterval: 5000 });
  const portal = useServerFn(getCustomerPortalUrl);

  const mutation = useMutation({
    mutationFn: async (planId: string) => {
      if (!account || !PLAN_PRICE_IDS[planId]) throw new Error("Conta indisponível");
      await openPlanCheckout({ priceId: PLAN_PRICE_IDS[planId], userId: account.userId, email: account.email });
    },
    onError: () => toast.error("Não foi possível abrir o pagamento. Tente novamente em instantes."),
  });
  const manage = useMutation({
    mutationFn: () => portal(),
    onSuccess: ({ url }) => {
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else toast.error("Nenhuma assinatura encontrada para gerenciar.");
    },
    onError: () => toast.error("Não foi possível abrir sua assinatura. Tente novamente."),
  });

  return (
    <>
      <AppNav />
      {getPaddleEnvironment() === "sandbox" && (
        <div className="border-b border-accent/30 bg-accent/10 px-4 py-2 text-center text-sm text-foreground">
          Pagamentos em modo de teste — nenhuma cobrança real. <a className="underline" href="https://docs.lovable.dev/features/payments#test-and-live-environments" target="_blank" rel="noopener noreferrer">Saiba mais</a>
        </div>
      )}
      <Toaster />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Planos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu plano atual: <span className="font-semibold text-foreground">{account?.planName ?? "..."}</span> ·{" "}
          {account ? `${account.used}/${account.limit} faixas usadas ${account.periodLabel}` : ""}
        </p>

        {isError && <p role="alert" className="mt-4 text-destructive">Não foi possível carregar sua conta. Atualize a página.</p>}
        {account?.hasPaymentSubscription && (
          <Button variant="outline" className="mt-4" disabled={manage.isPending} onClick={() => manage.mutate()}>
            {manage.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />} Gerenciar assinatura
          </Button>
        )}
        {account?.paymentStatus === "past_due" && <p role="alert" className="mt-4 text-sm text-destructive">Pagamento pendente. Atualize sua forma de pagamento em Gerenciar assinatura.</p>}
        {account?.cancelAtPeriodEnd && <p className="mt-4 text-sm text-muted-foreground">Cancelamento agendado. Seu plano permanece disponível até o fim do período pago.</p>}
        {account?.pendingRequest && (
          <p className="mt-4 rounded-lg border border-accent/50 bg-accent/10 p-3 text-sm">
            Você já tem uma solicitação pendente do plano <strong>{account.pendingRequest.planName}</strong>. Vamos
            responder no seu e-mail em breve.
          </p>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`panel flex flex-col p-6 ${plan.highlight ? "border border-accent" : ""}`}
            >
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <p className="mt-2 text-3xl font-bold">{formatBRL(plan.price)}</p>
              <p className="text-xs text-muted-foreground">por mês · até {plan.tracks} faixas</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span className="text-muted-foreground">{perk}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6"
                variant={plan.highlight ? "default" : "outline"}
                disabled={!account || mutation.isPending || account.hasPaymentSubscription || account.planId === plan.id}
                onClick={() => mutation.mutate(plan.id)}
              >
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {account?.planId === plan.id ? "Plano ativo" : "Contratar"}
              </Button>
            </article>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Assinatura mensal com renovação automática. Seu plano é liberado após a confirmação do pagamento pelo Paddle.
          Cancelamento e comprovantes em Gerenciar assinatura. Para trocar de plano, cancele o atual e contrate outro após o fim do período pago.
        </p>
        <div className="mt-6"><PolicyLinks /></div>
      </main>
    </>
  );
}
