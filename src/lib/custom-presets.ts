import type { EqSettings } from "./audio-engine";

export type CustomPreset = {
  id: string;
  name: string;
  settings: EqSettings;
  createdAt: number;
};

const KEY = "mesa-presets-personalizados";

export function loadCustomPresets(): CustomPreset[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as CustomPreset[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveCustomPresets(list: CustomPreset[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* armazenamento cheio ou indisponível */
  }
}

export function addCustomPreset(name: string, settings: EqSettings): CustomPreset[] {
  const preset: CustomPreset = {
    id: `custom-${Date.now()}`,
    name: name.trim() || "Meu preset",
    settings: structuredClone(settings),
    createdAt: Date.now(),
  };
  const list = [...loadCustomPresets(), preset];
  saveCustomPresets(list);
  return list;
}

export function removeCustomPreset(id: string): CustomPreset[] {
  const list = loadCustomPresets().filter((p) => p.id !== id);
  saveCustomPresets(list);
  return list;
}
