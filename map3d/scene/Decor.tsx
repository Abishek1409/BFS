// Ambience: pendant lamps over tables, potted plants, a menu board, entrance mat and a soft
// ground halo that fades the shop into the backdrop. No external assets.
import { useEffect, useMemo } from 'react';
import { CanvasTexture, MeshBasicMaterial, SRGBColorSpace } from 'three';
import { SHOP_LAYOUT } from '../lib/layout.ts';
import { useMaterials } from './materials.ts';

const LAMP_Y = 2.6;

function PendantLamp({ x, z }: { x: number; z: number }) {
  const m = useMaterials();
  return (
    <group position={[x, LAMP_Y, z]}>
      <mesh position={[0, 0.6, 0]} material={m.woodDark}>
        <cylinderGeometry args={[0.006, 0.006, 1.2, 6]} />
      </mesh>
      <mesh material={m.trim} castShadow>
        <coneGeometry args={[0.22, 0.2, 32, 1, true]} />
      </mesh>
      <mesh position={[0, -0.06, 0]} material={m.bulb}>
        <sphereGeometry args={[0.07, 16, 12]} />
      </mesh>
    </group>
  );
}

function Plant({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  const m = useMaterials();
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.2, 0]} material={m.pot} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.4, 24]} />
      </mesh>
      {[[0, 0.62, 0, 0.26], [0.12, 0.8, 0.05, 0.2], [-0.1, 0.78, -0.06, 0.19], [0.02, 0.98, -0.02, 0.15]].map(([px, py, pz, r], i) => (
        <mesh key={i} position={[px, py, pz]} material={m.leaf} castShadow>
          <icosahedronGeometry args={[r, 1]} />
        </mesh>
      ))}
    </group>
  );
}

function MenuBoard() {
  const m = useMaterials();
  const z = -SHOP_LAYOUT.floor.depth / 2 + 0.12;
  return (
    <group position={[0, 1.05, z]}>
      <mesh material={m.woodDark} castShadow>
        <boxGeometry args={[2.2, 0.8, 0.04]} />
      </mesh>
      <mesh position={[0, 0, 0.022]} material={m.screen}>
        <planeGeometry args={[2.05, 0.66]} />
      </mesh>
    </group>
  );
}

/** Radial halo texture: warm centre fading to transparent at the edge. */
function useHalo(): MeshBasicMaterial {
  const mat = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(128, 128, 20, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255, 196, 120, 0.35)');
    grad.addColorStop(0.5, 'rgba(120, 70, 40, 0.18)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const map = new CanvasTexture(c);
    map.colorSpace = SRGBColorSpace;
    return new MeshBasicMaterial({ map, transparent: true, depthWrite: false });
  }, []);
  useEffect(() => () => { mat.map?.dispose(); mat.dispose(); }, [mat]);
  return mat;
}

export function Decor() {
  const m = useMaterials();
  const halo = useHalo();
  const hw = SHOP_LAYOUT.floor.width / 2;
  const hd = SHOP_LAYOUT.floor.depth / 2;
  return (
    <group>
      <mesh position={[0, -0.11, 0]} rotation={[-Math.PI / 2, 0, 0]} material={halo}>
        <planeGeometry args={[34, 34]} />
      </mesh>
      {SHOP_LAYOUT.tables.map(t => <PendantLamp key={t.number} x={t.position[0]} z={t.position[1]} />)}
      <Plant x={-hw + 0.45} z={-hd + 0.45} s={1.2} />
      <Plant x={hw - 0.45} z={-hd + 0.45} s={1.2} />
      <Plant x={-hw + 0.45} z={hd - 0.5} />
      <Plant x={hw - 0.45} z={hd - 0.5} />
      <MenuBoard />
      {/* entrance mat */}
      <mesh position={[0, 0.006, hd - 0.25]} rotation={[-Math.PI / 2, 0, 0]} material={m.baseboard} receiveShadow>
        <planeGeometry args={[2.4, 0.4]} />
      </mesh>
    </group>
  );
}
