// Wooden plank floor with a rug under the dining area (Req 3.1). Receives shadows.
import { SHOP_LAYOUT } from '../lib/layout.ts';
import { useMaterials } from './materials.ts';

const FLOOR_H = 0.1;

export function Floor() {
  const m = useMaterials();
  const { width, depth } = SHOP_LAYOUT.floor;
  return (
    <group>
      <mesh position={[0, -FLOOR_H / 2, 0]} material={m.floor} receiveShadow>
        <boxGeometry args={[width, FLOOR_H, depth]} />
      </mesh>
      {/* rug covering both table rows, with a gold border underneath */}
      <mesh position={[0, 0.004, 0.3]} rotation={[-Math.PI / 2, 0, 0]} material={m.trim} receiveShadow>
        <planeGeometry args={[11.4, 5.8]} />
      </mesh>
      <mesh position={[0, 0.008, 0.3]} rotation={[-Math.PI / 2, 0, 0]} material={m.rug} receiveShadow>
        <planeGeometry args={[11.1, 5.5]} />
      </mesh>
    </group>
  );
}
