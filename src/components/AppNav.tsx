import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getAccount } from "@/lib/account.functions";

export function AppNav() {
  const navigate = useNavigate();
  const { data: account } = useQuery({ queryKey: ["account"], queryFn: () => getAccount() });

  return (
    <nav className="border-b border-border bg-[var(--surface-sunken)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 text-sm">
        <Link to="/studio" className="font-semibold">
          AudioMix
        </Link>
        <Link
          to="/studio"
          className="text-muted-foreground hover:text-foreground"
          activeProps={{ className: "font-semibold text-foreground" }}
        >
          Mesa completa
        </Link>
        <Link
          to="/master"
          className="text-muted-foreground hover:text-foreground"
          activeProps={{ className: "font-semibold text-foreground" }}
        >
          Modo simplificado
        </Link>
        <Link to="/planos" className="text-muted-foreground hover:text-foreground">
          Planos
        </Link>
        {account?.isAdmin && (
          <Link to="/admin" className="text-muted-foreground hover:text-foreground">
            Solicitações
          </Link>
        )}
        <div className="ml-auto flex items-center gap-3">
          {account && (
            <span className="text-xs text-muted-foreground">
              {account.planName} · {account.remaining}/{account.limit} faixas restantes
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              void navigate({ to: "/" });
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </nav>
  );
}
