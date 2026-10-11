// Rising steam: instanced puffs that rise, grow and fade on staggered loops (Req 4.1).
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Object3D, type InstancedMesh } from 'three';
import { useMaterials } from './materials.ts';

const PUFFS = 6;
const RISE = 0.9;        // world units per cycle
const CYCLE_S = 2.4;

export function Steam({ position, reduced }: { position: [number, number, number]; reduced: boolean }) {
  const m = useMaterials();
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  // Per-puff material opacity is not available on instances, so fade by shrinking at the top.
  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const time = reduced ? 0 : clock.elapsedTime;
    for (let i = 0; i < PUFFS; i++) {
      const t = ((time / CYCLE_S) + i / PUFFS) % 1;
      const grow = Math.sin(t * Math.PI);          // 0 → 1 → 0
      dummy.position.set(Math.sin((t + i) * 5) * 0.06, t * RISE, Math.cos((t + i) * 4) * 0.05);
      dummy.scale.setScalar(0.04 + grow * 0.09);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, PUFFS]} position={position} material={m.steam} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
    </instancedMesh>
  );
}
