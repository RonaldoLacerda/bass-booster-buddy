export type BandKind = "lowshelf" | "peaking" | "highshelf";

export type Band = {
  id: string;
  label: string;
  kind: BandKind;
  freq: number;
  gain: number;
  q: number;
};

export type EqSettings = {
  bands: Band[];
  highpass: number; // Hz, 0 = off
  compressor: boolean;
  threshold: number; // dB
  ratio: number;
  outputGain: number; // dB
  normalize: boolean;
  targetPeak: number; // 0..1
};

export const DEFAULT_BANDS: Band[] = [
  { id: "sub", label: "Sub", kind: "lowshelf", freq: 40, gain: 0, q: 0.7 },
  { id: "low", label: "Grave profundo", kind: "peaking", freq: 80, gain: 0, q: 1 },
  { id: "bass", label: "Grave", kind: "peaking", freq: 150, gain: 0, q: 1 },
  { id: "lowmid", label: "Médio-grave", kind: "peaking", freq: 300, gain: 0, q: 1 },
  { id: "mid", label: "Médio", kind: "peaking", freq: 600, gain: 0, q: 1 },
  { id: "upmid", label: "Médio alto", kind: "peaking", freq: 1200, gain: 0, q: 1 },
  { id: "himid", label: "Médio-agudo", kind: "peaking", freq: 2500, gain: 0, q: 1 },
  { id: "pres", label: "Presença", kind: "peaking", freq: 4500, gain: 0, q: 1 },
  { id: "sib", label: "Agudo", kind: "peaking", freq: 8000, gain: 0, q: 1 },
  { id: "air", label: "Brilho", kind: "highshelf", freq: 12000, gain: 0, q: 0.7 },
];


export const DEFAULT_SETTINGS: EqSettings = {
  bands: DEFAULT_BANDS,
  highpass: 30,
  compressor: true,
  threshold: -18,
  ratio: 3,
  outputGain: 0,
  normalize: true,
  targetPeak: 0.95,
};

export type Preset = { id: string; name: string; description: string; apply: (s: EqSettings) => EqSettings };

const withBands = (s: EqSettings, gains: Record<string, number>): EqSettings => ({
  ...s,
  bands: s.bands.map((b) => ({ ...b, gain: gains[b.id] ?? 0 })),
});

export const PRESETS: Preset[] = [
  {
    id: "flat",
    name: "Neutro",
    description: "Zera o equalizador",
    apply: (s) => ({ ...withBands(s, {}), compressor: false, outputGain: 0 }),
  },
  {
    id: "culto",
    name: "Culto ao vivo",
    description: "Corpo, corte de sujeira e clareza na voz",
    apply: (s) => ({
      ...withBands(s, { sub: 3, low: 3, bass: 4, lowmid: -3, mid: -1, upmid: 1, himid: 2, pres: 3, sib: 2, air: 2 }),
      highpass: 40,
      compressor: true,
      threshold: -20,
      ratio: 3,
      normalize: true,
    }),
  },
  {
    id: "baixo",
    name: "Baixo em destaque",
    description: "Reforça fundamental e ataque do contrabaixo",
    apply: (s) => ({
      ...withBands(s, { sub: 4, low: 6, bass: 5, lowmid: -2, mid: 0, upmid: 2, himid: 3, pres: 1, sib: 0, air: 0 }),
      highpass: 28,
      compressor: true,
      threshold: -22,
      ratio: 4,
      normalize: true,
    }),
  },
  {
    id: "graveforte",
    name: "Grave pesado",
    description: "Máximo peso nos sub-graves",
    apply: (s) => ({
      ...withBands(s, { sub: 8, low: 7, bass: 5, lowmid: -4, mid: -2, upmid: 0, himid: 1, pres: 2, sib: 2, air: 3 }),
      highpass: 25,
      compressor: true,
      threshold: -24,
      ratio: 4,
      normalize: true,
    }),
  },
  {
    id: "voz",
    name: "Voz / pregação",
    description: "Inteligibilidade da palavra falada",
    apply: (s) => ({
      ...withBands(s, { sub: -6, low: -3, bass: 0, lowmid: -3, mid: 1, upmid: 3, himid: 4, pres: 4, sib: 2, air: 1 }),
      highpass: 80,
      compressor: true,
      threshold: -20,
      ratio: 4,
      normalize: true,
    }),
  },
  {
    id: "loud",
    name: "Volume máximo",
    description: "Compressão forte para áudio muito baixo",
    apply: (s) => ({
      ...withBands(s, { sub: 2, low: 3, bass: 3, lowmid: -2, mid: 0, upmid: 1, himid: 2, pres: 2, sib: 1, air: 1 }),
      highpass: 35,
      compressor: true,
      threshold: -28,
      ratio: 6,
      outputGain: 4,
      normalize: true,
    }),
  },
  {
    id: "banda",
    name: "Banda completa",
    description: "Curva sorriso equilibrada para louvor com banda",
    apply: (s) => ({
      ...withBands(s, { sub: 3, low: 4, bass: 2, lowmid: -3, mid: -2, upmid: 0, himid: 2, pres: 3, sib: 3, air: 4 }),
      highpass: 32,
      compressor: true,
      threshold: -22,
      ratio: 3.5,
      normalize: true,
    }),
  },
  {
    id: "celular",
    name: "Celular / caixinha",
    description: "Traz o grave aparente em alto-falantes pequenos",
    apply: (s) => ({
      ...withBands(s, { sub: -3, low: 0, bass: 3, lowmid: 1, mid: 2, upmid: 4, himid: 4, pres: 3, sib: 1, air: 0 }),
      highpass: 60,
      compressor: true,
      threshold: -24,
      ratio: 5,
      outputGain: 2,
      normalize: true,
    }),
  },
  {
    id: "podcast",
    name: "Pregação limpa",
    description: "Sem chiado nem estouro, ideal para YouTube",
    apply: (s) => ({
      ...withBands(s, { sub: -8, low: -4, bass: 1, lowmid: -2, mid: 1, upmid: 2, himid: 3, pres: 2, sib: -2, air: 0 }),
      highpass: 90,
      compressor: true,
      threshold: -26,
      ratio: 5,
      outputGain: 2,
      normalize: true,
    }),
  },
  {
    id: "ensaio",
    name: "Ensaio cru",
    description: "Só limpeza e nivelamento suave, sem colorir",
    apply: (s) => ({
      ...withBands(s, { sub: 0, low: 1, bass: 1, lowmid: -1, mid: 0, upmid: 0, himid: 1, pres: 1, sib: 0, air: 1 }),
      highpass: 30,
      compressor: true,
      threshold: -16,
      ratio: 2,
      normalize: true,
    }),
  },
  {
    id: "bateria",
    name: "Bateria e peso",
    description: "Ataque do bumbo e brilho dos pratos",
    apply: (s) => ({
      ...withBands(s, { sub: 4, low: 5, bass: 1, lowmid: -4, mid: -2, upmid: 1, himid: 3, pres: 4, sib: 4, air: 3 }),
      highpass: 28,
      compressor: true,
      threshold: -22,
      ratio: 4,
      normalize: true,
    }),
  },
  {
    id: "acustico",
    name: "Voz e violão",
    description: "Naturalidade com corpo e brilho de cordas",
    apply: (s) => ({
      ...withBands(s, { sub: -4, low: 0, bass: 2, lowmid: -2, mid: 0, upmid: 1, himid: 2, pres: 3, sib: 3, air: 3 }),
      highpass: 55,
      compressor: true,
      threshold: -18,
      ratio: 2.5,
      normalize: true,
    }),
  },
];


type ChainCtx = BaseAudioContext;

export type Chain = {
  input: AudioNode;
  output: AudioNode;
  filters: BiquadFilterNode[];
  hp: BiquadFilterNode;
  comp: DynamicsCompressorNode;
  gain: GainNode;
  makeup: GainNode;
};

export function buildChain(ctx: ChainCtx, settings: EqSettings): Chain {
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = Math.max(1, settings.highpass);
  hp.Q.value = 0.7;

  const filters = settings.bands.map((b) => {
    const f = ctx.createBiquadFilter();
    f.type = b.kind;
    f.frequency.value = b.freq;
    f.Q.value = b.q;
    f.gain.value = b.gain;
    return f;
  });

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = settings.threshold;
  comp.ratio.value = settings.ratio;
  comp.knee.value = 12;
  comp.attack.value = 0.01;
  comp.release.value = 0.2;

  const makeup = ctx.createGain();
  makeup.gain.value = settings.compressor ? Math.pow(10, Math.abs(settings.threshold) * 0.18 / 20) : 1;

  const gain = ctx.createGain();
  gain.gain.value = Math.pow(10, settings.outputGain / 20);

  let node: AudioNode = hp;
  for (const f of filters) {
    node.connect(f);
    node = f;
  }
  if (settings.compressor) {
    node.connect(comp);
    node = comp;
    node.connect(makeup);
    node = makeup;
  }
  node.connect(gain);

  return { input: hp, output: gain, filters, hp, comp, gain, makeup };
}

export function updateChain(chain: Chain, settings: EqSettings, ctx: ChainCtx) {
  const t = ctx.currentTime;
  chain.hp.frequency.setTargetAtTime(Math.max(1, settings.highpass), t, 0.01);
  settings.bands.forEach((b, i) => {
    const f = chain.filters[i];
    if (!f) return;
    f.frequency.setTargetAtTime(b.freq, t, 0.01);
    f.Q.setTargetAtTime(b.q, t, 0.01);
    f.gain.setTargetAtTime(b.gain, t, 0.01);
  });
  chain.comp.threshold.setTargetAtTime(settings.threshold, t, 0.01);
  chain.comp.ratio.setTargetAtTime(settings.ratio, t, 0.01);
  chain.gain.gain.setTargetAtTime(Math.pow(10, settings.outputGain / 20), t, 0.01);
}

/** Curva de resposta em dB para desenho do gráfico. */
export function responseCurve(
  settings: EqSettings,
  freqs: Float32Array<ArrayBuffer>,
): Float32Array {
  const out = new Float32Array(freqs.length);
  const ctx = new OfflineAudioContext(1, 1, 48000);
  const mag = new Float32Array(freqs.length);
  const phase = new Float32Array(freqs.length);

  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = Math.max(1, settings.highpass);
  hp.Q.value = 0.7;
  hp.getFrequencyResponse(freqs, mag, phase);
  for (let i = 0; i < out.length; i++) out[i] = out[i]! + 20 * Math.log10(Math.max(mag[i]!, 1e-6));

  for (const b of settings.bands) {
    const f = ctx.createBiquadFilter();
    f.type = b.kind;
    f.frequency.value = b.freq;
    f.Q.value = b.q;
    f.gain.value = b.gain;
    f.getFrequencyResponse(freqs, mag, phase);
    for (let i = 0; i < out.length; i++) out[i] = out[i]! + 20 * Math.log10(Math.max(mag[i]!, 1e-6));
  }
  for (let i = 0; i < out.length; i++) out[i] = out[i]! + settings.outputGain;
  return out;
}

export async function renderProcessed(buffer: AudioBuffer, settings: EqSettings): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const chain = buildChain(ctx, settings);
  src.connect(chain.input);
  chain.output.connect(ctx.destination);
  src.start();
  const rendered = await ctx.startRendering();
  if (settings.normalize) normalizeBuffer(rendered, settings.targetPeak);
  return rendered;
}

export function normalizeBuffer(buffer: AudioBuffer, target: number) {
  let peak = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i++) {
      const v = Math.abs(data[i]!);
      if (v > peak) peak = v;
    }
  }
  if (peak === 0) return;
  const factor = target / peak;
  if (factor <= 1.0001 && factor >= 0.9999) return;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i++) data[i] = Math.max(-1, Math.min(1, data[i]! * factor));
  }
}

export function peakDb(buffer: AudioBuffer): number {
  let peak = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < d.length; i += 7) {
      const v = Math.abs(d[i]!);
      if (v > peak) peak = v;
    }
  }
  return 20 * Math.log10(Math.max(peak, 1e-6));
}

export function encodeWav(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const len = buffer.length;
  const bytes = 44 + len * numCh * 2;
  const ab = new ArrayBuffer(bytes);
  const view = new DataView(ab);
  const w = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  w(0, "RIFF");
  view.setUint32(4, bytes - 8, true);
  w(8, "WAVE");
  w(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * numCh * 2, true);
  view.setUint16(32, numCh * 2, true);
  view.setUint16(34, 16, true);
  w(36, "data");
  view.setUint32(40, len * numCh * 2, true);

  const chans: Float32Array[] = [];
  for (let c = 0; c < numCh; c++) chans.push(buffer.getChannelData(c));
  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, chans[c]![i]!));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      off += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}

export type ExportFormat = "wav" | "mp3";
export const MP3_BITRATES = [192, 256, 320] as const;

/** Codifica o buffer em MP3 (LAME) com o bitrate informado. */
export async function encodeMp3(buffer: AudioBuffer, bitrate = 320): Promise<Blob> {
  const { Mp3Encoder } = await import("@breezystack/lamejs");
  const numCh = Math.min(2, buffer.numberOfChannels);
  const encoder = new Mp3Encoder(numCh, buffer.sampleRate, bitrate);

  const toInt16 = (f: Float32Array) => {
    const out = new Int16Array(f.length);
    for (let i = 0; i < f.length; i++) {
      const s = Math.max(-1, Math.min(1, f[i]!));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  };

  const left = toInt16(buffer.getChannelData(0));
  const right = numCh > 1 ? toInt16(buffer.getChannelData(1)) : null;

  const chunks: Uint8Array[] = [];
  const block = 1152;
  for (let i = 0; i < left.length; i += block) {
    const l = left.subarray(i, i + block);
    const r = right ? right.subarray(i, i + block) : undefined;
    const buf = right ? encoder.encodeBuffer(l, r!) : encoder.encodeBuffer(l);
    if (buf.length > 0) chunks.push(new Uint8Array(buf));
    if (i % (block * 200) === 0) await new Promise((res) => setTimeout(res, 0));
  }
  const end = encoder.flush();
  if (end.length > 0) chunks.push(new Uint8Array(end));

  return new Blob(chunks as BlobPart[], { type: "audio/mpeg" });
}

export function formatTime(sec: number): string {
  if (!isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
