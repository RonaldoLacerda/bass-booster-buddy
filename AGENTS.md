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

- Audio/video processing stays entirely in the browser; export copies encoded video packets with Mediabunny and replaces only audio, selecting MP4 or WebM to preserve picture quality without a server. Import detection must handle missing MIME types by extension, and paired playback starts audio/video within the same user gesture.
- A apresentação pública usa prévias visuais construídas a partir dos recursos reais do produto, evitando imagens genéricas e promessas não implementadas.
- Derive the sitemap from required route-level staticData.sitemap decisions, exclude the authenticated subtree, and omit lastmod unless an authoritative page-specific content timestamp exists; this prevents stale inventories and fabricated change dates.
- Keep page titles, descriptions and canonical URLs in leaf route heads, with only sitewide defaults and verification tags at the root; this avoids duplicate canonicals and generic social previews.
- Paddle checkout uses stable price IDs, signed webhooks, and environment-scoped account/quota reads; test purchases must never unlock live quotas.
- Payment entitlements are written only after signed webhook verification; quota consumption uses a locked database function to prevent concurrent exports exceeding limits.
- Keep seller policies in public leaf routes with shared legal navigation and identity, so review and customer access never require sign-in.
- Plan changes go through the payment provider's subscription update with immediate proration; quota period follows the provider billing period so renewals and upgrades stay consistent.
- Cache mastered audio by AudioBuffer identity and invalidate asynchronous results across upload/reset sessions; filenames do not identify recording content.
- Studio file preview and export share the same rendered buffer, including normalization; microphone monitoring retains the live DSP graph and must release capture resources on unmount.
- Keep export entitlement scoped to each imported source or recorded take and serialize export actions; repeat versions of one source must not authorize a replacement source.
- The simplified mastering page is public: visitors can analyze and compare without an account, and a track credit is consumed only right before the first download of each imported source, so trying is frictionless while quotas stay enforced server-side.
