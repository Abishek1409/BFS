// Back and side walls from SHOP_LAYOUT with baseboard, gold top trim and wall lamps (Req 3.1).
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
        const lamps = Math.max(1, Math.floor(len / 3.5));
        return (
          <group key={i} position={[cx, 0, cz]} rotation={[0, rot, 0]}>
            <mesh position={[0, w.height / 2, 0]} material={m.wall} castShadow receiveShadow>
              <boxGeometry args={[len, w.height, w.thickness]} />
            </mesh>
            <mesh position={[0, 0.09, 0]} material={m.baseboard}>
              <boxGeometry args={[len, 0.18, w.thickness + 0.04]} />
            </mesh>
            <mesh position={[0, w.height + 0.03, 0]} material={m.trim}>
              <boxGeometry args={[len, 0.06, w.thickness + 0.06]} />
            </mesh>
            {/* sconces on both faces so they show whichever side faces the room */}
            {Array.from({ length: lamps }, (_, k) => {
              const x = -len / 2 + (len / lamps) * (k + 0.5);
              return (
                <group key={k} position={[x, w.height * 0.72, 0]}>
                  {[-1, 1].map(s => (
                    <group key={s} position={[0, 0, s * (w.thickness / 2 + 0.05)]}>
                      <mesh material={m.trim}>
                        <boxGeometry args={[0.16, 0.05, 0.1]} />
                      </mesh>
                      <mesh position={[0, 0.08, 0]} material={m.bulb}>
                        <sphereGeometry args={[0.07, 16, 12]} />
                      </mesh>
                    </group>
                  ))}
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}
