// Juice station: counter, fruit crates, juicer and a glass with the pour animation (Req 3.1, 4.2).
import { CounterBase, counterSlot } from './CounterBase.tsx';
import { FruitCrates } from './FruitCrates.tsx';
import { JuicePour } from './JuicePour.tsx';
import { useMaterials } from './materials.ts';

/** Juicer spout tip in counter-local space (y = 0 is the counter top). */
const JUICER_X = 0.6;
const SPOUT_Y = 0.42;
const GLASS_H = 0.22;

export function JuiceStation({ pouring, reduced }: { pouring: boolean; reduced: boolean }) {
  const m = useMaterials();
  return (
    <CounterBase slot={counterSlot('juice')}>
      <FruitCrates position={[-0.95, 0, 0]} />
      {/* juicer: base, body, jar and spout */}
      <group position={[JUICER_X, 0, -0.15]}>
        <mesh position={[0, 0.06, 0]} material={m.metal}>
          <boxGeometry args={[0.4, 0.12, 0.4]} />
        </mesh>
        <mesh position={[0, 0.32, -0.06]} material={m.woodDark}>
          <cylinderGeometry args={[0.13, 0.16, 0.4, 8]} />
        </mesh>
        <mesh position={[0, 0.6, -0.06]} material={m.glass}>
          <cylinderGeometry args={[0.15, 0.12, 0.2, 8]} />
        </mesh>
        <mesh position={[0, SPOUT_Y, 0.12]} rotation={[Math.PI / 2, 0, 0]} material={m.trim}>
          <cylinderGeometry args={[0.025, 0.025, 0.16, 6]} />
        </mesh>
      </group>
      {/* glass under the spout */}
      <group position={[JUICER_X, 0, 0.05]}>
        <mesh position={[0, GLASS_H / 2, 0]} material={m.glass}>
          <cylinderGeometry args={[0.07, 0.055, GLASS_H, 8, 1, true]} />
        </mesh>
        {pouring && <JuicePour top={SPOUT_Y} bottom={0.02} glassH={GLASS_H} reduced={reduced} />}
      </group>
    </CounterBase>
  );
}
