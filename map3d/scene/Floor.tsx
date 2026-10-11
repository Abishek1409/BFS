// Floor as instanced 1×1 tiles in a two-tone checker (Req 3.1, 17.2).
import { Instance, Instances } from '@react-three/drei/core/Instances.js';
import { useMemo } from 'react';
import { SHOP_LAYOUT } from '../lib/layout.ts';
import { useMaterials } from './materials.ts';

const TILE_H = 0.1;

export function Floor() {
  const m = useMaterials();
  const { width, depth } = SHOP_LAYOUT.floor;
  const tiles = useMemo(() => {
    const out: { x: number; z: number; even: boolean }[] = [];
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < depth; j++) {
        out.push({ x: -width / 2 + i + 0.5, z: -depth / 2 + j + 0.5, even: (i + j) % 2 === 0 });
      }
    }
    return out;
  }, [width, depth]);

  return (
    <Instances limit={tiles.length} material={m.instanced} receiveShadow={false}>
      <boxGeometry args={[0.98, TILE_H, 0.98]} />
      {tiles.map((t, i) => (
        <Instance key={i} position={[t.x, -TILE_H / 2, t.z]} color={t.even ? m.floorA : m.floorB} />
      ))}
    </Instances>
  );
}
