import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TacticalRevealLayer, type TacticalRevealEvent } from "../../components/match/TacticalRevealLayer";
import { createInitialMatchState } from "../engine/MatchEngine";
import { resolveCardEffects } from "../engine/EffectResolver";
import { resolveFieldCombat } from "../engine/DamageSystem";
import { loadCardDefinitions } from "../data/cards";
import type { CardInstance, MatchState, PlayerId } from "../core/types";

const definitions = new Map(loadCardDefinitions().map(card => [card.id, card]));
function instance(id: string, ownerId: PlayerId, suffix = id): CardInstance {
  const definition = definitions.get(id);
  if (!definition) throw new Error("Missing card " + id);
  return {
    instanceId: ownerId + "_" + suffix,
    baseId: id,
    definition,
    currentHealth: definition.health,
    currentAttack: definition.attack,
    ownerId,
  };
}
function fixture(): MatchState {
  const initial = createInitialMatchState({ seed: 20, startingPlayerId: "player" });
  return {
    ...initial,
    activePlayerId: "player",
    phase: "main",
    player: { ...initial.player, effects: [], shield: 0, will: 3, hand: [], discard: [], deck: [] },
    enemy: { ...initial.enemy, effects: [], shield: 0, hand: [], discard: [] },
    board: { playerSlots: [null, null, null, null, null], enemySlots: [null, null, null, null, null] },
  };
}
function cast(state: MatchState, id: string, owner: PlayerId = "player", index = 0): MatchState {
  return resolveCardEffects(state, owner, instance(id, owner), undefined, index);
}
function directHit(owner: PlayerId, target: PlayerId, amount: number) {
  const source = instance("omega", owner, "virtual_hit");
  return {
    ...source,
    baseId: "test_direct_hero_hit",
    currentAttack: 0,
    definition: {
      ...source.definition,
      id: "test_direct_hero_hit",
      attack: 0,
      effectKey: "",
      effects: [{ op: "damageHero", target: target === owner ? "selfHero" as const : "enemyHero" as const, value: amount }],
    },
  };
}

describe("match visual-effect gameplay regressions", () => {
  it("Dragon Eye and Oracle create a choice of enemy HAND cards, not random auto-reveal", () => {
    for (const source of ["dragon_eye", "oracle"]) {
      const base = fixture();
      const hand = [instance("omega", "enemy", "a"), instance("oreon", "enemy", "b"), instance("revolver", "enemy", "c")];
      const state: MatchState = { ...base, enemy: { ...base.enemy, hand } };
      const next = cast(state, source);
      const event = (next as MatchState & { tacticalRevealEvents?: TacticalRevealEvent[] }).tacticalRevealEvents?.at(-1);
      expect(event?.kind).toBe("oracle-pick");
      expect(event?.cards).toHaveLength(3);
      expect(event?.cards.map(card => card.baseId)).toEqual(["omega", "oreon", "revolver"]);
      expect(next.enemy.hand).toEqual(hand);
      expect(next.log.join(" ")).not.toContain("Revolver");
      const html = renderToStaticMarkup(<TacticalRevealLayer events={[event!]} />);
      expect(html).toContain("/cards/card-back.png");
      expect(html).toContain("Открыть закрытую карту 3");
      expect(html).not.toContain("Revolver");
      expect(html).not.toContain("Oreon");
    }
  });

  it("Wood Vines freeze only the card opposite and cannot skip a whole enemy turn", () => {
    const state = fixture();
    const target = { ...instance("revolver", "enemy", "target"), currentAttack: 4, currentHealth: 3 };
    const withEnemy: MatchState = {
      ...state,
      board: { ...state.board, enemySlots: [null, null, target, null, null] },
    };
    const frozen = cast(withEnemy, "wood_vines", "player", 2);
    expect(frozen.board.enemySlots[2]?.statuses).toContain("alpha_frozen");
    expect(frozen.enemy.effects.some(effect => effect.id === "skip_next_turn")).toBe(false);
    const duringCombat: MatchState = { ...frozen, activePlayerId: "enemy", enemy: { ...frozen.enemy, personalTurnsTaken: 2 } };
    const resolved = resolveFieldCombat(duringCombat, "enemy");
    expect(resolved.player.hp).toBe(duringCombat.player.hp);
    expect(resolved.board.enemySlots[2]?.statuses?.includes("alpha_frozen")).toBe(false);
    const secondCombat = resolveFieldCombat(resolved, "enemy");
    expect(secondCombat.player.hp).toBe(resolved.player.hp - 4);
  });

  it("Messenger is impactful but does not overflow the seven-card hand", () => {
    const state = fixture();
    const before: MatchState = {
      ...state, player: {
        ...state.player,
        will: 0,
        hand: Array.from({ length: 6 }, (_, i) => instance("oreon", "player", "h" + i)),
        deck: [instance("omega", "player", "draw1"), instance("oreon", "player", "draw2")],
      },
    };
    const next = cast(before, "legendary_messenger");
    expect(next.player.hand).toHaveLength(7);
    expect(next.player.deck).toHaveLength(1);
    expect(next.player.will).toBe(2);
    expect(next.player.effects.find(effect => effect.id === "next_card_power")?.value ?? (next.player.effects.find(effect => effect.id === "next_card_power") as unknown as {amount?:number})?.amount).toBe(3);
  });

  it("Sage Amulet recovers up to two cards from discard, grants shields and a conditional Will", () => {
    const state = fixture();
    const before: MatchState = {
      ...state, player: { ...state.player, discard: [instance("omega", "player", "a"), instance("oreon", "player", "b")] },
    };
    const next = cast(before, "amulet_of_old_sage");
    expect(next.player.discard).toHaveLength(0);
    expect(next.player.hand.map(card => card.baseId)).toEqual(["oreon", "omega"]);
    expect(next.player.shield).toBe(2);
    expect(next.player.will).toBe(4);
    const empty = cast(state, "amulet_of_old_sage");
    expect(empty.player.shield).toBe(1);
  });

  it("Titan Eye prevents the first three hero damage of a turn while alive and does not stack", () => {
    const eye = instance("titan_eye", "player", "eye");
    const state = fixture();
    const guarded: MatchState = { ...state, board: { ...state.board, playerSlots: [eye, null, null, null, null] } };
    const hit = directHit("enemy", "player", 5);
    const first = resolveCardEffects(guarded, "enemy", hit);
    expect(first.player.hp).toBe(guarded.player.hp - 2);
    const second = resolveCardEffects(first, "enemy", hit);
    expect(second.player.hp).toBe(first.player.hp - 5);
    const destroyed: MatchState = { ...guarded, board: { ...guarded.board, playerSlots: [{ ...eye, currentHealth: 0 }, null, null, null, null] } };
    const unguarded = resolveCardEffects(destroyed, "enemy", hit);
    expect(unguarded.player.hp).toBe(destroyed.player.hp - 5);
    const shield = cast({ ...state, board: guarded.board }, "titan_eye");
    expect(shield.player.shield).toBe(2);
  });
});
