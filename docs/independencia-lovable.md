# Plano para sair do Lovable

Objetivo: o código, as chaves, o banco e o domínio ficam sob o seu controle, e cada push na `main` publica sozinho.

## O que depende do Lovable hoje

| # | Dependência | Onde | Substituto |
|---|---|---|---|
| 1 | Configuração de build `@lovable.dev/vite-tanstack-config` (TanStack Start, React, Tailwind, Nitro/Cloudflare, variáveis `VITE_*`, alias `@`) | `vite.config.ts`, `package.json` | `vite.config.ts` explícito com os mesmos plugins |
| 2 | API do Paddle via `connector-gateway.lovable.dev` com `LOVABLE_API_KEY` e `X-Connection-Api-Key` | `src/lib/paddle.server.ts` | Chamar `api.paddle.com` (e `sandbox-api.paddle.com`) direto, com chave de API do Paddle criada por você |
| 3 | Supabase gerenciado pelo Lovable Cloud (projeto `qxgrkrbxylurqzqbrnoe`) | `.env*`, `src/integrations/supabase/*`, `drizzle/` | Projeto Supabase seu, com as migrações `drizzle/migrations/0000..0003` |
| 4 | Domínio audiomix.app | DNS | DNS sob seu controle (ver item abaixo) |
| 5 | Relato de erros do editor e login do preview | `src/lib/lovable-error-reporting.ts`, `src/integrations/supabase/previewAuthStorage.ts`, `src/routes/__root.tsx` | Remover; usar o armazenamento padrão do Supabase |
| 6 | Segredo de cron `LOVABLE_CRON_SECRET` | `src/integrations/supabase/cron-auth.ts` | Renomear para `CRON_SECRET` (conferir se algum cron usa) |
| 7 | Publicação automática | painel do Lovable | Cloudflare Workers ligado ao GitHub |

## Controle de chaves e variáveis

Nomes usados pelo código (valores nunca vão para o Git):

- Públicas, embutidas no build: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_PAYMENTS_CLIENT_TOKEN` (precisa começar com `test_` ou `live_`).
- Privadas, só no servidor: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PADDLE_LIVE_API_KEY`, `PADDLE_SANDBOX_API_KEY`, `PAYMENTS_LIVE_WEBHOOK_SECRET`, `PAYMENTS_SANDBOX_WEBHOOK_SECRET`, `CRON_SECRET`.
- Deixam de existir: `LOVABLE_API_KEY`, `LOVABLE_CRON_SECRET*`.

As chaves `PADDLE_*_API_KEY` atuais são chaves de conexão do Lovable, não do Paddle. É preciso criar chaves novas no painel do Paddle (Developer Tools, Authentication).

## Ordem recomendada (sem derrubar pagamentos)

1. **Cloudflare**: criar conta, conectar o repositório, configurar o build e publicar em um endereço de teste (`*.workers.dev`), ainda com o Supabase e o gateway atuais.
2. **Supabase seu**: criar o projeto, aplicar `drizzle/migrations`, ativar confirmação de e-mail, configurar URLs de redirecionamento e o provedor de login. Hoje há poucos ou nenhum usuário pagante: se for aceitável, comece sem migrar contas. Se quiser migrar, é preciso acesso ao banco atual (senha do Postgres).
3. **Paddle direto**: criar as chaves de API próprias, trocar o `paddle.server.ts` para a API oficial, criar um novo destino de webhook apontando para a nova URL e testar uma compra completa em sandbox antes de qualquer mudança em live.
4. **Remover** o relato de erros, o armazenamento do preview e o `@lovable.dev/vite-tanstack-config`.
5. **Domínio**: só depois de tudo funcionar no endereço de teste. Reduza o TTL do DNS, aponte o domínio para o Cloudflare e mantenha o antigo por alguns dias.
6. Atualizar o `AGENTS.md` e o README, que ainda descrevem o fluxo com o Lovable.

## O que precisa de você

Estes itens exigem a sua conta e não devem passar pelo chat:
- conta e projeto no Cloudflare, e permissão do GitHub para ele;
- projeto no Supabase;
- chaves de API do Paddle e o novo destino de webhook;
- acesso ao DNS ou à transferência do domínio.
