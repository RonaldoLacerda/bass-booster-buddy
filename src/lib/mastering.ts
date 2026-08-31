/**
 * Pipeline de masterização: DSP real + normalização por loudness + cache.
 */
import { analyzeBuffer, type AudioMetrics } from "./analysis";
import { buildChain, encodeMp3, encodeWav, type EqSettings, type ExportFormat } from "./audio-engine";
import { buildGoalSettings, goalById, type FocusId, type GoalId, type GoalProfile } from "./goals";

export type MasterResult = {
  buffer: AudioBuffer;
  metrics: AudioMetrics;
  settings: EqSettings;
  gainApplied: number; // dB
};

/** Soma os graves abaixo do crossover em mono (compatibilidade com caixas pequenas). */
function monoBassInPlace(buffer: AudioBuffer, crossover = 120) {
  if (buffer.numberOfChannels < 2) return;
  const l = buffer.getChannelData(0);
  const r = buffer.getChannelData(1);
  const rc = 1 / (2 * Math.PI * crossover);
  const dt = 1 / buffer.sampleRate;
  const a = dt / (rc + dt);
  let lpL = 0;
  let lpR = 0;
  for (let i = 0; i < l.length; i++) {
    lpL += a * (l[i]! - lpL);
    lpR += a * (r[i]! - lpR);
    const mid = (lpL + lpR) / 2;
    l[i] = l[i]! - lpL + mid;
    r[i] = r[i]! - lpR + mid;
  }
}

function applyGain(buffer: AudioBuffer, gainDb: number, ceilingDb: number) {
  const g = Math.pow(10, gainDb / 20);
  const ceiling = Math.pow(10, ceilingDb / 20);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < d.length; i++) {
      const v = d[i]! * g;
      d[i] = v > ceiling ? ceiling : v < -ceiling ? -ceiling : v;
    }
  }
}

async function renderWithChain(buffer: AudioBuffer, settings: EqSettings): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const chain = buildChain(ctx, settings);
  src.connect(chain.input);
  chain.output.connect(ctx.destination);
  src.start();
  return ctx.startRendering();
}

const cache = new Map<string, MasterResult>();
export const masterCacheKey = (fileKey: string, goal: GoalId, focus: FocusId) =>
  `${fileKey}::${goal}::${focus}`;

/** Masteriza para o objetivo: EQ → compressor → limiter → mono bass → loudness. */
export async function masterAudio(
  buffer: AudioBuffer,
  metrics: AudioMetrics,
  goalId: GoalId,
  focus: FocusId = "none",
  cacheKey?: string,
): Promise<MasterResult> {
  const key = cacheKey ? masterCacheKey(cacheKey, goalId, focus) : null;
  if (key && cache.has(key)) return cache.get(key)!;

  const goal: GoalProfile = goalById(goalId);
  const settings = buildGoalSettings(goal, metrics, focus);

  const rendered = await renderWithChain(buffer, settings);
  if (goal.monoBass) monoBassInPlace(rendered);

  // Normalização por loudness com teto de pico real
  const pre = await analyzeBuffer(rendered);
  const wanted = goal.targetLufs - pre.lufs;
  const headroom = goal.ceiling - pre.truePeak;
  const gainApplied = Math.min(wanted, Math.max(headroom, wanted > 0 ? headroom : wanted));
  if (Math.abs(gainApplied) > 0.05) applyGain(rendered, gainApplied, goal.ceiling);

  const metricsOut = await analyzeBuffer(rendered);
  const result: MasterResult = { buffer: rendered, metrics: metricsOut, settings, gainApplied };
  if (key) cache.set(key, result);
  return result;
}

export type ExportPresetId = "whatsapp" | "youtube" | "instagram" | "hifi" | "wav";

export type ExportPreset = {
  id: ExportPresetId;
  emoji: string;
  name: string;
  detail: string;
  format: ExportFormat;
  bitrate?: number;
};

export const EXPORT_PRESETS: ExportPreset[] = [
  { id: "whatsapp", emoji: "📱", name: "WhatsApp", detail: "MP3 128 kbps — arquivo leve", format: "mp3", bitrate: 128 },
  { id: "youtube", emoji: "▶️", name: "YouTube", detail: "MP3 192 kbps", format: "mp3", bitrate: 192 },
  { id: "instagram", emoji: "📸", name: "Instagram", detail: "MP3 256 kbps", format: "mp3", bitrate: 256 },
  { id: "hifi", emoji: "🎧", name: "Alta qualidade", detail: "MP3 320 kbps", format: "mp3", bitrate: 320 },
  { id: "wav", emoji: "💿", name: "WAV", detail: "16 bits sem perda", format: "wav" },
];

export async function encodeExport(buffer: AudioBuffer, preset: ExportPreset): Promise<Blob> {
  return preset.format === "mp3" ? encodeMp3(buffer, preset.bitrate ?? 320) : encodeWav(buffer);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
