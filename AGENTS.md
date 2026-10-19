<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- O áudio e o vídeo são processados integralmente no navegador; a exportação de vídeo preserva a imagem original e grava uma nova trilha processada em WebM, sem servidor, para manter a privacidade.
- A apresentação pública usa prévias visuais construídas a partir dos recursos reais do produto, evitando imagens genéricas e promessas não implementadas.
- Derive the sitemap from required route-level staticData.sitemap decisions, exclude the authenticated subtree, and omit lastmod unless an authoritative page-specific content timestamp exists; this prevents stale inventories and fabricated change dates.
- Keep page titles, descriptions and canonical URLs in leaf route heads, with only sitewide defaults and verification tags at the root; this avoids duplicate canonicals and generic social previews.
- Paddle checkout uses stable price IDs, signed webhooks, and environment-scoped account/quota reads; test purchases must never unlock live quotas.
- Payment entitlements are written only after signed webhook verification; quota consumption uses a locked database function to prevent concurrent exports exceeding limits.
- Keep seller policies in public leaf routes with shared legal navigation and identity, so review and customer access never require sign-in.
- Plan changes go through the payment provider's subscription update with immediate proration; quota period follows the provider billing period so renewals and upgrades stay consistent.
