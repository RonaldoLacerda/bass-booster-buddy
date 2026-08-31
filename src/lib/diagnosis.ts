/**
 * Diagnóstico determinístico a partir das métricas medidas.
 * Nenhum áudio sai do navegador e nenhum número é inventado.
 */
import type { AudioMetrics } from "./analysis";
import type { GoalProfile } from "./goals";

export type Severity = "high" | "medium" | "ok";

export type Issue = {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  action: string;
};

export type Diagnosis = {
  score: number;
  summary: string;
  issues: Issue[];
  plan: string[];
};

export function diagnose(m: AudioMetrics, goal: GoalProfile): Diagnosis {
  const issues: Issue[] = [];
  const plan: string[] = [];
  let score = 100;

  const gap = goal.targetLufs - m.lufs;
  if (gap > 6) {
    issues.push({
      id: "loudness",
      severity: "high",
      title: "Volume baixo",
      description: `Medimos ${m.lufs.toFixed(1)} LUFS, ${gap.toFixed(1)} dB abaixo do ideal para ${goal.name.toLowerCase()}. Podemos aumentar o volume percebido mantendo margem de segurança.`,
      action: "increase_loudness",
    });
    plan.push("Aumentar volume percebido até o alvo do objetivo");
    score -= 22;
  } else if (gap > 2.5) {
    issues.push({
      id: "loudness",
      severity: "medium",
      title: "Volume um pouco abaixo",
      description: `Está em ${m.lufs.toFixed(1)} LUFS; o alvo do objetivo é ${goal.targetLufs} LUFS.`,
      action: "increase_loudness",
    });
    plan.push("Ajustar o volume percebido para o alvo");
    score -= 8;
  } else if (gap < -3) {
    issues.push({
      id: "loudness",
      severity: "medium",
      title: "Volume acima do alvo",
      description: `Está em ${m.lufs.toFixed(1)} LUFS, mais alto que o recomendado — plataformas reduzem isso automaticamente.`,
      action: "reduce_loudness",
    });
    plan.push("Normalizar o volume para o alvo do objetivo");
    score -= 6;
  } else {
    issues.push({
      id: "loudness",
      severity: "ok",
      title: "Volume adequado",
      description: `Loudness de ${m.lufs.toFixed(1)} LUFS, dentro do alvo.`,
      action: "none",
    });
  }

  const low = m.subEnergy + m.bassEnergy;
  if (low > 0.55) {
    issues.push({
      id: "bass",
      severity: "high",
      title: "Excesso de grave",
      description: `${Math.round(low * 100)}% da energia está abaixo de 250 Hz, o que deixa o som embolado e abafado.`,
      action: "reduce_low_end",
    });
    plan.push("Corrigir graves desnecessários e limpar o meio-grave");
    score -= 16;
  } else if (low > 0.45) {
    issues.push({
      id: "bass",
      severity: "medium",
      title: "Grave um pouco pesado",
      description: `Energia de graves em ${Math.round(low * 100)}%; um controle leve deixa a mix mais aberta.`,
      action: "reduce_low_end",
    });
    plan.push("Controlar acúmulo de meio-grave");
    score -= 7;
  } else if (low < 0.22) {
    issues.push({
      id: "bass",
      severity: "medium",
      title: "Falta de corpo",
      description: `Só ${Math.round(low * 100)}% da energia está na região grave — o som fica fino.`,
      action: "add_low_end",
    });
    plan.push("Reforçar corpo e fundamental");
    score -= 8;
  } else {
    issues.push({
      id: "bass",
      severity: "ok",
      title: "Graves equilibrados",
      description: `Distribuição de graves saudável (${Math.round(low * 100)}%).`,
      action: "none",
    });
  }

  if (m.presenceEnergy < 0.14) {
    issues.push({
      id: "presence",
      severity: "medium",
      title: "Voz pouco presente",
      description: `A faixa de 2 kHz a 6 kHz, onde vive a inteligibilidade da voz, responde por apenas ${Math.round(m.presenceEnergy * 100)}% da energia.`,
      action: "boost_presence",
    });
    plan.push("Melhorar presença e articulação da voz");
    score -= 10;
  } else if (m.highEnergy > 0.35) {
    issues.push({
      id: "presence",
      severity: "medium",
      title: "Agudo agressivo",
      description: `Energia acima de 6 kHz em ${Math.round(m.highEnergy * 100)}% — pode soar chiado e cansativo.`,
      action: "tame_highs",
    });
    plan.push("Suavizar agudos agressivos");
    score -= 7;
  } else {
    issues.push({
      id: "presence",
      severity: "ok",
      title: "Presença adequada",
      description: "A região da voz está bem representada na mix.",
      action: "none",
    });
  }

  if (m.clipping) {
    issues.push({
      id: "clipping",
      severity: "high",
      title: "Clipping detectado",
      description: `${m.clippedSamples.toLocaleString("pt-BR")} amostras chegaram ao teto digital. A distorção já gravada não é removível, mas evitamos piorar aplicando limiter com margem.`,
      action: "protect_peaks",
    });
    plan.push("Aplicar limiter com margem de segurança");
    score -= 18;
  } else {
    issues.push({
      id: "clipping",
      severity: "ok",
      title: "Sem clipping",
      description: `Pico real em ${m.truePeak.toFixed(1)} dBTP, sem estouro.`,
      action: "none",
    });
  }

  if (m.dynamicRange > 12) {
    issues.push({
      id: "dynamics",
      severity: "medium",
      title: "Variação de volume alta",
      description: `Diferença de ${m.dynamicRange.toFixed(1)} dB entre partes altas e baixas — trechos ficam inaudíveis no celular.`,
      action: "control_dynamics",
    });
    plan.push("Controlar variação de volume");
    score -= 9;
  } else {
    issues.push({
      id: "dynamics",
      severity: "ok",
      title: "Dinâmica controlada",
      description: `Faixa dinâmica de ${m.dynamicRange.toFixed(1)} dB, adequada para escuta.`,
      action: "none",
    });
  }

  if (m.channels < 2) {
    issues.push({
      id: "stereo",
      severity: "ok",
      title: "Áudio mono",
      description: "Gravação em um único canal; mantemos compatível com qualquer aparelho.",
      action: "none",
    });
  } else if (m.stereoWidth < 0.05) {
    issues.push({
      id: "stereo",
      severity: "medium",
      title: "Estéreo praticamente nulo",
      description: "Os dois canais são quase idênticos — o áudio soa como mono.",
      action: "none",
    });
    score -= 3;
  } else if (m.stereoWidth > 0.5) {
    issues.push({
      id: "stereo",
      severity: "medium",
      title: "Estéreo muito largo",
      description: `Muita energia lateral (${Math.round(m.stereoWidth * 100)}%), o que pode sumir em caixas mono.`,
      action: "mono_bass",
    });
    plan.push("Centralizar os graves para tocar bem em caixas pequenas");
    score -= 5;
  } else {
    issues.push({
      id: "stereo",
      severity: "ok",
      title: "Estéreo equilibrado",
      description: `Largura estéreo em ${Math.round(m.stereoWidth * 100)}%.`,
      action: "none",
    });
  }

  if (m.silenceRatio > 0.25) {
    issues.push({
      id: "silence",
      severity: "medium",
      title: "Muito silêncio",
      description: `${Math.round(m.silenceRatio * 100)}% da duração está praticamente em silêncio.`,
      action: "none",
    });
    score -= 4;
  }

  plan.push(`Normalizar para o objetivo ${goal.name} (${goal.targetLufs} LUFS / ${goal.ceiling} dBTP)`);

  const problems = issues.filter((i) => i.severity !== "ok");
  const summary = problems.length
    ? `${problems.length === 1 ? "Encontramos 1 ponto" : `Encontramos ${problems.length} pontos`} que podem melhorar: ${problems
        .map((p) => p.title.toLowerCase())
        .join(", ")}.`
    : "Áudio já está bem equilibrado; vamos apenas otimizar para o objetivo escolhido.";

  return {
    score: Math.max(10, Math.min(100, Math.round(score))),
    summary,
    issues,
    plan: [...new Set(plan)],
  };
}

/** Resposta ao recurso "o que está errado?" para um elemento da mix. */
export function focusInsight(m: AudioMetrics, focus: string): { finding: string; suggestion: string } {
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  if (focus === "bass") {
    return {
      finding: `Encontramos ${pct(m.bassEnergy)} da energia entre 60 e 250 Hz e ${pct(m.subEnergy)} abaixo de 60 Hz, região onde o baixo compete com bumbo e teclado.`,
      suggestion:
        "Um corte moderado nessa região nos elementos concorrentes e um pequeno reforço de presença pode melhorar a definição do baixo.",
    };
  }
  if (focus === "vocals" || focus === "speech") {
    return {
      finding: `A faixa de inteligibilidade (2–6 kHz) responde por ${pct(m.presenceEnergy)} da energia, contra ${pct(m.subEnergy + m.bassEnergy)} nos graves.`,
      suggestion:
        "Reduzir o meio-grave que embola e reforçar presença tende a destacar a voz sem subir o volume geral.",
    };
  }
  if (focus === "drums") {
    return {
      finding: `Energia de graves em ${pct(m.subEnergy + m.bassEnergy)} e de agudos em ${pct(m.highEnergy)} — a bateria depende dessas duas pontas.`,
      suggestion: "Limpar o meio-grave abafado e abrir os agudos costuma trazer ataque e brilho.",
    };
  }
  return {
    finding: `Distribuição atual: graves ${pct(m.subEnergy + m.bassEnergy)}, médios ${pct(m.midEnergy)}, presença ${pct(m.presenceEnergy)}, agudos ${pct(m.highEnergy)}.`,
    suggestion: "Ajustamos a região desse elemento e controlamos as faixas concorrentes.",
  };
}
