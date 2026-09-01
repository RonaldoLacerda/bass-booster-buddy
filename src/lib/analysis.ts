/**
 * Audio Intelligence — análise 100% local (Web Audio API).
 * Todos os números vêm de medição real do buffer; nada é estimado ou simulado.
 */

export type AudioMetrics = {
  duration: number;
  sampleRate: number;
  channels: number;
  lufs: number; // loudness integrado aproximado (K-weighting + gate)
  rms: number; // dBFS
  peak: number; // dBFS
  truePeak: number; // dBFS (4x oversampling linear)
  clipping: boolean;
  clippedSamples: number;
  crestFactor: number; // dB
  dynamicRange: number; // dB (LRA simplificado: p95 - p10 dos blocos)
  bassEnergy: number; // 0..1
  midEnergy: number; // 0..1
  highEnergy: number; // 0..1
  subEnergy: number; // 0..1 (abaixo de 60 Hz)
  presenceEnergy: number; // 0..1 (2k–6k)
  stereoWidth: number; // 0..1
  silenceRatio: number; // 0..1
};

const db = (v: number) => 20 * Math.log10(Math.max(v, 1e-7));

function mixToMono(buffer: AudioBuffer): Float32Array {
  const len = buffer.length;
  const out = new Float32Array(len);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < len; i++) out[i] = out[i]! + d[i]!;
  }
  const n = buffer.numberOfChannels || 1;
  for (let i = 0; i < len; i++) out[i] = out[i]! / n;
  return out;
}

function rmsOf(data: Float32Array, step = 1): number {
  let sum = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += step) {
    sum += data[i]! * data[i]!;
    n++;
  }
  return Math.sqrt(sum / Math.max(1, n));
}

/** Renderiza o buffer através de filtros e devolve o resultado (offline). */
async function renderFiltered(
  buffer: AudioBuffer,
  make: (ctx: OfflineAudioContext) => { input: AudioNode; output: AudioNode },
): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);
  const src = ctx.createBufferSource();
  const mono = ctx.createBuffer(1, buffer.length, buffer.sampleRate);
  mono.copyToChannel(mixToMono(buffer) as Float32Array<ArrayBuffer>, 0);
  src.buffer = mono;
  const { input, output } = make(ctx);
  src.connect(input);
  output.connect(ctx.destination);
  src.start();
  return ctx.startRendering();
}

/** Loudness integrado (aprox. ITU-R BS.1770: K-weighting + gate de -10 LU). */
async function measureLufsAndRange(buffer: AudioBuffer) {
  const weighted = await renderFiltered(buffer, (ctx) => {
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 38;
    hp.Q.value = 0.5;
    const shelf = ctx.createBiquadFilter();
    shelf.type = "highshelf";
    shelf.frequency.value = 1500;
    shelf.gain.value = 4;
    hp.connect(shelf);
    return { input: hp, output: shelf };
  });

  const data = weighted.getChannelData(0);
  const sr = weighted.sampleRate;
  const block = Math.max(1, Math.floor(sr * 0.4));
  const hop = Math.max(1, Math.floor(block / 4));
  const blocks: number[] = [];
  for (let i = 0; i + block <= data.length; i += hop) {
    let sum = 0;
    for (let j = i; j < i + block; j++) sum += data[j]! * data[j]!;
    const loud = -0.691 + 10 * Math.log10(Math.max(sum / block, 1e-12));
    if (loud > -70) blocks.push(loud);
  }
  if (!blocks.length) return { lufs: -70, dynamicRange: 0 };

  const mean = (list: number[]) =>
    -0.691 +
    10 * Math.log10(list.reduce((a, l) => a + Math.pow(10, (l + 0.691) / 10), 0) / list.length);
  const ungated = mean(blocks);
  const gated = blocks.filter((l) => l > ungated - 10);
  const lufs = mean(gated.length ? gated : blocks);

  const sorted = [...(gated.length ? gated : blocks)].sort((a, b) => a - b);
  const pick = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]!;
  return { lufs, dynamicRange: Math.max(0, pick(0.95) - pick(0.1)) };
}

async function bandEnergy(buffer: AudioBuffer, low: number, high: number): Promise<number> {
  const out = await renderFiltered(buffer, (ctx) => {
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = low;
    hp.Q.value = 0.7;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = high;
    lp.Q.value = 0.7;
    hp.connect(lp);
    return { input: hp, output: lp };
  });
  return rmsOf(out.getChannelData(0), 3);
}

export async function analyzeBuffer(buffer: AudioBuffer): Promise<AudioMetrics> {
  const mono = mixToMono(buffer);
  const sr = buffer.sampleRate;

  // pico, clipping e true peak
  let peak = 0;
  let clipped = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < d.length; i++) {
      const v = Math.abs(d[i]!);
      if (v > peak) peak = v;
      if (v >= 0.997) clipped++;
    }
  }
  let truePeak = peak;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const d = buffer.getChannelData(c);
    for (let i = 1; i < d.length; i++) {
      for (let k = 1; k < 4; k++) {
        const v = Math.abs(d[i - 1]! + ((d[i]! - d[i - 1]!) * k) / 4);
        if (v > truePeak) truePeak = v;
      }
    }
  }

  const rms = rmsOf(mono, 2);

  // silêncio: blocos de 100 ms abaixo de -50 dBFS
  const frame = Math.max(1, Math.floor(sr * 0.1));
  let silent = 0;
  let frames = 0;
  for (let i = 0; i + frame <= mono.length; i += frame) {
    frames++;
    if (db(rmsOf(mono.subarray(i, i + frame), 2)) < -50) silent++;
  }

  // estéreo: relação side / (mid + side)
  let stereoWidth = 0;
  if (buffer.numberOfChannels >= 2) {
    const l = buffer.getChannelData(0);
    const r = buffer.getChannelData(1);
    let midSum = 0;
    let sideSum = 0;
    for (let i = 0; i < l.length; i += 3) {
      const m = (l[i]! + r[i]!) / 2;
      const s = (l[i]! - r[i]!) / 2;
      midSum += m * m;
      sideSum += s * s;
    }
    const mid = Math.sqrt(midSum);
    const side = Math.sqrt(sideSum);
    stereoWidth = mid + side > 0 ? side / (mid + side) : 0;
  }

  const [{ lufs, dynamicRange }, sub, bass, mid, high, presence] = await Promise.all([
    measureLufsAndRange(buffer),
    bandEnergy(buffer, 20, 60),
    bandEnergy(buffer, 60, 250),
    bandEnergy(buffer, 250, 2000),
    bandEnergy(buffer, 6000, 16000),
    bandEnergy(buffer, 2000, 6000),
  ]);
  const total = sub + bass + mid + high + presence || 1;

  return {
    duration: buffer.duration,
    sampleRate: sr,
    channels: buffer.numberOfChannels,
    lufs,
    rms: db(rms),
    peak: db(peak),
    truePeak: db(truePeak),
    clipping: clipped > 8,
    clippedSamples: clipped,
    crestFactor: db(peak) - db(rms),
    dynamicRange,
    subEnergy: sub / total,
    bassEnergy: bass / total,
    midEnergy: mid / total,
    highEnergy: high / total,
    presenceEnergy: presence / total,
    stereoWidth,
    silenceRatio: frames ? silent / frames : 0,
  };
}

/** Resumo compacto — é o único payload que faz sentido enviar a um LLM. */
export function metricsSummary(m: AudioMetrics, goal: string) {
  const level = (v: number, low: number, high: number) => (v < low ? "low" : v > high ? "high" : "normal");
  return {
    goal,
    lufs: Number(m.lufs.toFixed(1)),
    peak: Number(m.truePeak.toFixed(1)),
    clipping: m.clipping,
    bass: level(m.bassEnergy + m.subEnergy, 0.3, 0.55),
    mid: level(m.midEnergy, 0.2, 0.45),
    high: level(m.highEnergy + m.presenceEnergy, 0.18, 0.4),
    stereo: m.channels < 2 ? "mono" : level(m.stereoWidth, 0.1, 0.45),
    dynamic_range: level(m.dynamicRange, 5, 12),
  };
}
