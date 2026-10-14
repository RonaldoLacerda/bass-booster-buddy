import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Music } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta | AudioMix" },
      {
        name: "description",
        content:
          "Acesse sua conta do AudioMix para masterizar músicas, ensaios, podcasts e gravações ao vivo. Cadastro com e-mail e senha e 1 faixa grátis.",
      },
      { property: "og:title", content: "Entrar ou criar conta | AudioMix" },
      {
        property: "og:description",
        content: "Crie sua conta grátis e masterize sua primeira faixa em segundos.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://audiomix.app/auth" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://audiomix.app/auth" }],
  }),
  component: AuthPage,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const BLOCKED_DOMAINS = [
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "test.com",
  "example.com",
];

function validateEmail(email: string): string | null {
  const value = email.trim().toLowerCase();
  if (!EMAIL_RE.test(value)) return "Digite um e-mail válido (ex.: seunome@gmail.com).";
  const domain = value.split("@")[1] ?? "";
  if (BLOCKED_DOMAINS.includes(domain)) return "Use um e-mail pessoal real — e-mails temporários não são aceitos.";
  if (!domain.includes(".")) return "Domínio de e-mail inválido.";
  return null;
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const emailError = validateEmail(email);
    if (emailError) return setError(emailError);
    if (password.length < 8) return setError("A senha precisa ter pelo menos 8 caracteres.");

    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/master`,
          },
        });
        if (err) throw err;
        setInfo(
          "Conta criada! Confirme o e-mail que enviamos para liberar o acesso — isso garante que o endereço é real.",
        );
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        void navigate({ to: "/studio" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha na autenticação.";
      setError(
        message.includes("Invalid login")
          ? "E-mail ou senha incorretos."
          : message.includes("not confirmed")
            ? "Confirme seu e-mail antes de entrar."
            : message.includes("already registered")
              ? "Esse e-mail já tem conta. Faça login."
              : message,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Music className="h-4 w-4 text-accent" /> AudioMix
        </Link>
        <div className="panel p-6">
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "login" ? "Entrar na sua conta" : "Criar conta grátis"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Use o e-mail e a senha do seu cadastro."
              : "Você começa com 1 faixa masterizada gratuita."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Seu nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ronaldo" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seunome@gmail.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>

            {error && (
              <p className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-lg border border-accent/50 bg-accent/10 p-3 text-sm">{info}</p>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
              setInfo(null);
            }}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "login" ? "Não tenho conta — criar agora" : "Já tenho conta — entrar"}
          </button>
        </div>
      </div>
    </main>
  );
}
