import { describe, expect, it } from "vitest";
import {
  TRIAD_SLOT_GEOMETRY, TRIAD_OUTER_PATH, TRIAD_INNER_PATH,
  triadSlotPoint, triadHandPoint,
} from "../../components/match/triadBoardGeometry";

describe("1x1x1 reference geometry", () => {
  it("always renders 27 slots: three directed groups of three per player", () => {
    for (const side of ["left", "right", "bottom"] as const) {
      expect(TRIAD_SLOT_GEOMETRY[side]).toHaveLength(3);
      for (const group of TRIAD_SLOT_GEOMETRY[side]) expect(group).toHaveLength(3);
    }
  });

  it("mirrors both opponents without changing the meaning of their lanes", () => {
    for (const group of [0, 1, 2] as const) {
      for (let slot = 0; slot < 3; slot++) {
        const l = triadSlotPoint("left", group, slot);
        const r = triadSlotPoint("right", group, slot);
        expect(l.x + r.x).toBe(1600);
        expect(l.y).toBe(r.y);
        expect(l.angle).toBe(-r.angle);
      }
    }
  });

  it("keeps every slot in the central combat board and clear of the dice center", () => {
    const slots = Object.values(TRIAD_SLOT_GEOMETRY).flatMap((groups) => groups.flat());
    expect(slots).toHaveLength(27);
    expect(new Set(slots.map((p) => p.x + ":" + p.y))).toHaveSize(27);
    for (const p of slots) {
      expect(p.x).toBeGreaterThan(500);
      expect(p.x).toBeLessThan(1100);
      expect(p.y).toBeGreaterThan(150);
      expect(p.y).toBeLessThan(660);
      expect(Math.hypot(p.x - 800, p.y - 389)).toBeGreaterThan(80);
    }
  });

  it("aligns opponent hands tangentially to the left and right arena borders", () => {
    for (let i = 0; i < 7; i++) {
      const left = triadHandPoint("left", i, 7);
      const right = triadHandPoint("right", i, 7);
      expect(left.x + right.x).toBe(1600);
      expect(left.y).toBe(right.y);
      expect(left.angle).toBe(42);
      expect(right.angle).toBe(-42);
      if (i > 0) expect(left.y).toBeGreaterThan(triadHandPoint("left", i - 1, 7).y);
    }
    // Fewer than seven cards should stay clustered, not stretch along the whole side.
    expect(triadHandPoint("left", 0, 1).y).toBeGreaterThan(triadHandPoint("left", 0, 7).y);
    expect(triadHandPoint("left", 0, 1).y).toBeLessThan(triadHandPoint("left", 6, 7).y);
  });

  it("uses the outlined reference table rather than three rectangular panels", () => {
    expect(TRIAD_OUTER_PATH).toContain("355 24 H 1245");
    expect(TRIAD_INNER_PATH).toContain("1120 472");
  });
});
