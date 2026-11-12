// Shared PBR materials for the Live Map scene (Req 3.2).
// Created once per scene mount and provided to all scene components via context.
// Wood and floor use small procedural canvas textures, so nothing is downloaded.
import { createContext, useContext } from 'react';
import {
  CanvasTexture, Color, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial,
  RepeatWrapping, SRGBColorSpace, type Material, type Texture,
} from 'three';
import type { SceneTheme } from '../lib/theme.ts';

export interface SceneMaterials {
  instanced: MeshStandardMaterial;   // white base, tinted per instance
  floor: MeshStandardMaterial;
  rug: MeshStandardMaterial;
  wall: MeshStandardMaterial;
  baseboard: MeshStandardMaterial;
  wood: MeshStandardMaterial;
  woodDark: MeshStandardMaterial;
  counter: MeshStandardMaterial;
  stone: MeshStandardMaterial;       // counter tops
  trim: MeshStandardMaterial;
  metal: MeshStandardMaterial;
  glass: MeshPhysicalMaterial;
  juice: MeshStandardMaterial;
  leaf: MeshStandardMaterial;
  pot: MeshStandardMaterial;
  screen: MeshStandardMaterial;
  bulb: MeshBasicMaterial;
  steam: MeshBasicMaterial;
  gold: MeshBasicMaterial;           // unlit gold for rings
  textures: Texture[];
}

const std = (color: string | Color, extra: Partial<MeshStandardMaterial> = {}) =>
  Object.assign(new MeshStandardMaterial({ color, roughness: 0.6, metalness: 0 }), extra);

/** Warm oak planks with grain lines and per-plank tone variation. */
function plankTexture(): CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  if (!g) return null;
  const rows = 8;
  const h = c.height / rows;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let r = 0; r < rows; r++) {
    let x = -rnd() * 256;
    while (x < c.width) {
      const len = 180 + rnd() * 160;
      const l = 38 + rnd() * 10;
      g.fillStyle = `hsl(${28 + rnd() * 6}, ${42 + rnd() * 10}%, ${l}%)`;
      g.fillRect(x, r * h, len, h);
      g.strokeStyle = 'rgba(40, 22, 10, 0.18)';
      g.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const y = r * h + 4 + rnd() * (h - 8);
        g.beginPath();
        g.moveTo(x, y);
        g.bezierCurveTo(x + len * 0.3, y + rnd() * 4 - 2, x + len * 0.7, y + rnd() * 4 - 2, x + len, y);
        g.stroke();
      }
      g.fillStyle = 'rgba(20, 10, 4, 0.55)';
      g.fillRect(x, r * h, 2, h);       // plank end joint
      x += len;
    }
    g.fillStyle = 'rgba(20, 10, 4, 0.6)';
    g.fillRect(0, r * h, c.width, 2);   // plank side joint
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

export function createMaterials(theme: SceneTheme): SceneMaterials {
  const gold = new Color(theme.gold);
  const planks = plankTexture();
  if (planks) planks.repeat.set(3.5, 2.5);
  const textures = planks ? [planks] : [];

  return {
    instanced: std('#ffffff', { roughness: 0.55 }),
    floor: std(planks ? '#ffffff' : '#8a5a36', { map: planks, roughness: 0.55 }),
    rug: std('#3b2f4a', { roughness: 0.95 }),
    wall: std('#efe3cf', { roughness: 0.9 }),
    baseboard: std('#5a3a24', { roughness: 0.6 }),
    wood: std('#a8693c', { roughness: 0.45 }),
    woodDark: std('#4a2e1c', { roughness: 0.5 }),
    counter: std('#2f4f4a', { roughness: 0.55 }),
    stone: std('#e9e4dc', { roughness: 0.25, metalness: 0.05 }),
    trim: std(gold, { metalness: 0.85, roughness: 0.3 }),
    metal: std('#b9bec4', { metalness: 0.9, roughness: 0.28 }),
    glass: new MeshPhysicalMaterial({
      color: '#ffffff', metalness: 0, roughness: 0.05, transmission: 0, transparent: true,
      opacity: 0.25, clearcoat: 1, depthWrite: false,
    }),
    juice: std('#ff9a1f', { emissive: new Color('#ff7a00'), emissiveIntensity: 0.25, roughness: 0.2 }),
    leaf: std('#3f8f4f', { roughness: 0.7 }),
    pot: std('#c8673f', { roughness: 0.8 }),
    screen: std('#1d2a3a', { emissive: new Color('#4fc3ff'), emissiveIntensity: 0.6, roughness: 0.2 }),
    bulb: new MeshBasicMaterial({ color: new Color('#ffd9a0').multiplyScalar(1.6), toneMapped: false }),
    steam: new MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false }),
    gold: new MeshBasicMaterial({ color: gold.clone(), transparent: true, depthWrite: false, toneMapped: false }),
    textures,
  };
}

export function disposeMaterials(m: SceneMaterials): void {
  for (const v of Object.values(m)) if ((v as Material).isMaterial) (v as Material).dispose();
  for (const t of m.textures) t.dispose();
}

export const MaterialsContext = createContext<SceneMaterials | null>(null);

export function useMaterials(): SceneMaterials {
  const m = useContext(MaterialsContext);
  if (!m) throw new Error('[live-map] MaterialsContext missing');
  return m;
}
