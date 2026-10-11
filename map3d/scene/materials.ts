// Shared flat-shaded materials derived from the billing theme (Req 3.2, 3.4).
// Created once per scene mount and provided to all scene components via context.
import { createContext, useContext } from 'react';
import { Color, MeshBasicMaterial, MeshStandardMaterial, type Material } from 'three';
import type { SceneTheme } from '../lib/theme.ts';

export interface SceneMaterials {
  floorA: Color;               // checker tones (instance colours)
  floorB: Color;
  instanced: MeshStandardMaterial;   // white base, tinted per instance
  wall: MeshStandardMaterial;
  wood: MeshStandardMaterial;
  woodDark: MeshStandardMaterial;
  counter: MeshStandardMaterial;
  trim: MeshStandardMaterial;
  metal: MeshStandardMaterial;
  glass: MeshStandardMaterial;
  juice: MeshStandardMaterial;
  steam: MeshBasicMaterial;
  gold: MeshBasicMaterial;     // unlit gold for rings
}

const flat = (color: Color, extra: Partial<MeshStandardMaterial> = {}) =>
  Object.assign(new MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0 }), extra);

/** Build the palette from CSS theme colours: dark floor/walls tinted toward gold, gold trim. */
export function createMaterials(theme: SceneTheme): SceneMaterials {
  const bg = new Color(theme.bg);
  const accent = new Color(theme.accent);
  const gold = new Color(theme.gold);
  const text = new Color(theme.text);
  const tint = (t: number) => bg.clone().lerp(accent, t);

  return {
    floorA: tint(0.1),
    floorB: tint(0.16),
    instanced: flat(new Color('#ffffff')),
    wall: flat(tint(0.22)),
    wood: flat(accent.clone().multiplyScalar(0.55)),
    woodDark: flat(accent.clone().multiplyScalar(0.3)),
    counter: flat(tint(0.3)),
    trim: flat(gold.clone(), { emissive: gold.clone().multiplyScalar(0.25) }),
    metal: flat(text.clone().multiplyScalar(0.55), { metalness: 0.4, roughness: 0.5 }),
    glass: flat(text.clone(), { transparent: true, opacity: 0.22, depthWrite: false }),
    juice: flat(new Color('#f39c32'), { emissive: new Color('#f39c32').multiplyScalar(0.2) }),
    steam: new MeshBasicMaterial({ color: text.clone(), transparent: true, opacity: 0.35, depthWrite: false }),
    gold: new MeshBasicMaterial({ color: gold.clone(), transparent: true, depthWrite: false }),
  };
}

export function disposeMaterials(m: SceneMaterials): void {
  for (const v of Object.values(m)) if ((v as Material).isMaterial) (v as Material).dispose();
}

export const MaterialsContext = createContext<SceneMaterials | null>(null);

export function useMaterials(): SceneMaterials {
  const m = useContext(MaterialsContext);
  if (!m) throw new Error('[live-map] MaterialsContext missing');
  return m;
}
