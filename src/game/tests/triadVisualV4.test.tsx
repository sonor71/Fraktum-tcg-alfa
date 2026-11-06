import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createTriadMatch } from "../triad/triadEngine";
import { loadCardDefinitions } from "../data/cards";
import { TriadHeroMeters } from "../../components/match/TriadHeroMeters";
import { TriadPiles } from "../../components/match/TriadPiles";
import { TriadSlot } from "../../components/match/TriadSlot";

const all = loadCardDefinitions();
const deck = all.filter((card) => !["hero", "character", "bonus", "upgrade"].includes(card.type)).slice(0, 20);
const hero = all.find((card) => card.id === "brian") ?? deck[0];
const data = { name: "Герой", deck, hero };

describe("1x1x1 V4 visual integration", () => {
  it("renders real 1x1 HP and shield meters next to portrait on every side", () => {
    const state = createTriadMatch({ a: data, b: data, c: data }, 78123);
    for (const seat of ["a", "b", "c"] as const) {
      const html = renderToStaticMarkup(<TriadHeroMeters seat={seat} player={state.players[seat]} />);
      expect(html).toContain(`data-triad-hero="${seat}"`);
      expect(html).toContain(`data-triad-portrait="${seat}"`);
      expect(html).toContain("matchStatusBar");
      expect(html).toContain("is-hp");
      expect(html).toContain("is-shield");
      expect(html).toContain(`HP ${state.players[seat].hp}/${state.players[seat].maxHp}`);
    }
  });

  it("renders both deck and discard for all three seats without exposing deck faces", () => {
    const state = createTriadMatch({ a: data, b: data, c: data }, 78123);
    for (const [seat, side] of [["a", "bottom"], ["b", "left"], ["c", "right"]] as const) {
      const html = renderToStaticMarkup(
        <TriadPiles seat={seat} side={side} player={state.players[seat]} />,
      );
      expect(html).toContain(`data-triad-piles="${seat}"`);
      expect(html).toContain('data-triad-pile="deck"');
      expect(html).toContain('data-triad-pile="discard"');
      expect(html).toContain(`data-triad-count="${state.players[seat].deck.length}"`);
      expect(html).toContain("/cards/card-back.png");
      expect(html).not.toContain('data-card-title=');
    }
  });

  it("places Will and HP in a separate strip, keeping the artwork clean", () => {
    const state = createTriadMatch({ a: data, b: data, c: data }, 78123);
    const card = state.players.a.hand.find((value) => Number(value.definition.health) > 0)
      ?? { ...state.players.a.hand[0], hp: 3,
        definition: { ...state.players.a.hand[0].definition, health: 7 } };
    const html = renderToStaticMarkup(
      <TriadSlot card={card} seat="a" lane="b" index={0} playable={false} />,
    );
    expect(html).toContain('class="triad-unit-metrics"');
    expect(html).toContain('class="is-will"');
    expect(html).toContain('class="is-hp"');
    expect(html).toContain("matchCardImage");
    expect(html).toContain('data-triad-lane="b"');
  });

  it("continues exposing all 3 directed card slots on each opponent lane", () => {
    const state = createTriadMatch({ a: data, b: data, c: data }, 78123);
    const markup = (["b", "c", "support"] as const).flatMap((lane) =>
      [0, 1, 2].map((index) => renderToStaticMarkup(
        <TriadSlot card={null} seat="a" lane={lane} index={index} playable={true} />,
      )),
    ).join("");
    expect((markup.match(/data-triad-index=/g) ?? [])).toHaveLength(9);
    expect((markup.match(/data-triad-lane=/g) ?? [])).toHaveLength(9);
    expect(state.players.a.lanes.b).toHaveLength(3);
    expect(state.players.a.lanes.c).toHaveLength(3);
    expect(state.players.a.support).toHaveLength(3);
  });
});
