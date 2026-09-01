export type PlanId = "free" | "essencial" | "banda" | "estudio";

export type Plan = {
  id: PlanId;
  name: string;
  price: number;
  tracks: number;
  highlight?: boolean;
  perks: string[];
};

export const FREE_TRACKS = 1;

export const PLANS: Plan[] = [
  {
    id: "essencial",
    name: "Essencial",
    price: 29.99,
    tracks: 7,
    perks: ["Até 7 faixas por mês", "Diagnóstico automático", "Exportação WAV e MP3 320 kbps"],
  },
  {
    id: "banda",
    name: "Banda",
    price: 34.99,
    tracks: 12,
    highlight: true,
    perks: ["Até 12 faixas por mês", "Foco por instrumento", "Modo avançado (EQ 10 bandas)"],
  },
  {
    id: "estudio",
    name: "Estúdio",
    price: 49.99,
    tracks: 30,
    perks: ["Até 30 faixas por mês", "Gravação ao vivo processada", "Presets personalizados"],
  },
];

export function planById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
