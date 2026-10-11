// Built-in shop layout. Units are world units; floor centred on origin.
// x: left(-) → right(+), z: back(-) → front/entrance(+). y is up.
import type { TableRecord } from './types.ts';

export type Vec2 = readonly [x: number, z: number];
export type Vec3 = readonly [x: number, y: number, z: number];

export interface Rect { minX: number; maxX: number; minZ: number; maxZ: number; }

export interface TableSlot {
  number: string; label: string; seats: number;
  position: Vec2;            // table centre
  size: Vec2;                // width (x) × depth (z)
  chairs: { position: Vec2; rotation: number }[];  // rotation around y, facing the table
}

export interface CounterSlot {
  id: 'billing' | 'juice' | 'snack';
  label: string;
  position: Vec2; size: Vec2; height: number;
}

export interface WallSlot { from: Vec2; to: Vec2; height: number; thickness: number; }

export interface ShopLayout {
  floor: { width: number; depth: number };
  tables: TableSlot[];
  counters: CounterSlot[];
  walls: WallSlot[];
  staffPath: Vec3[];         // closed loop
  bounds: Rect;              // floor minus 1-unit margin (camera target + minimap)
}

const FLOOR_W = 14;
const FLOOR_D = 10;
const TABLE_SIZE: Vec2 = [1.2, 1.2];
const CHAIR_GAP = 0.95;      // chair centre distance from table centre
const SEATS = [4, 4, 2, 2, 6, 6, 2, 2];
const TABLE_X = [-4.5, -1.5, 1.5, 4.5];
const TABLE_Z = [-1.2, 1.8]; // back row, front row

function chairsAround([x, z]: Vec2): TableSlot['chairs'] {
  return [
    { position: [x, z - CHAIR_GAP], rotation: 0 },
    { position: [x + CHAIR_GAP, z], rotation: -Math.PI / 2 },
    { position: [x, z + CHAIR_GAP], rotation: Math.PI },
    { position: [x - CHAIR_GAP, z], rotation: Math.PI / 2 },
  ];
}

const tables: TableSlot[] = SEATS.map((seats, i) => {
  const position: Vec2 = [TABLE_X[i % 4], TABLE_Z[Math.floor(i / 4)]];
  const number = String(i + 1);
  return { number, label: `Table ${number}`, seats, position, size: TABLE_SIZE, chairs: chairsAround(position) };
});

const hw = FLOOR_W / 2;
const hd = FLOOR_D / 2;
const WALL_H = 1.6;
const WALL_T = 0.2;

export const SHOP_LAYOUT: ShopLayout = {
  floor: { width: FLOOR_W, depth: FLOOR_D },
  tables,
  counters: [
    { id: 'billing', label: 'Billing', position: [0, 3.9], size: [3, 0.8], height: 1 },
    { id: 'juice', label: 'Juice station', position: [-4.5, -4], size: [4, 1], height: 1 },
    { id: 'snack', label: 'Snack counter', position: [4.5, -4], size: [4, 1], height: 1 },
  ],
  // Back and side walls; front left open as the entrance.
  walls: [
    { from: [-hw, -hd], to: [hw, -hd], height: WALL_H, thickness: WALL_T },
    { from: [-hw, -hd], to: [-hw, hd], height: WALL_H, thickness: WALL_T },
    { from: [hw, -hd], to: [hw, hd], height: WALL_H, thickness: WALL_T },
  ],
  staffPath: [
    [0, 0, 3.0],     // in front of billing
    [-3.0, 0, 3.0],
    [-6.0, 0, 0.3],  // between rows, left side
    [-4.5, 0, -3.0], // juice station
    [0, 0, -2.8],
    [4.5, 0, -3.0],  // snack counter
    [6.0, 0, 0.3],
    [3.0, 0, 3.0],
  ],
  bounds: { minX: -hw + 1, maxX: hw - 1, minZ: -hd + 1, maxZ: hd - 1 },
};

/** Default table records (all unoccupied), used when liveMap/tables is missing or empty. */
export function defaultTableRecords(): TableRecord[] {
  return SHOP_LAYOUT.tables.map(t => ({ number: t.number, label: t.label, seats: t.seats, occupied: false }));
}

export function findTable(number: string): TableSlot | undefined {
  return SHOP_LAYOUT.tables.find(t => t.number === number);
}
