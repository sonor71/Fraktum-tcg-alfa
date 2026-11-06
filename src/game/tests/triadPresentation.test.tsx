import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { CardDefinition } from "../core/types";
import type { TriadCard } from "../triad/triadEngine";
import { TriadSlot, triadToMatchCard } from "../../components/match/TriadSlot";

const definition: CardDefinition = {
  id: "visual_test", title: "Card", type: "attack", rarity: "common",
  cost: 1, attack: 2, health: 6, description: "", image: "/cards/card-back.png",
  effectKey: "",
};
function card(statuses: string[] = []): TriadCard {
  return { instanceId: "a_1_0_visual_test", definition,
    hp: 3, armor: 1, statuses, playedTurn: 0 };
}
describe("1×1×1 presentation integration", () => {
  it("uses exactly the original match CardInstance representation", () => {
    const adapted = triadToMatchCard(card(["alpha_frozen"]), "player");
    expect(adapted.baseId).toBe(definition.id);
    expect(adapted.currentHealth).toBe(3);
    expect(adapted.currentArmor).toBe(1);
    expect(adapted.statuses).toEqual(["alpha_frozen"]);
    expect(adapted.currentAttack).toBe(2);
  });
  it("uses 1×1 BoardSlot rendering, card HP and freeze visuals for enemy lanes", () => {
    const html = renderToStaticMarkup(<TriadSlot card={card(["alpha_frozen"])} seat="b"
      lane="a" index={1} playable={false} />);
    expect(html).toContain('data-triad-seat="b"');
    expect(html).toContain('data-triad-lane="a"');
    expect(html).toContain('data-triad-index="1"');
    expect(html).toContain("matchBoardSlot");
    expect(html).toContain("has-status-alpha_frozen");
    expect(html).toContain("matchFreezeCrystal");
    expect(html).toContain("3/6 HP");
  });
  it("preserves clickable slot semantics for keyboard and mouse", () => {
    const html = renderToStaticMarkup(<TriadSlot card={null} seat="a" lane="c"
      index={2} playable={true} onActivate={() => undefined} />);
    expect(html).toContain('role="button"');
    expect(html).toContain('data-slot-state="open"');
    expect(html).toContain('data-drop-slot="2"');
    expect(html).toContain("is-targetable");
  });
  it("keeps opponent slots unavailable to the local player", () => {
    const html = renderToStaticMarkup(<TriadSlot card={null} seat="c" lane="a"
      index={0} playable={false} />);
    expect(html).toContain('data-slot-state="locked"');
    expect(html).not.toContain('data-drop-slot="0"');
  });
});
