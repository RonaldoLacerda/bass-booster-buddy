import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, policyHead } from "@/components/LegalPage";

export const Route = createFileRoute("/reembolso")({
  staticData: { sitemap: true },
  head: () => policyHead("/reembolso", "Política de reembolso", "Saiba como solicitar reembolso de uma compra do AudioMix pelo suporte da Paddle e como cancelar sua assinatura."),
  component: RefundPage,
});

function RefundPage() {
  return <LegalPage title="Política de reembolso">
    <section><h2>Reembolsos via Paddle</h2><p>As compras do AudioMix são realizadas pela Paddle, nosso revendedor e Merchant of Record. Adotamos a <a href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noopener noreferrer">Política de Reembolso da Paddle</a>, incluindo seus prazos e os direitos de arrependimento e reembolso previstos na legislação aplicável. Esta página não limita seus direitos legais de consumidor.</p></section>
    <section><h2>Como solicitar</h2><p>Para solicitar um reembolso, acesse <a href="https://paddle.net" target="_blank" rel="noopener noreferrer">paddle.net</a> e informe o e-mail usado na compra e os dados do pedido ou comprovante. A Paddle analisa e processa o pedido de acordo com sua política. Você também pode contatar o suporte do AudioMix pelo e-mail abaixo para obter ajuda com a solicitação.</p></section>
    <section><h2>Cancelamento de assinatura</h2><p>Você pode cancelar a renovação em “Gerenciar assinatura”, na página de planos do AudioMix. Cancelar a renovação e solicitar reembolso são ações diferentes. O cancelamento mantém o acesso até o fim do período pago, dentro da cota do plano; um reembolso pode encerrar o acesso correspondente à compra reembolsada.</p></section>
    <section><h2>Problemas técnicos</h2><p>Se tiver dificuldade com um arquivo, uma exportação ou uma cobrança, entre em contato com o suporte. Não envie gravações com informações pessoais sensíveis: descreva o problema, o navegador e o formato do arquivo. Seus arquivos de áudio e vídeo são processados localmente e não ficam disponíveis para nossa equipe.</p></section>
  </LegalPage>;
}