/**
 * Perfis de objetivo e de foco perceptual.
 * Toda parametrização de áudio fica aqui — nunca dentro de componentes React.
 */
import { DEFAULT_BANDS, type EqSettings } from "./audio-engine";
import type { AudioMetrics } from "./analysis";

export type GoalId = "worship_live" | "preaching" | "worship" | "whatsapp" | "youtube" | "social_media";

export type GoalProfile = {
  id: GoalId;
  emoji: string;
  name: string;
  tagline: string;
  targetLufs: number;
  ceiling: number; // dBTP
  highpass: number;
  gains: Record<string, number>;
  threshold: number;
  ratio: number;
  monoBass: boolean;
};

export const GOALS: GoalProfile[] = [
  {
    id: "worship_live",
    emoji: "🙏",
    name: "Culto ao vivo",
    tagline: "Mais clareza e impacto para ouvir a gravação completa.",
    targetLufs: -14,
    ceiling: -1,
    highpass: 38,
    gains: { sub: 2, low: 3, bass: 3, lowmid: -3, mid: -1, upmid: 1, himid: 2, pres: 3, sib: 2, air: 2 },
    threshold: -20,
    ratio: 3,
    monoBass: true,
  },
  {
    id: "preaching",
    emoji: "🎤",
    name: "Pregação",
    tagline: "Prioriza inteligibilidade e presença da voz.",
    targetLufs: -16,
    ceiling: -1.5,
    highpass: 85,
    gains: { sub: -8, low: -4, bass: 0, lowmid: -3, mid: 1, upmid: 3, himid: 4, pres: 3, sib: 1, air: 0 },
    threshold: -22,
    ratio: 4,
    monoBass: true,
  },
  {
    id: "worship",
    emoji: "🎵",
    name: "Louvor",
    tagline: "Equilibra banda e destaca a voz.",
    targetLufs: -14,
    ceiling: -1,
    highpass: 32,
    gains: { sub: 3, low: 4, bass: 2, lowmid: -3, mid: -1, upmid: 1, himid: 3, pres: 3, sib: 3, air: 3 },
    threshold: -21,
    ratio: 3.5,
    monoBass: true,
  },
  {
    id: "whatsapp",
    emoji: "📱",
    name: "WhatsApp",
    tagline: "Som forte e claro em celulares.",
    targetLufs: -11,
    ceiling: -1,
    highpass: 60,
    gains: { sub: -4, low: 0, bass: 3, lowmid: 1, mid: 2, upmid: 4, himid: 4, pres: 3, sib: 1, air: 0 },
    threshold: -25,
    ratio: 5,
    monoBass: true,
  },
  {
    id: "youtube",
    emoji: "▶️",
    name: "YouTube",
    tagline: "Volume consistente e áudio agradável.",
    targetLufs: -14,
    ceiling: -1,
    highpass: 34,
    gains: { sub: 1, low: 2, bass: 2, lowmid: -2, mid: 0, upmid: 1, himid: 2, pres: 2, sib: 2, air: 2 },
    threshold: -20,
    ratio: 3,
    monoBass: true,
  },
  {
    id: "social_media",
    emoji: "🎙️",
    name: "Redes sociais",
    tagline: "Otimizado para cortes e conteúdo curto.",
    targetLufs: -12,
    ceiling: -1,
    highpass: 50,
    gains: { sub: -2, low: 1, bass: 2, lowmid: -1, mid: 1, upmid: 3, himid: 3, pres: 3, sib: 2, air: 1 },
    threshold: -24,
    ratio: 4.5,
    monoBass: true,
  },
];

export const goalById = (id: GoalId) => GOALS.find((g) => g.id === id)!;

export type FocusId = "none" | "bass" | "vocals" | "drums" | "keys" | "guitar" | "speech";

export type FocusProfile = {
  id: FocusId;
  emoji: string;
  name: string;
  cta: string;
  explanation: string;
  gains: Record<string, number>;
  monoBass: boolean;
};

export const FOCUS: FocusProfile[] = [
  {
    id: "none",
    emoji: "🎚️",
    name: "Sem foco",
    cta: "Mix equilibrada",
    explanation: "Mantemos o equilíbrio geral definido pelo objetivo escolhido.",
    gains: {},
    monoBass: false,
  },
  {
    id: "bass",
    emoji: "🎸",
    name: "Baixo",
    cta: "Quero ouvir melhor o baixo",
    explanation:
      "Realçamos a presença do baixo sem aumentar excessivamente o volume geral: reforço de fundamental, controle da região onde ele compete com bumbo e teclado, e um toque de definição no ataque.",
    gains: { sub: 2, low: 3, bass: 2, lowmid: -3, mid: -1, upmid: 1, himid: 2 },
    monoBass: true,
  },
  {
    id: "vocals",
    emoji: "🎤",
    name: "Voz",
    cta: "Quero ouvir melhor a voz",
    explanation:
      "Reduzimos a região que embola a voz e reforçamos presença e articulação, mantendo o restante da mix intacto.",
    gains: { sub: -3, low: -1, lowmid: -3, mid: 1, upmid: 3, himid: 3, pres: 3 },
    monoBass: true,
  },
  {
    id: "drums",
    emoji: "🥁",
    name: "Bateria",
    cta: "Quero ouvir melhor a bateria",
    explanation:
      "Destacamos o ataque do bumbo e o brilho dos pratos, controlando a região abafada no meio-grave.",
    gains: { sub: 2, low: 3, lowmid: -3, mid: -1, pres: 3, sib: 3, air: 2 },
    monoBass: true,
  },
  {
    id: "keys",
    emoji: "🎹",
    name: "Teclado",
    cta: "Quero ouvir melhor o teclado",
    explanation:
      "Abrimos a faixa média onde o teclado vive e reduzimos o acúmulo de grave que o encobre.",
    gains: { low: -2, bass: -1, lowmid: -1, mid: 2, upmid: 2, himid: 2, air: 2 },
    monoBass: false,
  },
  {
    id: "guitar",
    emoji: "🎸",
    name: "Violão",
    cta: "Quero ouvir melhor o violão",
    explanation:
      "Damos corpo controlado e brilho de cordas, sem deixar o som fino nem estridente.",
    gains: { sub: -3, bass: 1, lowmid: -2, mid: 1, himid: 2, pres: 3, sib: 2, air: 2 },
    monoBass: false,
  },
  {
    id: "speech",
    emoji: "🎙️",
    name: "Pregação",
    cta: "Quero ouvir melhor a pregação",
    explanation:
      "Aplicamos filtro subsônico, controlamos o peito da voz e reforçamos a faixa de inteligibilidade.",
    gains: { sub: -8, low: -4, lowmid: -3, mid: 1, upmid: 3, himid: 4, pres: 3 },
    monoBass: true,
  },
];

export const focusById = (id: FocusId) => FOCUS.find((f) => f.id === id)!;

/** Combina objetivo + medições reais + foco em uma cadeia de processamento. */
export function buildGoalSettings(
  goal: GoalProfile,
  m: AudioMetrics,
  focusId: FocusId = "none",
): EqSettings {
  const focus = focusById(focusId);
  const gains: Record<string, number> = { ...goal.gains };
  for (const [k, v] of Object.entries(focus.gains)) {
    gains[k] = (gains[k] ?? 0) * 0.4 + v; // o foco domina, o objetivo tempera
  }

  // Ajustes guiados pelas métricas medidas
  const lowTotal = m.subEnergy + m.bassEnergy;
  if (lowTotal > 0.55) {
    gains.sub = (gains.sub ?? 0) - 3;
    gains.low = (gains.low ?? 0) - 2;
    gains.lowmid = (gains.lowmid ?? 0) - 1;
  } else if (lowTotal < 0.25) {
    gains.low = (gains.low ?? 0) + 2;
    gains.bass = (gains.bass ?? 0) + 1;
  }
  if (m.presenceEnergy < 0.14) {
    gains.himid = (gains.himid ?? 0) + 2;
    gains.pres = (gains.pres ?? 0) + 2;
  }
  if (m.highEnergy > 0.35) gains.sib = (gains.sib ?? 0) - 2;

  let threshold = goal.threshold;
  let ratio = goal.ratio;
  if (m.dynamicRange > 12) {
    threshold -= 3;
    ratio += 1;
  } else if (m.dynamicRange < 5) {
    threshold += 3;
    ratio = Math.max(1.5, ratio - 1);
  }

  const clamp = (v: number) => Math.max(-12, Math.min(12, v));

  return {
    bands: DEFAULT_BANDS.map((b) => ({ ...b, gain: clamp(gains[b.id] ?? 0) })),
    highpass: goal.highpass,
    compressor: true,
    threshold: Math.max(-40, Math.min(-6, threshold)),
    ratio: Math.max(1.5, Math.min(8, ratio)),
    outputGain: 0,
    normalize: false, // a normalização é por loudness (LUFS), feita no mastering
    targetPeak: Math.pow(10, goal.ceiling / 20),
    limiter: true,
    limiterCeiling: goal.ceiling,
  };
}
