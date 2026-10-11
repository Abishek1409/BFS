// Back and side walls from SHOP_LAYOUT with a gold top trim (Req 3.1).
import { SHOP_LAYOUT } from '../lib/layout.ts';
import { useMaterials } from './materials.ts';

export function Walls() {
  const m = useMaterials();
  return (
    <group>
      {SHOP_LAYOUT.walls.map((w, i) => {
        const [x1, z1] = w.from;
        const [x2, z2] = w.to;
        const len = Math.hypot(x2 - x1, z2 - z1) + w.thickness;
        const rot = -Math.atan2(z2 - z1, x2 - x1);
        const cx = (x1 + x2) / 2;
        const cz = (z1 + z2) / 2;
        return (
          <group key={i} position={[cx, 0, cz]} rotation={[0, rot, 0]}>
            <mesh position={[0, w.height / 2, 0]} material={m.wall}>
              <boxGeometry args={[len, w.height, w.thickness]} />
            </mesh>
            <mesh position={[0, w.height + 0.03, 0]} material={m.trim}>
              <boxGeometry args={[len, 0.06, w.thickness + 0.04]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
