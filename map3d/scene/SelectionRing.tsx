// Glowing gold ring around the selected table, opacity pulsing 0.5–1 (Req 7.2).
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { MeshBasicMaterial } from 'three';
import { useMaterials } from './materials.ts';

export function SelectionRing({ radius, reduced }: { radius: number; reduced: boolean }) {
  const m = useMaterials();
  const material = useMemo(() => m.gold.clone(), [m]);
  const ref = useRef<MeshBasicMaterial>(material);

  useFrame(({ clock }) => {
    ref.current.opacity = reduced ? 0.9 : 0.75 + 0.25 * Math.sin(clock.elapsedTime * 4);
  });

  return (
    <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} material={material}>
      <torusGeometry args={[radius, 0.05, 16, 64]} />
    </mesh>
  );
}
