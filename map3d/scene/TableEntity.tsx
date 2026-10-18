// One table: wooden round-cornered top with a status-coloured inlay and floor glow, blended
// over ~600 ms (Req 5.2, 5.3), hover lift + tooltip (Req 14.3), click to select (Req 7.1),
// selection ring, pulse and marker.
import { RoundedBox } from '@react-three/drei/core/RoundedBox.js';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Color, MeshBasicMaterial, MeshStandardMaterial, type Group } from 'three';
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
  // Created once; colours then blend toward the target each frame.
  const inlay = useMemo(() => {
    const c = new Color(STATUS_META[view.status].color);
    return new MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.35, roughness: 0.35 });
  }, []);
  const glow = useMemo(() => new MeshBasicMaterial({
    color: STATUS_META[view.status].color, transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false,
  }), []);
  useEffect(() => () => { inlay.dispose(); glow.dispose(); }, [inlay, glow]);

  target.set(STATUS_META[view.status].color);
  const active = view.status !== 'free';

  useFrame(({ clock }, dt) => {
    const k = reduced ? 1 : 1 - Math.exp(-Math.min(dt, 0.1) / LERP_TAU);
    inlay.color.lerp(target, k);
    inlay.emissive.copy(inlay.color);
    glow.color.lerp(target, k);
    const breathe = active && !reduced ? 0.1 * Math.sin(clock.elapsedTime * 2.5) : 0;
    glow.opacity += ((active ? 0.45 : 0.12) + breathe - glow.opacity) * k;
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
      {/* soft status glow on the floor */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} material={glow}>
        <circleGeometry args={[radius * 0.95, 48]} />
      </mesh>
      <group
        ref={group}
        onClick={onClick}
        onPointerOver={e => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <RoundedBox args={[w, 0.07, d]} radius={0.03} smoothness={3} position={[0, TOP_Y - 0.035, 0]}
          material={m.wood} castShadow receiveShadow />
        <mesh position={[0, TOP_Y + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} material={inlay}>
          <planeGeometry args={[w * 0.72, d * 0.72]} />
        </mesh>
        {/* pedestal: column and base */}
        <mesh position={[0, (TOP_Y - 0.07) / 2 + 0.04, 0]} material={m.woodDark} castShadow>
          <cylinderGeometry args={[0.05, 0.08, TOP_Y - 0.11, 20]} />
        </mesh>
        <mesh position={[0, 0.025, 0]} material={m.metal} castShadow receiveShadow>
          <cylinderGeometry args={[0.3, 0.34, 0.05, 32]} />
        </mesh>
        {/* centrepiece: small vase with a flower */}
        <mesh position={[0, TOP_Y + 0.06, 0]} material={m.glass}>
          <cylinderGeometry args={[0.035, 0.045, 0.12, 16]} />
        </mesh>
        <mesh position={[0, TOP_Y + 0.15, 0]} material={m.leaf}>
          <sphereGeometry args={[0.045, 12, 10]} />
        </mesh>
      </group>
      {selected && <SelectionRing radius={radius} reduced={reduced} />}
      {pulseAt !== null && <OrderPulse key={pulseAt} at={pulseAt} radius={radius} />}
      <StatusMarker t={view} label={slot.label} height={TOP_Y + 0.9} />
      {hovered && <Tooltip t={view} label={slot.label} height={TOP_Y + 1.6} />}
    </group>
  );
}
