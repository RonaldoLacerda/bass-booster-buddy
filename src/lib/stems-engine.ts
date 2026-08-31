import type { EqSettings } from "./audio-engine";
import { buildChain, normalizeBuffer } from "./audio-engine";

export type OutputMode = "stereo" | "mono" | "left" | "right";

/** Faixa pseudo-separada: uma ou mais janelas de frequência + extração de centro/laterais. */
export type StemSource = "full" | "mid" | "side";

export type StemRange = { lo: number; hi: number };

export type StemDef = {
  id: string;
  name: string;
  hint: string;
  ranges: StemRange[];
  source: StemSource;
};

export type StemSettings = {
  id: string;
  volume: number; // dB
  mute: boolean;
  solo: boolean;
  pan: number; // -1..1
  output: OutputMode;
  eqLow: number; // dB @ 120 Hz
  eqMid: number; // dB @ 1 kHz
  eqHigh: number; // dB @ 6 kHz
  compressor: boolean;
  threshold: number; // dB
  ratio: number;
};

export const STEM_DEFS: StemDef[] = [
  {
    id: "bateria",
    name: "Bateria",
    hint: "Bumbo + pratos e caixa (transientes)",
    ranges: [
      { lo: 35, hi: 110 },
      { lo: 2200, hi: 15000 },
    ],
    source: "full",
  },
  {
    id: "baixo",
    name: "Baixo",
    hint: "Fundamental do contrabaixo (centro)",
    ranges: [{ lo: 30, hi: 230 }],
    source: "mid",
  },
  {
    id: "teclado",
    name: "Teclado / Piano",
    hint: "Harmonia nos médios-graves",
    ranges: [{ lo: 200, hi: 1100 }],
    source: "full",
  },
  {
    id: "guitarra",
    name: "Guitarra",
    hint: "Médios-agudos, geralmente nas laterais",
    ranges: [{ lo: 900, hi: 5500 }],
    source: "side",
  },
  {
    id: "voz",
    name: "Voz",
    hint: "Vocal e pregação no centro da imagem",
    ranges: [{ lo: 170, hi: 6500 }],
    source: "mid",
  },
  {
    id: "outros",
    name: "Outros",
    hint: "Ambiência, brilho e resto da mixagem",
    ranges: [{ lo: 5000, hi: 18000 }],
    source: "full",
  },
];

export const defaultStemSettings = (id: string): StemSettings => ({
  id,
  volume: 0,
  mute: false,
  solo: false,
  pan: 0,
  output: "stereo",
  eqLow: 0,
  eqMid: 0,
  eqHigh: 0,
  compressor: false,
  threshold: -20,
  ratio: 3,
});

export const DEFAULT_STEMS: StemSettings[] = STEM_DEFS.map((d) => defaultStemSettings(d.id));

export type StemNodes = {
  id: string;
  eq: BiquadFilterNode[];
  comp: DynamicsCompressorNode;
  compIn: GainNode;
  compBypass: GainNode;
  panner: StereoPannerNode;
  stereoPath: GainNode;
  monoPath: GainNode;
  volume: GainNode;
};

export type StemGraph = {
  output: GainNode;
  nodes: Record<string, StemNodes>;
};

type Ctx = BaseAudioContext;

function midSide(ctx: Ctx, input: AudioNode, mode: StemSource): AudioNode {
  if (mode === "full") return input;
  const splitter = ctx.createChannelSplitter(2);
  const merger = ctx.createChannelMerger(2);
  input.connect(splitter);
  const l = ctx.createGain();
  const r = ctx.createGain();
  l.gain.value = 0.5;
  r.gain.value = mode === "mid" ? 0.5 : -0.5;
  splitter.connect(l, 0);
  splitter.connect(r, 1);
  const sum = ctx.createGain();
  l.connect(sum);
  r.connect(sum);
  sum.connect(merger, 0, 0);
  sum.connect(merger, 0, 1);
  return merger;
}

function bandPath(ctx: Ctx, input: AudioNode, range: StemRange): AudioNode {
  const hp1 = ctx.createBiquadFilter();
  hp1.type = "highpass";
  hp1.frequency.value = range.lo;
  hp1.Q.value = 0.7;
  const hp2 = ctx.createBiquadFilter();
  hp2.type = "highpass";
  hp2.frequency.value = range.lo;
  hp2.Q.value = 0.7;
  const lp1 = ctx.createBiquadFilter();
  lp1.type = "lowpass";
  lp1.frequency.value = range.hi;
  lp1.Q.value = 0.7;
  const lp2 = ctx.createBiquadFilter();
  lp2.type = "lowpass";
  lp2.frequency.value = range.hi;
  lp2.Q.value = 0.7;
  input.connect(hp1);
  hp1.connect(hp2);
  hp2.connect(lp1);
  lp1.connect(lp2);
  return lp2;
}

function monoNode(ctx: Ctx): GainNode {
  const g = ctx.createGain();
  g.channelCount = 1;
  g.channelCountMode = "explicit";
  g.channelInterpretation = "speakers";
  return g;
}

function buildStem(ctx: Ctx, input: AudioNode, def: StemDef, s: StemSettings): StemNodes {
  const src = midSide(ctx, input, def.source);
  const bus = ctx.createGain();
  for (const range of def.ranges) bandPath(ctx, src, range).connect(bus);

  const low = ctx.createBiquadFilter();
  low.type = "lowshelf";
  low.frequency.value = 120;
  low.gain.value = s.eqLow;
  const mid = ctx.createBiquadFilter();
  mid.type = "peaking";
  mid.frequency.value = 1000;
  mid.Q.value = 1;
  mid.gain.value = s.eqMid;
  const high = ctx.createBiquadFilter();
  high.type = "highshelf";
  high.frequency.value = 6000;
  high.gain.value = s.eqHigh;

  bus.connect(low);
  low.connect(mid);
  mid.connect(high);

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = s.threshold;
  comp.ratio.value = s.ratio;
  comp.knee.value = 12;
  comp.attack.value = 0.005;
  comp.release.value = 0.18;
  const compIn = ctx.createGain();
  const compBypass = ctx.createGain();
  compIn.gain.value = s.compressor ? 1 : 0;
  compBypass.gain.value = s.compressor ? 0 : 1;

  const postComp = ctx.createGain();
  high.connect(compIn);
  compIn.connect(comp);
  comp.connect(postComp);
  high.connect(compBypass);
  compBypass.connect(postComp);

  const stereoPath = ctx.createGain();
  const monoPath = monoNode(ctx);
  const preFold = ctx.createGain();
  postComp.connect(stereoPath);
  postComp.connect(monoPath);
  stereoPath.connect(preFold);
  monoPath.connect(preFold);

  const panner = ctx.createStereoPanner();
  const volume = ctx.createGain();
  preFold.connect(panner);
  panner.connect(volume);

  const nodes: StemNodes = {
    id: s.id,
    eq: [low, mid, high],
    comp,
    compIn,
    compBypass,
    panner,
    stereoPath,
    monoPath,
    volume,
  };
  applyStem(nodes, s, ctx, false);
  return nodes;
}

/** Aplica volume/pan/mute/solo/EQ/compressor a uma faixa já construída. */
export function applyStem(
  nodes: StemNodes,
  s: StemSettings,
  ctx: Ctx,
  anySolo: boolean,
  smooth = true,
) {
  const t = ctx.currentTime;
  const set = (p: AudioParam, v: number) =>
    smooth ? p.setTargetAtTime(v, t, 0.02) : void (p.value = v);

  const audible = !s.mute && (!anySolo || s.solo);
  set(nodes.volume.gain, audible ? Math.pow(10, s.volume / 20) : 0);

  const pan = s.output === "left" ? -1 : s.output === "right" ? 1 : s.pan;
  set(nodes.panner.pan, Math.max(-1, Math.min(1, pan)));

  const folded = s.output !== "stereo";
  set(nodes.stereoPath.gain, folded ? 0 : 1);
  set(nodes.monoPath.gain, folded ? 1 : 0);

  set(nodes.eq[0]!.gain, s.eqLow);
  set(nodes.eq[1]!.gain, s.eqMid);
  set(nodes.eq[2]!.gain, s.eqHigh);

  set(nodes.comp.threshold, s.threshold);
  set(nodes.comp.ratio, s.ratio);
  set(nodes.compIn.gain, s.compressor ? 1 : 0);
  set(nodes.compBypass.gain, s.compressor ? 0 : 1);
}

export function buildStemGraph(ctx: Ctx, input: AudioNode, stems: StemSettings[]): StemGraph {
  const output = ctx.createGain();
  const nodes: Record<string, StemNodes> = {};
  const anySolo = stems.some((s) => s.solo);
  for (const def of STEM_DEFS) {
    const s = stems.find((x) => x.id === def.id) ?? defaultStemSettings(def.id);
    const built = buildStem(ctx, input, def, s);
    applyStem(built, s, ctx, anySolo, false);
    built.volume.connect(output);
    nodes[def.id] = built;
  }
  return { output, nodes };
}

export function updateStemGraph(graph: StemGraph, stems: StemSettings[], ctx: Ctx) {
  const anySolo = stems.some((s) => s.solo);
  for (const s of stems) {
    const n = graph.nodes[s.id];
    if (n) applyStem(n, s, ctx, anySolo);
  }
}

/** Renderiza o mix final: faixas separadas → mixer → cadeia master. */
export async function renderMix(
  buffer: AudioBuffer,
  master: EqSettings,
  stems: StemSettings[],
  useStems: boolean,
): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, buffer.length, buffer.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const masterChain = buildChain(ctx, master);
  if (useStems) {
    const graph = buildStemGraph(ctx, src, stems);
    graph.output.connect(masterChain.input);
  } else {
    src.connect(masterChain.input);
  }
  masterChain.output.connect(ctx.destination);
  src.start();
  const rendered = await ctx.startRendering();
  if (master.normalize) normalizeBuffer(rendered, master.targetPeak);
  return rendered;
}
