// All chairs (4 per table) in one instanced mesh (Req 3.1, 17.2).
// The chair is a single merged low-poly geometry: seat, back and four legs.
import { Instance, Instances } from '@react-three/drei/core/Instances.js';
import { useEffect, useMemo } from 'react';
import { BoxGeometry, type BufferGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHOP_LAYOUT } from '../lib/layout.ts';
import { useMaterials } from './materials.ts';

function chairGeometry(): BufferGeometry {
  const part = (w: number, h: number, d: number, x: number, y: number, z: number) =>
    new BoxGeometry(w, h, d).translate(x, y, z);
  const parts = [
    part(0.42, 0.06, 0.42, 0, 0.45, 0),          // seat
    part(0.42, 0.42, 0.05, 0, 0.69, -0.19),      // back (away from table)
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => part(0.05, 0.45, 0.05, sx * 0.17, 0.225, sz * 0.17)),
  ];
  const merged = mergeGeometries(parts)!;
  for (const p of parts) p.dispose();
  return merged;
}

export function Chairs() {
  const m = useMaterials();
  const geometry = useMemo(chairGeometry, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const chairs = useMemo(() => SHOP_LAYOUT.tables.flatMap(t => t.chairs), []);
  const color = useMemo(() => m.woodDark.color, [m]);

  return (
    <Instances limit={chairs.length} geometry={geometry} material={m.instanced}>
      {chairs.map((c, i) => (
        // rotation faces the back away from the table: back sits at -z locally.
        <Instance key={i} position={[c.position[0], 0, c.position[1]]} rotation={[0, c.rotation, 0]} color={color} />
      ))}
    </Instances>
  );
}
