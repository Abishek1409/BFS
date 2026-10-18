// Snack counter with a warmer pot, glass display and steam (Req 3.1, 4.1).
import { CounterBase, counterSlot } from './CounterBase.tsx';
import { useMaterials } from './materials.ts';
import { Steam } from './Steam.tsx';

const POT_X = 0.9;
const POT_H = 0.28;

export function SnackCounter({ reduced }: { reduced: boolean }) {
  const m = useMaterials();
  return (
    <CounterBase slot={counterSlot('snack')}>
      {/* glass display case with snack trays */}
      <group position={[-0.6, 0, 0]}>
        <mesh position={[0, 0.2, 0]} material={m.glass}>
          <boxGeometry args={[1.8, 0.4, 0.7]} />
        </mesh>
        {[-0.55, 0, 0.55].map(x => (
          <mesh key={x} position={[x, 0.05, 0]} material={m.wood}>
            <boxGeometry args={[0.45, 0.06, 0.45]} />
          </mesh>
        ))}
      </group>
      {/* warmer pot with lid */}
      <mesh position={[POT_X, POT_H / 2, 0]} material={m.metal}>
        <cylinderGeometry args={[0.22, 0.2, POT_H, 32]} />
      </mesh>
      <mesh position={[POT_X, POT_H + 0.02, 0]} material={m.trim}>
        <cylinderGeometry args={[0.23, 0.23, 0.04, 32]} />
      </mesh>
      <Steam position={[POT_X, POT_H + 0.08, 0]} reduced={reduced} />
    </CounterBase>
  );
}
