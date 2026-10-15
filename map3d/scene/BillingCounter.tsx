// Billing counter near the entrance with a till and a small receipt printer (Req 3.1).
import { CounterBase, counterSlot } from './CounterBase.tsx';
import { useMaterials } from './materials.ts';

export function BillingCounter() {
  const m = useMaterials();
  return (
    <CounterBase slot={counterSlot('billing')}>
      {/* till screen on a stand, tilted toward the owner (behind the counter, +z) */}
      <mesh position={[-0.5, 0.12, 0]} material={m.metal}>
        <cylinderGeometry args={[0.04, 0.06, 0.24, 6]} />
      </mesh>
      <mesh position={[-0.5, 0.36, 0]} rotation={[-0.3, 0, 0]} material={m.woodDark}>
        <boxGeometry args={[0.55, 0.36, 0.04]} />
      </mesh>
      <mesh position={[-0.5, 0.36, 0.022]} rotation={[-0.3, 0, 0]} material={m.trim}>
        <boxGeometry args={[0.48, 0.29, 0.005]} />
      </mesh>
      {/* receipt printer */}
      <mesh position={[0.6, 0.09, 0.05]} material={m.metal}>
        <boxGeometry args={[0.36, 0.18, 0.3]} />
      </mesh>
      <mesh position={[0.6, 0.2, -0.05]} rotation={[0.4, 0, 0]} material={m.steam}>
        <boxGeometry args={[0.22, 0.12, 0.005]} />
      </mesh>
    </CounterBase>
  );
}
