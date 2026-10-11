// Low-poly staff figure walking SHOP_LAYOUT.staffPath on a closed Catmull-Rom loop (Req 4.3).
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { CatmullRomCurve3, Vector3, type Group } from 'three';
import { SHOP_LAYOUT } from '../lib/layout.ts';
import { useMaterials } from './materials.ts';

const SPEED = 0.6;   // world units per second

export function StaffFigure({ reduced }: { reduced: boolean }) {
  const m = useMaterials();
  const ref = useRef<Group>(null);
  const curve = useMemo(
    () => new CatmullRomCurve3(SHOP_LAYOUT.staffPath.map(([x, y, z]) => new Vector3(x, y, z)), true, 'centripetal'),
    [],
  );
  const length = useMemo(() => curve.getLength(), [curve]);
  const tmp = useMemo(() => ({ p: new Vector3(), t: new Vector3() }), []);
  const dist = useRef(0);

  useFrame(({ clock }, dt) => {
    const g = ref.current;
    if (!g) return;
    if (!reduced) dist.current = (dist.current + SPEED * Math.min(dt, 0.1)) % length;
    const u = dist.current / length;
    curve.getPointAt(u, tmp.p);
    curve.getTangentAt(u, tmp.t);
    const bob = reduced ? 0 : Math.abs(Math.sin(clock.elapsedTime * 7)) * 0.04;
    g.position.set(tmp.p.x, bob, tmp.p.z);
    g.rotation.y = Math.atan2(tmp.t.x, tmp.t.z);
  });

  return (
    <group ref={ref}>
      <mesh position={[0, 0.42, 0]} material={m.woodDark}>
        <capsuleGeometry args={[0.16, 0.42, 2, 6]} />
      </mesh>
      {/* apron */}
      <mesh position={[0, 0.4, 0.15]} material={m.trim}>
        <boxGeometry args={[0.24, 0.3, 0.02]} />
      </mesh>
      <mesh position={[0, 0.92, 0]} material={m.wood}>
        <icosahedronGeometry args={[0.14, 0]} />
      </mesh>
    </group>
  );
}
