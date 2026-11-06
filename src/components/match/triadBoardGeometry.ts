/**
 * Reference geometry for the three-sided FRAKTUM arena.
 * Every position is expressed in a shared 1600x900 coordinate system.
 * The arena's CSS scales this entire system uniformly, instead of
 * positioning independent rectangular player panels.
 */
export type TriadViewSide = "left" | "right" | "bottom";
export type TriadViewGroup = 0 | 1 | 2;
export type TriadPoint = Readonly<{ x: number; y: number; angle: number }>;

const p = (x: number, y: number, angle = 0): TriadPoint => ({ x, y, angle });
const mirror = (points: readonly TriadPoint[]): TriadPoint[] =>
  points.map(({ x, y, angle }) => p(1600 - x, y, -angle));

// Upper-left player's bottom-pointing cards, outward-pointing cards, and straight cards.
const upperLeft = [
  [p(575, 456, -22), p(642, 438, -22), p(709, 420, -22)],
  [p(662, 255, 24), p(632, 320, 24), p(569, 375, 24)],
  [p(724, 197), p(724, 270), p(724, 343)],
] as const;

// The local player is below the battle, with two outward diagonals and a straight row.
const lower = [
  [p(603, 538, -20), p(668, 518, -20), p(733, 498, -20)],
  [p(867, 498, 20), p(932, 518, 20), p(997, 538, 20)],
  [p(710, 624), p(800, 624), p(890, 624)],
] as const;

export const TRIAD_SLOT_GEOMETRY: Readonly<Record<TriadViewSide,
  readonly (readonly TriadPoint[])[]>> = {
  left: upperLeft,
  right: upperLeft.map((group) => mirror(group)),
  bottom: lower,
};

/** Group 0/1 target the two rivals. Group 2 is the forward/support lane. */
export function triadSlotPoint(side: TriadViewSide, group: TriadViewGroup, slot: number) {
  const point = TRIAD_SLOT_GEOMETRY[side][group][slot];
  if (!point) throw new RangeError("Unknown triad slot: " + side + "/" + group + "/" + slot);
  return point;
}

/** Seven backs rest tangentially to the sloping arena boundary. */
export function triadHandPoint(side: "left" | "right", slot: number, count: number): TriadPoint {
  const index = Math.max(0, slot);
  const span = Math.min(7, Math.max(1, count));
  // Equal center-to-center spacing; the long side of each back tracks the border.
  const y = 89 + index * (282 / Math.max(1, span - 1));
  const borderX = 355 - (y - 24) * (333 / 369);
  return side === "left" ? p(borderX + 28, y, 42) : p(1600 - borderX - 28, y, -42);
}

export const TRIAD_OUTER_PATH =
  "M 355 24 H 1245 L 1570 393 L 1140 884 H 480 L 22 393 Z";
export const TRIAD_INNER_PATH =
  "M 610 160 H 990 L 1120 472 L 965 650 H 635 L 480 472 Z";
export const TRIAD_INNER_DIVIDERS =
  "M 800 160 V 344 M 480 472 L 800 344 L 1120 472 M 800 344 V 650";
