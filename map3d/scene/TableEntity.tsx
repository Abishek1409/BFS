// One table: top + legs coloured by Table_Status with an exponential blend (~600 ms, Req 5.2, 5.3),
// hover lift + tooltip (Req 14.3), click to select (Req 7.1), selection ring, pulse and marker.
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Color, MeshStandardMaterial, type Group } from 'three';
import type { TableSlot } from '../lib/layout.ts';
import { STATUS_META } from '../lib/status.ts';
import type { TableView } from '../lib/types.ts';
import { useMaterials } from './materials.ts';
import { OrderPulse } from './OrderPulse.tsx';
import { SelectionRing } from './SelectionRing.tsx';
import { StatusMarker } from './StatusMarker.tsx';
import { Tooltip } from './Tooltip.tsx';

const TOP_Y = 0.75;
const LERP_TAU = 0.12;      // seconds; 1 - e^(-0.6/0.12) ≈ 99 % at 600 ms
const HOVER_LIFT = 0.05;

interface TableEntityProps {
  slot: TableSlot;
  view: TableView;
  selected: boolean;
  pulseAt: number | null;
  reduced: boolean;
  onSelect(table: string): void;
}

export function TableEntity({ slot, view, selected, pulseAt, reduced, onSelect }: TableEntityProps) {
  const m = useMaterials();
  const [hovered, setHovered] = useState(false);
  const group = useRef<Group>(null);
  const target = useMemo(() => new Color(), []);
  const material = useMemo(
    () => new MeshStandardMaterial({ color: STATUS_META[view.status].color, flatShading: true, roughness: 0.7 }),
    [],   // created once; colour then blends toward the target each frame
  );
  useEffect(() => () => material.dispose(), [material]);

  target.set(STATUS_META[view.status].color);

  useFrame((_, dt) => {
    const k = reduced ? 1 : 1 - Math.exp(-Math.min(dt, 0.1) / LERP_TAU);
    material.color.lerp(target, k);
    const g = group.current;
    if (g) {
      const lift = hovered ? HOVER_LIFT : 0;
      g.position.y += (lift - g.position.y) * (reduced ? 1 : Math.min(1, dt * 12));
    }
  });

  // Keep the hover cursor in sync and reset it on unmount.
  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = 'pointer';
    return () => { document.body.style.cursor = ''; };
  }, [hovered]);

  const [w, d] = slot.size;
  const radius = Math.max(w, d) * 0.95;
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(slot.number);
  };

  return (
    <group position={[slot.position[0], 0, slot.position[1]]}>
      <group
        ref={group}
        onClick={onClick}
        onPointerOver={e => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <mesh position={[0, TOP_Y - 0.04, 0]} material={material}>
          <boxGeometry args={[w, 0.08, d]} />
        </mesh>
        <mesh position={[0, (TOP_Y - 0.08) / 2, 0]} material={m.woodDark}>
          <cylinderGeometry args={[0.06, 0.12, TOP_Y - 0.08, 6]} />
        </mesh>
        <mesh position={[0, 0.02, 0]} material={m.woodDark}>
          <cylinderGeometry args={[0.32, 0.36, 0.04, 6]} />
        </mesh>
      </group>
      {selected && <SelectionRing radius={radius} reduced={reduced} />}
      {pulseAt !== null && <OrderPulse key={pulseAt} at={pulseAt} radius={radius} />}
      <StatusMarker t={view} label={slot.label} height={TOP_Y + 0.9} />
      {hovered && <Tooltip t={view} label={slot.label} height={TOP_Y + 1.6} />}
    </group>
  );
}
