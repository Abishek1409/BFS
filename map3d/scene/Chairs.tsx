// All chairs (4 per table) in one instanced mesh (Req 3.1, 17.2).
// One merged geometry: rounded cushion seat, slatted back and tapered legs.
import { Instance, Instances } from '@react-three/drei/core/Instances.js';
import { useEffect, useMemo } from 'react';
import { BoxGeometry, CylinderGeometry, type BufferGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SHOP_LAYOUT } from '../lib/layout.ts';
import { useMaterials } from './materials.ts';

function chairGeometry(): BufferGeometry {
  const box = (w: number, h: number, d: number, x: number, y: number, z: number) =>
    new BoxGeometry(w, h, d).translate(x, y, z);
  const leg = (x: number, z: number) => new CylinderGeometry(0.022, 0.016, 0.45, 10).translate(x, 0.225, z);
  const parts: BufferGeometry[] = [
    new CylinderGeometry(0.22, 0.22, 0.06, 24).scale(1, 1, 0.95).translate(0, 0.46, 0),   // seat
    box(0.03, 0.42, 0.03, -0.18, 0.69, -0.19),
    box(0.03, 0.42, 0.03, 0.18, 0.69, -0.19),
    box(0.4, 0.07, 0.03, 0, 0.86, -0.19),                                                  // top rail
    ...[-0.09, 0, 0.09].map(x => box(0.04, 0.26, 0.02, x, 0.66, -0.19)),                     // slats
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => leg(sx * 0.16, sz * 0.16)),
  ];
  // mergeGeometries needs matching attributes: all are indexed with position/normal/uv.
  const merged = mergeGeometries(parts)!;
  for (const p of parts) p.dispose();
  return merged;
}

export function Chairs() {
  const m = useMaterials();
  const geometry = useMemo(chairGeometry, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const chairs = useMemo(() => SHOP_LAYOUT.tables.flatMap(t => t.chairs), []);
  const color = useMemo(() => m.wood.color.clone().multiplyScalar(0.8), [m]);

  return (
    <Instances limit={chairs.length} geometry={geometry} material={m.instanced} castShadow receiveShadow>
      {chairs.map((c, i) => (
        // rotation faces the back away from the table: back sits at -z locally.
        <Instance key={i} position={[c.position[0], 0, c.position[1]]} rotation={[0, c.rotation, 0]} color={color} />
      ))}
    </Instances>
  );
}
