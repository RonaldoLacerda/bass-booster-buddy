import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { getAccount, listPlanRequests, resolvePlanRequest } from "@/lib/account.functions";
import { formatBRL } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/admin")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Solicitações de plano | AudioMix" },
      {
        name: "description",
        content: "Painel interno com as solicitações de assinatura recebidas no AudioMix.",
      },
      { property: "og:title", content: "Solicitações de plano | AudioMix" },
      { property: "og:description", content: "Painel interno de solicitações de assinatura." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const queryClient = useQueryClient();
  const { data: account } = useQuery({ queryKey: ["account"], queryFn: () => getAccount() });
  const { data: requests, isLoading } = useQuery({
    queryKey: ["plan-requests"],
    queryFn: () => listPlanRequests(),
    enabled: account?.isAdmin === true,
  });
  const resolve = useServerFn(resolvePlanRequest);

  const mutation = useMutation({
    mutationFn: (input: { id: string; status: "aprovado" | "recusado" }) => resolve({ data: input }),
    onSuccess: () => {
      toast.success("Solicitação atualizada.");
      void queryClient.invalidateQueries({ queryKey: ["plan-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: () => toast.error("Não foi possível atualizar."),
  });

  if (account && !account.isAdmin) {
    return (
      <>
        <AppNav />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Área restrita</h1>
          <p className="mt-2 text-sm text-muted-foreground">Esta página é só para a administração do app.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <AppNav />
      <Toaster />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Solicitações de plano</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cada clique em “Contratar” aparece aqui. Aprovar libera o plano na conta do usuário por 1 mês.
        </p>

        <div className="panel mt-6 overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">E-mail</th>
                <th className="p-3">Plano</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Status</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td className="p-4 text-muted-foreground" colSpan={6}>
                    Carregando...
                  </td>
                </tr>
              )}
              {!isLoading && (requests ?? []).length === 0 && (
                <tr>
                  <td className="p-4 text-muted-foreground" colSpan={6}>
                    Nenhuma solicitação ainda.
                  </td>
                </tr>
              )}
              {(requests ?? []).map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="p-3 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="p-3">{r.email}</td>
                  <td className="p-3">{r.plan_name}</td>
                  <td className="p-3">{formatBRL(r.price)}</td>
                  <td className="p-3 capitalize">{r.status}</td>
                  <td className="p-3">
                    {r.status === "pendente" ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={mutation.isPending}
                          onClick={() => mutation.mutate({ id: r.id, status: "aprovado" })}
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={mutation.isPending}
                          onClick={() => mutation.mutate({ id: r.id, status: "recusado" })}
                        >
                          Recusar
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
