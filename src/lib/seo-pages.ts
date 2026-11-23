/**
 * Conteúdo das páginas de busca (SEO). Cada página responde a um problema real
 * que as pessoas pesquisam e leva ao teste grátis em /master.
 * Só descreva aqui recursos que existem no produto (ver goals.ts e audio-engine.ts).
 */
export type SeoPage = {
  slug: string;
  path: string;
  title: string; // <title> sem a marca
  description: string;
  h1: string;
  intro: string;
  eyebrow: string;
  sections: Array<{ heading: string; paragraphs: string[]; bullets?: string[] }>;
  steps: string[];
  faq: Array<{ q: string; a: string }>;
  cta: string;
  related: string[]; // slugs
};

const PRIVACY =
  "O AudioMix processa tudo no seu navegador: o arquivo não é enviado para nenhum servidor.";

export const SEO_PAGES: SeoPage[] = [
  {
    slug: "aumentar-volume-audio",
    path: "/ferramentas/aumentar-volume-audio",
    title: "Aumentar o volume de áudio online sem distorcer",
    description:
      "Aumente o volume de gravações baixas sem estourar: o AudioMix mede o loudness em LUFS, aplica compressor e limiter e deixa você comparar antes e depois. 1 faixa grátis.",
    h1: "Aumentar o volume do áudio sem distorcer",
    eyebrow: "Áudio muito baixo",
    intro:
      "Subir o ganho de uma gravação baixa costuma estourar os picos e deixar o som sujo. O AudioMix mede o volume real do arquivo e eleva o nível até o alvo certo, respeitando um teto de pico para não clipar.",
    sections: [
      {
        heading: "Por que simplesmente aumentar o volume não funciona",
        paragraphs: [
          "Em uma gravação de celular ou de ensaio, alguns momentos são muito mais fortes que o resto. Se você aplica um ganho único, esses picos passam de 0 dBFS e distorcem antes de o restante ficar audível.",
          "O caminho correto é medir o volume percebido (loudness), reduzir a diferença entre trechos fortes e fracos com um compressor e limitar o pico com um limiter. Só então o nível geral pode subir com segurança.",
        ],
      },
      {
        heading: "O que o AudioMix faz com o seu arquivo",
        paragraphs: ["A análise e o tratamento usam a Web Audio API, direto no navegador. " + PRIVACY],
        bullets: [
          "Mede loudness integrado (LUFS), pico real, faixa dinâmica e energia de graves.",
          "Aplica equalização, compressor e limiter conforme o destino escolhido.",
          "Normaliza para o alvo do destino (por exemplo -14 LUFS para YouTube) com teto de pico em -1 dBTP.",
          "Mostra as métricas antes e depois, e você alterna entre as duas versões no mesmo trecho.",
        ],
      },
    ],
    steps: [
      "Envie o áudio ou vídeo (MP3, WAV, M4A, OGG, MP4 ou WebM).",
      "Escolha onde ele será ouvido: WhatsApp, YouTube, redes sociais, voz falada ou música.",
      "Veja o diagnóstico e aplique a correção.",
      "Compare antes e depois e baixe em WAV ou MP3.",
    ],
    faq: [
      {
        q: "Aumentar o volume piora a qualidade?",
        a: "Aumentar só o ganho pode distorcer. O AudioMix combina compressão e limiter para elevar o volume percebido mantendo os picos sob controle, e você confere o resultado antes de baixar.",
      },
      {
        q: "O que é LUFS?",
        a: "É a medida de volume percebido usada por plataformas como YouTube e Spotify. Diferente do pico, ela representa o quão alto o áudio parece ao ouvido.",
      },
      {
        q: "Meu arquivo é enviado para algum servidor?",
        a: "Não. A análise, o tratamento e a exportação acontecem no seu aparelho.",
      },
    ],
    cta: "Aumentar o volume do meu áudio",
    related: ["normalizar-audio-lufs", "audio-whatsapp", "melhorar-audio-video"],
  },
  {
    slug: "aumentar-graves-audio",
    path: "/ferramentas/aumentar-graves-audio",
    title: "Aumentar os graves de um áudio online",
    description:
      "Gravação sem grave? O AudioMix analisa a energia de graves e sub-graves, aplica equalização de 10 bandas e permite destacar o baixo. Compare antes e depois. 1 faixa grátis.",
    h1: "Aumentar os graves de um áudio",
    eyebrow: "Falta de grave",
    intro:
      "Gravações de celular, de culto, de ensaio e de show ao vivo costumam sair finas, sem peso no baixo. O AudioMix mede quanto grave existe e reforça a região certa sem deixar o som embolado.",
    sections: [
      {
        heading: "Grave demais ou de menos: o problema está nas faixas de frequência",
        paragraphs: [
          "Sub-graves (abaixo de 60 Hz) dão peso, mas em excesso consomem o volume disponível. A região de baixo (cerca de 60 a 250 Hz) dá corpo. Entre 200 e 500 Hz o som tende a ficar embolado, e uma redução ali libera espaço para o grave soar limpo.",
          "Por isso o tratamento do AudioMix combina reforço de graves com corte de médios-graves e filtro passa-altas para remover ruído abaixo da região útil.",
        ],
      },
      {
        heading: "Recursos para quem toca baixo ou grava banda",
        paragraphs: ["O modo simplificado escolhe o ajuste a partir da medição do arquivo. " + PRIVACY],
        bullets: [
          "Foco por instrumento: destaque o baixo, a voz ou outro elemento depois do tratamento.",
          "Três intensidades: suave, equilibrada ou intensa.",
          "Graves em mono abaixo de 120 Hz nos objetivos de música e gravação ao vivo, para soar melhor em caixas pequenas.",
          "Mesa avançada com equalizador de 10 bandas, para ajustar cada faixa de frequência.",
        ],
      },
    ],
    steps: [
      "Envie a gravação.",
      "Escolha o objetivo (por exemplo, gravação ao vivo ou música/banda).",
      "Aplique o tratamento e, se quiser, ative o foco em Baixo.",
      "Ajuste a intensidade, compare e baixe.",
    ],
    faq: [
      {
        q: "Posso usar para gravação de culto ou show ao vivo?",
        a: "Sim. O objetivo Gravação ao vivo foi pensado para esse tipo de material: mais clareza, mais grave e volume mais alto.",
      },
      {
        q: "Qual a diferença entre o modo simplificado e a mesa avançada?",
        a: "O modo simplificado aplica a correção automaticamente. A mesa avançada dá controle manual sobre o equalizador de 10 bandas, compressor e limiter.",
      },
      {
        q: "Aumentar o grave deixa o áudio mais baixo?",
        a: "Pode, porque graves consomem energia. Por isso o AudioMix normaliza o volume final para o alvo do objetivo depois do tratamento.",
      },
    ],
    cta: "Reforçar os graves do meu áudio",
    related: ["masterizar-musica-online", "aumentar-volume-audio", "melhorar-audio-video"],
  },
  {
    slug: "melhorar-audio-video",
    path: "/ferramentas/melhorar-audio-video",
    title: "Melhorar o áudio de um vídeo online (MP4 e WebM)",
    description:
      "Melhore a trilha de áudio de vídeos MP4 ou WebM sem perder a imagem original. O processamento é feito no navegador, sem enviar o vídeo. Compare antes e depois. 1 faixa grátis.",
    h1: "Melhorar o áudio de um vídeo",
    eyebrow: "Vídeo com som fraco",
    intro:
      "Se a imagem do vídeo está boa, mas o som está baixo ou sem clareza, você só precisa tratar a trilha. O AudioMix melhora o áudio e devolve o vídeo com a imagem original preservada.",
    sections: [
      {
        heading: "Imagem preservada, áudio tratado",
        paragraphs: [
          "O AudioMix não recodifica a imagem: os quadros de vídeo originais são copiados e apenas a trilha de áudio é substituída pela versão tratada. O resultado sai em MP4 ou WebM, conforme a compatibilidade do arquivo.",
          PRIVACY + " Isso vale também para vídeos longos ou pessoais.",
        ],
      },
      {
        heading: "Quando usar",
        paragraphs: ["Alguns casos comuns:"],
        bullets: [
          "Vídeos de celular com voz baixa.",
          "Gravações de aulas, palestras e eventos.",
          "Vídeos de ensaio ou show para redes sociais.",
          "Conteúdo para YouTube, Instagram e WhatsApp, com alvo de volume adequado para cada destino.",
        ],
      },
    ],
    steps: [
      "Envie o vídeo (MP4, WebM ou outro formato compatível com o navegador).",
      "Escolha o destino do vídeo (YouTube, redes sociais, WhatsApp).",
      "Compare o vídeo com áudio original e tratado.",
      "Baixe o vídeo com a trilha melhorada.",
    ],
    faq: [
      {
        q: "A qualidade da imagem diminui?",
        a: "Não. A imagem original é preservada; só a trilha de áudio é substituída.",
      },
      {
        q: "Quais formatos de vídeo são aceitos?",
        a: "MP4, WebM e outros formatos que o seu navegador consiga reproduzir.",
      },
      {
        q: "O vídeo é enviado para a internet?",
        a: "Não. Todo o processamento acontece no seu navegador.",
      },
    ],
    cta: "Melhorar o áudio do meu vídeo",
    related: ["aumentar-volume-audio", "melhorar-audio-podcast", "audio-whatsapp"],
  },
  {
    slug: "audio-whatsapp",
    path: "/ferramentas/audio-whatsapp",
    title: "Deixar áudio mais alto e claro para WhatsApp",
    description:
      "Prepare gravações para WhatsApp: volume mais alto, voz mais clara e exportação em MP3 128 kbps, leve para enviar. Tudo no navegador, sem enviar o arquivo. 1 faixa grátis.",
    h1: "Áudio mais alto e claro para WhatsApp",
    eyebrow: "Para mandar no WhatsApp",
    intro:
      "No celular o áudio é ouvido em alto-falante pequeno, em ambientes barulhentos. O objetivo WhatsApp do AudioMix eleva o volume, realça a presença da voz e exporta em MP3 leve.",
    sections: [
      {
        heading: "O que muda no objetivo WhatsApp",
        paragraphs: [
          "O alvo de volume é mais alto (-11 LUFS) do que o de YouTube (-14 LUFS), porque o áudio costuma ser ouvido em alto-falantes pequenos. O equalizador realça a região de presença da voz e reduz sub-graves que o alto-falante do celular nem reproduz.",
        ],
        bullets: [
          "Volume mais alto com teto de pico em -1 dBTP para evitar distorção.",
          "Mais presença e clareza para música e fala.",
          "Predefinição de exportação WhatsApp: MP3 em 128 kbps, arquivo leve.",
        ],
      },
    ],
    steps: [
      "Envie o áudio ou vídeo.",
      "Escolha o objetivo WhatsApp.",
      "Aplique o tratamento e confira o antes e depois.",
      "Exporte em MP3 128 kbps.",
    ],
    faq: [
      {
        q: "O WhatsApp reduz a qualidade do áudio?",
        a: "O WhatsApp comprime os arquivos ao enviar. Por isso é importante enviar um áudio já equilibrado e com margem de pico, para que a compressão não o distorça.",
      },
      {
        q: "Funciona para áudio de voz?",
        a: "Sim. Para voz falada você também pode usar o objetivo Voz falada, que reduz graves desnecessários e realça a clareza.",
      },
    ],
    cta: "Preparar meu áudio para WhatsApp",
    related: ["aumentar-volume-audio", "melhorar-audio-podcast", "melhorar-audio-video"],
  },
  {
    slug: "masterizar-musica-online",
    path: "/ferramentas/masterizar-musica-online",
    title: "Masterizar música online no navegador",
    description:
      "Masterização online para músicas e ensaios: diagnóstico de LUFS, pico e dinâmica, EQ, compressor, limiter e exportação WAV ou MP3 320 kbps. Sem enviar o arquivo. 1 faixa grátis.",
    h1: "Masterizar música online",
    eyebrow: "Música e ensaio",
    intro:
      "Masterizar é equilibrar frequência, dinâmica e volume para que a música soe bem em qualquer caixa ou plataforma. O AudioMix faz esse processo no navegador e mostra o resultado em números e no ouvido.",
    sections: [
      {
        heading: "Etapas do tratamento",
        paragraphs: ["O pipeline segue a ordem usual de masterização. " + PRIVACY],
        bullets: [
          "Filtro passa-altas e equalização de 10 bandas conforme o objetivo.",
          "Compressor para controlar a dinâmica.",
          "Limiter para segurar o pico.",
          "Graves em mono abaixo de 120 Hz, para compatibilidade com caixas pequenas.",
          "Normalização por loudness com teto de pico real.",
        ],
      },
      {
        heading: "Diagnóstico antes de mexer",
        paragraphs: [
          "O diagnóstico mede LUFS, pico real, faixa dinâmica, largura estéreo e distribuição de energia em sub-graves, graves, médios, presença e agudos, e aponta o que está fora do esperado para o destino escolhido.",
          "Uma masterização automática não substitui um engenheiro de mixagem em um projeto comercial. Ela resolve bem gravações caseiras, ensaios, demos e material ao vivo.",
        ],
      },
    ],
    steps: [
      "Envie a música ou gravação.",
      "Escolha o objetivo: música/banda, YouTube, redes sociais ou gravação ao vivo.",
      "Veja o diagnóstico e aplique o tratamento.",
      "Compare, ajuste a intensidade e baixe em WAV 16 bits ou MP3 até 320 kbps.",
    ],
    faq: [
      {
        q: "A masterização automática substitui um estúdio?",
        a: "Não. Ela é ideal para demos, ensaios, gravações caseiras e ao vivo. Para lançamentos comerciais, uma masterização profissional ainda é a melhor opção.",
      },
      {
        q: "Quais formatos posso exportar?",
        a: "WAV 16 bits sem perdas ou MP3 em 128, 192, 256 e 320 kbps.",
      },
      {
        q: "Posso ajustar manualmente?",
        a: "Sim. A mesa avançada tem equalizador de 10 bandas, compressor, limiter e normalização.",
      },
    ],
    cta: "Masterizar minha música",
    related: ["aumentar-graves-audio", "normalizar-audio-lufs", "aumentar-volume-audio"],
  },
  {
    slug: "melhorar-audio-podcast",
    path: "/ferramentas/melhorar-audio-podcast",
    title: "Melhorar áudio de podcast, aula e voz gravada",
    description:
      "Deixe voz de podcast, aula ou narração mais clara e com volume constante: filtro de graves, compressor e normalização em LUFS, tudo no navegador. 1 faixa grátis.",
    h1: "Melhorar o áudio de podcast, aula e narração",
    eyebrow: "Voz falada",
    intro:
      "Voz baixa, oscilando de volume ou abafada cansa quem ouve. O objetivo Voz falada do AudioMix corta o grave desnecessário, realça a clareza e uniformiza o volume.",
    sections: [
      {
        heading: "Como a voz é tratada",
        paragraphs: ["O ajuste para voz usa um filtro passa-altas mais alto, cortes nos graves e realce da região de presença. " + PRIVACY],
        bullets: [
          "Filtro passa-altas em 85 Hz para remover rumble e ruído de manuseio.",
          "Realce da inteligibilidade nos médios-agudos.",
          "Compressor com taxa mais firme para manter o volume constante.",
          "Alvo de -16 LUFS, usado como referência para podcasts.",
        ],
      },
      {
        heading: "O que ele não faz",
        paragraphs: [
          "O AudioMix não remove ruído de fundo nem eco de sala. Ele melhora volume, equilíbrio e clareza. Para gravações muito ruidosas, o ideal é tratar o ruído antes.",
        ],
      },
    ],
    steps: [
      "Envie a gravação de voz ou vídeo.",
      "Escolha o objetivo Voz falada.",
      "Aplique o tratamento e compare.",
      "Baixe em MP3 ou WAV.",
    ],
    faq: [
      {
        q: "Serve para aulas gravadas e palestras?",
        a: "Sim. O objetivo Voz falada funciona para podcasts, aulas, palestras, narração e pregações.",
      },
      {
        q: "Remove ruído de fundo?",
        a: "Não. O tratamento ajusta frequências, dinâmica e volume, mas não faz redução de ruído.",
      },
    ],
    cta: "Melhorar minha gravação de voz",
    related: ["aumentar-volume-audio", "audio-whatsapp", "melhorar-audio-video"],
  },
  {
    slug: "normalizar-audio-lufs",
    path: "/ferramentas/normalizar-audio-lufs",
    title: "Normalizar áudio em LUFS para YouTube e redes sociais",
    description:
      "Normalize o volume do seu áudio em LUFS com teto de pico real. Alvos prontos: -14 LUFS (YouTube), -12 (redes sociais), -11 (WhatsApp) e -16 (voz). Tudo no navegador.",
    h1: "Normalizar áudio em LUFS",
    eyebrow: "Loudness",
    intro:
      "Plataformas ajustam o volume dos vídeos e das músicas com base em loudness. Entregar o arquivo já no nível certo evita que ele seja reduzido ou fique baixo demais perto dos outros.",
    sections: [
      {
        heading: "Alvos de loudness usados pelo AudioMix",
        paragraphs: ["Cada objetivo tem um alvo e um teto de pico real (dBTP):"],
        bullets: [
          "YouTube: -14 LUFS, teto -1 dBTP.",
          "Música / banda e gravação ao vivo: -14 LUFS, teto -1 dBTP.",
          "Redes sociais: -12 LUFS, teto -1 dBTP.",
          "WhatsApp: -11 LUFS, teto -1 dBTP.",
          "Voz falada: -16 LUFS, teto -1,5 dBTP.",
        ],
      },
      {
        heading: "Sobre a precisão da medição",
        paragraphs: [
          "A medição de LUFS do AudioMix é uma aproximação de ITU-R BS.1770 (ponderação K e gate), feita no navegador. Serve para orientar o tratamento e comparar antes e depois, mas pode diferir em décimos de LU de um medidor certificado.",
        ],
      },
    ],
    steps: [
      "Envie o arquivo.",
      "Escolha o destino para usar o alvo correspondente.",
      "Aplique o tratamento: a normalização é feita depois do EQ e da compressão.",
      "Confira o ganho aplicado e as métricas finais.",
    ],
    faq: [
      {
        q: "O que é pico real (dBTP)?",
        a: "É o maior nível que o sinal atinge depois de convertido, considerando picos entre amostras. Manter abaixo de -1 dBTP evita distorção em codecs como MP3 e AAC.",
      },
      {
        q: "Qual é o LUFS ideal para YouTube?",
        a: "A referência comum é cerca de -14 LUFS integrado. O YouTube pode reduzir o volume de conteúdos acima disso.",
      },
    ],
    cta: "Normalizar meu áudio",
    related: ["aumentar-volume-audio", "masterizar-musica-online", "audio-whatsapp"],
  },
];

export const seoPageBySlug = (slug: string) => SEO_PAGES.find((p) => p.slug === slug)!;
