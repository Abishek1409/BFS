// Map_Scene entry, loaded through React.lazy as its own chunk.
// Full-viewport Canvas (Req 3.3) with DPR capped at 1.5 (Req 17.1), PBR materials with an
// environment map, soft shadows and ACES tone mapping, camera rig, frame governor and contents.
// The canvas is transparent so the CSS gradient backdrop on .lm-stage shows through.
import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, type RefObject } from 'react';
import { ACESFilmicToneMapping } from 'three';
import { useLiveStore } from '../hooks/useLiveStore.ts';
import { useReducedMotion } from '../hooks/useReducedMotion.ts';
import { useTabVisible } from '../hooks/useTabVisible.ts';
import { SHOP_LAYOUT } from '../lib/layout.ts';
import type { LiveStore } from '../lib/store.ts';
import { readTheme } from '../lib/theme.ts';
import type { LiveSnapshot, ViewMode } from '../lib/types.ts';
import { BillingCounter } from './BillingCounter.tsx';
import { CameraRig, START_POSITION } from './CameraRig.tsx';
import { Chairs } from './Chairs.tsx';
import { Decor } from './Decor.tsx';
import { Floor } from './Floor.tsx';
import { FrameGovernor } from './FrameGovernor.tsx';
import { JuiceStation } from './JuiceStation.tsx';
import { Lighting } from './Lighting.tsx';
import { createMaterials, disposeMaterials, MaterialsContext } from './materials.ts';
import { SnackCounter } from './SnackCounter.tsx';
import { StaffFigure } from './StaffFigure.tsx';
import { TableEntity } from './TableEntity.tsx';
import { Walls } from './Walls.tsx';

export interface ShopSceneProps {
  store: LiveStore;
  view: ViewMode;
  /** CameraRig assigns its animated reset here for the BottomBar reset button. */
  resetRef: RefObject<(() => void) | null>;
}

const selTables = (s: LiveSnapshot) => s.tables;
const selSelected = (s: LiveSnapshot) => s.selected;
const selPulses = (s: LiveSnapshot) => s.pulses;
const selPreparing = (s: LiveSnapshot) => s.orders.some(o => o.stage === 'preparing');

function ShopContents({ store, reduced }: { store: LiveStore; reduced: boolean }) {
  const tables = useLiveStore(store, selTables);
  const selected = useLiveStore(store, selSelected);
  const pulses = useLiveStore(store, selPulses);
  const preparing = useLiveStore(store, selPreparing);
  const byNumber = useMemo(() => new Map(tables.map(t => [t.number, t])), [tables]);
  const pulseAt = (n: string) => {
    let at: number | null = null;
    for (const p of pulses) if (p.table === n && (at === null || p.at > at)) at = p.at;
    return at;
  };
  const onSelect = (n: string) => store.select(store.getSnapshot().selected === n ? null : n);

  return (
    <>
      <Floor />
      <Walls />
      <Decor />
      <Chairs />
      <BillingCounter />
      <JuiceStation pouring={preparing} reduced={reduced} />
      <SnackCounter reduced={reduced} />
      <StaffFigure reduced={reduced} />
      {SHOP_LAYOUT.tables.map(slot => {
        const view = byNumber.get(slot.number);
        if (!view) return null;
        return (
          <TableEntity key={slot.number} slot={slot} view={view} selected={selected === slot.number}
            pulseAt={pulseAt(slot.number)} reduced={reduced} onSelect={onSelect} />
        );
      })}
    </>
  );
}

export default function ShopScene({ store, view, resetRef }: ShopSceneProps) {
  const theme = useMemo(() => readTheme(), []);
  const materials = useMemo(() => createMaterials(theme), [theme]);
  useEffect(() => () => disposeMaterials(materials), [materials]);
  const visible = useTabVisible();
  const reduced = useReducedMotion();

  return (
    <Canvas
      dpr={[1, 1.5]}
      shadows="soft"
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ fov: 35, position: [...START_POSITION], near: 0.1, far: 100 }}
      aria-label="3D map of the shop"
    >
      <fog attach="fog" args={['#140d0a', 24, 46]} />
      <Lighting />
      <FrameGovernor view={view} visible={visible} />
      <CameraRig view={view} reduced={reduced} resetRef={resetRef} />
      <MaterialsContext.Provider value={materials}>
        <ShopContents store={store} reduced={reduced} />
      </MaterialsContext.Provider>
    </Canvas>
  );
}
