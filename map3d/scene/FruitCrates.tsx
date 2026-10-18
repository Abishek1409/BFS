// Instanced fruit crates and instanced fruit at the juice station (Req 3.1, 17.2).
import { Instance, Instances } from '@react-three/drei/core/Instances.js';
import { useMemo } from 'react';
import { Color } from 'three';
import { useMaterials } from './materials.ts';

const FRUIT_COLORS = ['#f2a530', '#e0503a', '#f5d547', '#7bc05a', '#d97a2b', '#b44a8a'].map(c => new Color(c));
const CRATE = { w: 0.42, h: 0.22, d: 0.42 };
const GAP = 0.05;

/** 6 crates in a 3×2 grid, each topped with 4 fruit. Local origin is the surface they sit on. */
export function FruitCrates({ position }: { position: [number, number, number] }) {
  const m = useMaterials();
  const crates = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    x: ((i % 3) - 1) * (CRATE.w + GAP),
    z: (Math.floor(i / 3) - 0.5) * (CRATE.d + GAP),
    color: FRUIT_COLORS[i],
  })), []);
  const fruit = useMemo(() => crates.flatMap(c =>
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => ({
      x: c.x + sx * 0.09, z: c.z + sz * 0.09, color: c.color,
    }))), [crates]);

  return (
    <group position={position}>
      <Instances limit={crates.length} material={m.instanced}>
        <boxGeometry args={[CRATE.w, CRATE.h, CRATE.d]} />
        {crates.map((c, i) => <Instance key={i} position={[c.x, CRATE.h / 2, c.z]} color={m.wood.color} />)}
      </Instances>
      <Instances limit={fruit.length} material={m.instanced}>
        <icosahedronGeometry args={[0.075, 2]} />
        {fruit.map((f, i) => <Instance key={i} position={[f.x, CRATE.h + 0.04, f.z]} color={f.color} />)}
      </Instances>
    </group>
  );
}
