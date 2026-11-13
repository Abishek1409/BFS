// Staff figure walking SHOP_LAYOUT.staffPath on a closed Catmull-Rom loop (Req 4.3).
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { CatmullRomCurve3, MeshStandardMaterial, Vector3, type Group } from 'three';
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
  const skin = useMemo(() => new MeshStandardMaterial({ color: '#d9a07a', roughness: 0.7 }), []);
  const shirt = useMemo(() => new MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.8 }), []);
  useEffect(() => () => { skin.dispose(); shirt.dispose(); }, [skin, shirt]);

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
      <mesh position={[0, 0.44, 0]} material={shirt} castShadow>
        <capsuleGeometry args={[0.16, 0.42, 8, 20]} />
      </mesh>
      {/* apron */}
      <mesh position={[0, 0.4, 0.155]} material={m.counter}>
        <boxGeometry args={[0.24, 0.34, 0.02]} />
      </mesh>
      <mesh position={[0, 0.95, 0]} material={skin} castShadow>
        <sphereGeometry args={[0.13, 24, 18]} />
      </mesh>
      {/* cap */}
      <mesh position={[0, 1.04, 0]} material={m.counter}>
        <sphereGeometry args={[0.135, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    </group>
  );
}
