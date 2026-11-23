# Produto: diagnóstico e prioridades do próximo ciclo

Base: código em `src/routes/master.tsx`, `auth.tsx`, `_authenticated/planos.tsx`, `src/lib/plans.ts`, `goals.ts`, `src/components/master/*`, `docs/pesquisa-mercado.md`, `docs/independencia-lovable.md` e `roadmap.md` (leitura em 2026-11-23). Não há dado de analytics: o `track` está desligado até existir `VITE_ANALYTICS_DOMAIN`. Tudo o que é número de funil abaixo é, portanto, hipótese.

## 1. Público inicial e problema

**Público:** quem grava banda, ensaio ou culto no celular (ministério de mídia de igreja, banda pequena) e quer publicar ou mandar o áudio sem que fique baixo, embolado ou sem grave.

**Problema em uma frase:** a gravação do celular sai baixa e embolada, e essa pessoa não sabe equalizar nem tem quem faça isso por ela.

Fato: o preset "Gravação ao vivo" (`worship_live`) já existe em `goals.ts` e a pesquisa não achou ferramenta voltada a igreja (busca rasa, ausência de evidência, não medição).

## 2. O momento "uau" e o tempo até ele

**Momento "uau":** a pessoa aperta play no Antes x Depois da própria gravação e ouve a diferença (`AbPlayer.tsx`, botão Tocar/Pausar).

**Caminho real hoje (fato, do código), do arquivo escolhido até ouvir o depois:**
1. Escolher arquivo (estágio `upload`); análise automática (`analyzing`).
2. Estágio `goal`: o diagnóstico só aparece depois de escolher um entre 6 objetivos (`chooseGoal`). Sem escolha, nada avança.
3. Estágio `diagnosis`: card com nota, problemas e quatro números (LUFS, pico real em dBTP, dinâmica, estéreo). Exige clicar em "Melhorar meu áudio" (`process`).
4. Estágio `result`: o player aparece, mas não toca sozinho. Exige clicar em Tocar, e depois alternar entre antes e depois.

Ou seja, no mínimo 4 ações depois do arquivo (objetivo, melhorar, tocar, alternar) e uma decisão técnica antes de qualquer resultado. O tempo real até o "uau" não está medido (hipótese: acima de 1 minuto para quem hesita no objetivo).

**Como encurtar (sem mudar o motor de áudio):**
- Pré-selecionar o objetivo "Gravação ao vivo" e processar automaticamente ao fim da análise; levar direto ao player. A escolha de objetivo vira "Ouvir para outro destino" depois do resultado.
- Mostrar o resultado antes do diagnóstico técnico; mover LUFS/dBTP/dinâmica para um bloco recolhido ("detalhes técnicos") e deixar à vista só nota e 2 a 3 frases em português simples.
- Meta: de 4 ações para 2 (escolher arquivo, apertar play), com o depois já pronto.
- Medir com os eventos que já existem: `upload_start` até `result_viewed` (e acrescentar `ab_play`, ver item 1).

## 3. Por que não há clientes: fato x hipótese

### Fatos (confirmados no código ou nos docs)
| # | Fato | Onde |
|---|---|---|
| F1 | Teste sem cadastro; conta só para baixar; 1 faixa grátis (`FREE_TRACKS = 1`) | `master.tsx` `ensureDownload`, `plans.ts` |
| F2 | Cadastro exige confirmação de e-mail; o retorno cai em `/master` vazio. O próprio texto do muro diz "envie o arquivo de novo" | `auth.tsx` `emailRedirectTo`, `master.tsx` bloco `signup-wall` |
| F3 | Arquivo, buffer e resultado ficam só em memória (`useState`); recarregar ou trocar de aba por causa do e-mail perde tudo | `master.tsx` |
| F4 | Só assinatura mensal em reais (R$ 22,99 / 26,99 / 32,99), sem pacote avulso | `plans.ts`, `planos.tsx` |
| F5 | Compra completa e liberação por webhook nunca foram confirmadas; pagamentos reais aguardam aprovação do Paddle | `roadmap.md` |
| F6 | Não há dado de funil (analytics desligado) | `track.ts` |
| F7 | Diagnóstico mostra LUFS e dBTP; objetivo obrigatório antes do diagnóstico | `DiagnosisCard.tsx`, `master.tsx` |
| F8 | BandLab é grátis e sem conta; Auphonic vende créditos avulsos sem validade (preços de concorrentes não confirmados) | `pesquisa-mercado.md` |
| F9 | Pix existe no Paddle, mas Pix Automático não faz proration imediata; hoje o upgrade imediato com proration é regra do produto | `pesquisa-mercado.md`, `AGENTS.md` |

### Hipóteses e como validar
| # | Hipótese | Como validar | Sinal de que é verdadeira |
|---|---|---|---|
| H1 | Quase ninguém chega ao site (problema é aquisição, não conversão) | Ligar analytics; contar visitantes únicos por semana e origem | Menos de ~100 visitantes/semana: nenhum ajuste de funil muda o resultado |
| H2 | Quem chega abandona antes do resultado (objetivo obrigatório, jargão) | Taxa `analysis_done` -> `result_viewed`; teste com 5 pessoas do público assistidas por tela compartilhada | Menos de 50% chegam ao resultado |
| H3 | A confirmação de e-mail faz perder quem quer baixar | Taxa `signup_submit` -> volta autenticada em `/master` -> `download_click` com `signed_in: true`; acrescentar evento de retorno | Queda grande entre cadastro e primeiro download |
| H4 | A primeira faixa grátis satisfaz o uso esporádico e não há motivo para assinar mensal | Entrevista com quem baixou; contar quantos têm mais de 1 áudio por mês | Maioria diz "preciso de poucas faixas, de vez em quando" |
| H5 | Assinatura mensal é o formato errado para uso esporádico (igreja grava no domingo, banda ensaia de vez em quando) | Mostrar preço avulso em teste de interesse (item 5) e perguntar na entrevista | Preferência clara por pagar por faixa ou pacote |
| H6 | O resultado não soa melhor o bastante em gravações reais de celular | Rodar 5 a 10 gravações autorizadas, ouvir cego antes/depois com 3 pessoas | Menos de 70% preferem o depois |
| H7 | Falta confiança no pagamento (marca nova, sem prova social, checkout nunca testado) | Compra de teste completa em sandbox; ver se a pessoa chega a `plans_view` e `checkout_start` | Tráfego em `planos` sem `checkout_start` |
| H8 | O público que queremos não entende "masterização" e não procura por isso | Buscas e entrevistas: como descrevem o problema ("áudio do culto baixo") | Vocabulário diferente do que o site usa |

Ordem de leitura: se H1 for verdadeira, o resto é secundário. Sem tráfego mínimo, os itens abaixo reduzem atrito mas não criam clientes sozinhos.

## 4. Próximo ciclo: no máximo 5 itens (impacto / esforço)

Regra: impacto no "uau" e na conversão dividido pelo esforço. Marcação: **[CÓDIGO]** pode ser feito só com código; **[DONO]** depende de conta, chave, áudio autorizado ou preço.

### 1. Resultado em 2 ações: objetivo padrão, processamento automático e diagnóstico em português [CÓDIGO]
- Impacto: alto (encurta o caminho até o "uau" de 4 ações para 2). Esforço: médio.
- Escopo: após `analysis_done`, escolher `worship_live` por padrão, chamar `process` sozinho e abrir o `AbPlayer`; mover LUFS/dBTP/dinâmica/estéreo para um bloco recolhido; reescrever textos do diagnóstico sem jargão; manter o seletor de objetivo para trocar depois. Acrescentar o evento `ab_play` (primeira vez que a pessoa toca o player) em `track.ts`.
- Pronto quando: (a) do arquivo carregado ao player pronto não há clique obrigatório; (b) tela do diagnóstico sem as siglas LUFS/dBTP fora do bloco recolhido; (c) teste de interface cobre o novo fluxo e o evento `ab_play` é emitido uma vez por arquivo; (d) tempo de `upload_start` a `result_viewed` medido em 5 gravações de teste do dono ou de voluntários, registrado em `docs/`.
- Arquivos prováveis: `src/routes/master.tsx`, `src/components/master/DiagnosisCard.tsx`, `GoalPicker.tsx`, `AbPlayer.tsx`, `src/lib/diagnosis.ts`, `src/lib/track.ts`.
- Reverter: alterar o fluxo atrás de uma constante `AUTO_RESULT = true` em `master.tsx`; `false` restaura os estágios antigos. Reverter o commit também funciona (sem migração).

### 2. Não perder o arquivo ao criar a conta: guardar o arquivo localmente e retomar após o e-mail [CÓDIGO]
- Impacto: alto (ataca F2/F3 e H3, o ponto onde quem decidiu baixar desiste). Esforço: médio.
- Escopo: antes de ir para `/auth`, gravar o arquivo (Blob) e o ajuste escolhido no IndexedDB do próprio navegador (nada vai a servidor); ao voltar autenticado em `/master`, oferecer "Continuar com [nome do arquivo]" e reprocessar. Apagar ao concluir o download, ao reiniciar ou após 24 h. Limite de tamanho com aviso claro quando não couber; mudar o texto do muro de cadastro. Se confirmação de e-mail abrir em outro aparelho, o arquivo não existe: tratar com mensagem simples.
- Pronto quando: teste automatizado de ponta a ponta (cadastro simulado, retorno, retomada) passa; com arquivo de até o limite definido, o resultado reaparece sem novo envio; o texto "envie o arquivo de novo" só aparece no caso sem arquivo guardado; novos eventos `resume_offered` e `resume_accepted` emitidos.
- Arquivos prováveis: `src/routes/master.tsx`, `src/routes/auth.tsx`, novo `src/lib/pending-file.ts`, `src/lib/track.ts`, `AGENTS.md` (regra de privacidade: o áudio nunca sai do navegador; atualizar se necessário).
- Reverter: atrás de constante `RESUME_ENABLED`; remover `pending-file.ts` limpa tudo. IndexedDB é local do usuário: limpar na chave nova ao desativar. Sem migração de banco.
- Observação: não mexer na regra de cobrança (crédito consumido só no primeiro download) nem no escopo de entitlement por fonte.

### 3. Ligar o analytics e criar o painel de funil [DONO + CÓDIGO]
- Impacto: alto (sem isso, F6 impede validar H1 a H3, H7). Esforço: baixo.
- Dono: criar conta no provedor de analytics (Plausible ou Umami), definir `VITE_ANALYTICS_DOMAIN` (e `VITE_ANALYTICS_SRC` se não for o padrão) no ambiente de build. Código: documentar em `docs/` o funil com os eventos existentes (`cta_click` -> `upload_start` -> `analysis_done` -> `result_viewed` -> `download_click` -> `signup_wall_shown` -> `signup_submit` -> `plans_view` -> `checkout_start` -> `payment_success`) e conferir que cada evento dispara uma vez.
- Pronto quando: em produção, os 10 eventos aparecem no painel após uma passada de teste; documento com a ordem do funil e a consulta de cada passo; após 14 dias há uma tabela com a taxa de cada passo.
- Arquivos prováveis: `src/lib/track.ts`, `src/routes/__root.tsx` (já carrega via `analyticsHead`), novo `docs/funil.md`.
- Reverter: remover a variável de ambiente desliga tudo (comportamento padrão atual).

### 4. Confirmar a compra de ponta a ponta [DONO]
- Impacto: alto (F5: hoje ninguém sabe se o checkout cobra e libera). Esforço: baixo a médio.
- Dono: concluir uma compra de teste em sandbox (cartão de teste), depois, após aprovação do Paddle, uma compra real de menor plano e reembolso; conferir que o webhook assinado libera as faixas e que o ambiente de teste não libera cota real. Código só entra se algo falhar: correções em `paddle.server.ts` ou no webhook, sem mudar a regra de segurança (entitlement só após webhook assinado).
- Pronto quando: compra de teste registrada com data e resultado (liberou N faixas, status do plano correto, tela de sucesso vista, bloqueio de compra duplicada); `roadmap.md` atualizado com as duas pendências marcadas ou a falha descrita.
- Arquivos prováveis (se houver correção): `src/lib/paddle.server.ts`, rotas de webhook em `src/routes/api/`, `src/routes/_authenticated/planos.tsx`.
- Reverter: não há mudança de código por padrão; a compra real de teste é revertida por reembolso no Paddle.
- Dependência: o plano de saída do Lovable muda as chaves do Paddle; refazer este teste depois dessa troca.

### 5. Teste de oferta avulsa por faixa ou pacote, sem construir cobrança nova ainda [DONO + CÓDIGO]
- Impacto: médio a alto (F4, H4, H5). Esforço: baixo para o teste.
- Dono: decidir se aceita testar o conceito e qual faixa de preço mostrar (decisão de preço é do dono; o produto só propõe testar). Código: na página `planos` e no muro de cadastro, acrescentar bloco "Precisa de poucas faixas? Diga quanto pagaria" com 2 opções e envio de e-mail opcional, sem cobrar nada; evento `interest_single`.
- Pronto quando: bloco no ar, evento medido e, depois de 14 dias, decisão registrada em `docs/` (construir pacote avulso se pelo menos X pessoas clicarem; X definido com o dono ao ver o tráfego real do item 3).
- Arquivos prováveis: `src/routes/_authenticated/planos.tsx`, `src/routes/master.tsx`, `src/lib/track.ts`.
- Reverter: remover o bloco; sem migração. Não prometer preço ou produto inexistente: o texto deve dizer que é pesquisa de interesse.

Resumo da marcação: itens 1 e 2 só com código; item 3 exige conta e variável do dono; item 4 exige a conta Paddle e o cartão/Pix do dono; item 5 exige decisão de preço do dono e código leve.

## 5. O que NÃO construir agora

- Pacote avulso completo (cobrança por faixa, créditos que não expiram) antes do teste de interesse do item 5.
- Pix Automático ou troca de gateway: conflita com proration imediata (F9) e sem tráfego não resolve nada.
- Mais páginas de SEO ou mais ferramentas de nicho: já existem 7 páginas em `/ferramentas`; sem medir tráfego (H1), mais páginas é aposta cega.
- Novos objetivos, novos instrumentos de foco ou presets personalizados: o gargalo é chegar ao primeiro resultado, não faltam opções.
- Mesa completa e gravação ao vivo como foco de produto: pouca relação com o público de primeira experiência; manter, não evoluir.
- Contas de equipe, histórico de faixas na nuvem e envio de áudio para servidor: contraria a regra de áudio só no navegador.
- Redução de preço para igualar o BandLab grátis: decisão de preço é do dono e a comparação de preços da pesquisa não está confirmada.
- Depoimentos, número de usuários, selos de prova social inventados: só com dados e autorização reais.
- Publicação em redes do vídeo de lançamento antes de o fluxo estar encurtado (itens 1 e 2).

## 6. Três perguntas ao dono que mudariam as prioridades

1. **Quantas pessoas do público (igreja, banda) você consegue colocar diante do site nas próximas 2 semanas, e você aceita assistir 5 delas usando?** Se der para trazer pessoas e observar, priorizar o item 1 e as entrevistas (H2, H4, H6). Se não houver acesso a ninguém, aquisição (H1) vira o item 1 do ciclo e o fluxo fica para depois.
2. **Aceita que a primeira experiência seja mais gratuita (por exemplo, mais de 1 faixa ou 1 download por e-mail sem cadastro) e preço por faixa avulsa?** Se sim, o item 5 sobe e o item 2 pode cair; se a resposta for "mensal é o modelo", ficam como estão e a prioridade passa a ser o item 4.
3. **Você tem pelo menos 5 gravações de ensaio ou culto reais, com autorização para usar, e abre mão de ver a compra real antes de aprovar o Paddle?** Gravações autorizadas permitem validar H6 (o resultado soa melhor?) antes de mexer no fluxo; se a qualidade falhar, o motor de áudio vira prioridade acima de qualquer ajuste de funil. A segunda parte decide se o item 4 trava o ciclo ou corre em paralelo.
