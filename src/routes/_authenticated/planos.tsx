import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { getAccount, requestPlan } from "@/lib/account.functions";
import { PLANS, formatBRL } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/planos")({
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
  const queryClient = useQueryClient();
  const { data: account } = useQuery({ queryKey: ["account"], queryFn: () => getAccount() });
  const request = useServerFn(requestPlan);

  const mutation = useMutation({
    mutationFn: (planId: string) => request({ data: { planId } }),
    onSuccess: (result) => {
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      void queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: () => toast.error("Não foi possível enviar a solicitação."),
  });

  return (
    <>
      <AppNav />
      <Toaster />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Planos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu plano atual: <span className="font-semibold text-foreground">{account?.planName ?? "..."}</span> ·{" "}
          {account ? `${account.used}/${account.limit} faixas usadas ${account.periodLabel}` : ""}
        </p>

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
                disabled={mutation.isPending || account?.planId === plan.id}
                onClick={() => mutation.mutate(plan.id)}
              >
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {account?.planId === plan.id ? "Plano ativo" : "Contratar"}
              </Button>
            </article>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Ao clicar em Contratar registramos sua solicitação e nossa equipe libera o plano manualmente — o
          pagamento é combinado por e-mail nesta fase de testes.
        </p>
      </main>
    </>
  );
}
