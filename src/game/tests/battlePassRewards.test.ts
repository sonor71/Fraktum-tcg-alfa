import { afterEach, describe, expect, it, vi } from "vitest";
import { PACKS } from "../../data/packs";
import {
  BATTLE_PASS_MAX_LEVEL, BATTLE_PASS_REWARDS, BATTLE_PASS_XP_STEP,
  rollBattlePassChestReward, useGameStore,
} from "../../useGameStore";

describe("FRAKTUM PASS: 30 real rewards, shop packs and chest drops", () => {
  afterEach(() => { vi.restoreAllMocks(); useGameStore.getState().resetProgress(); });

  it("extends the season to 30 levels while preserving the original first ten rewards", () => {
    expect(BATTLE_PASS_MAX_LEVEL).toBe(30);
    expect(BATTLE_PASS_XP_STEP).toBe(100);
    expect(Object.keys(BATTLE_PASS_REWARDS)).toHaveLength(30);
    expect(BATTLE_PASS_REWARDS[1]).toEqual({ kind: "coins", amount: 100 });
    expect(BATTLE_PASS_REWARDS[4]).toEqual({ kind: "card", rarity: "rare" });
    expect(BATTLE_PASS_REWARDS[10]).toEqual({ kind: "card", rarity: "mythic" });
    for (let level = 1; level <= 30; level++) expect(BATTLE_PASS_REWARDS[level]).toBeDefined();
    for (const reward of Object.values(BATTLE_PASS_REWARDS)) {
      if (reward.kind === "pack") expect(PACKS.some(pack => pack.id === reward.packId)).toBe(true);
    }
  });

  it("awards real unopened shop packs without deducting currency and prevents double claims", () => {
    useGameStore.setState({ battlePassXp: 1000, coins: 500, free: 500,
      pendingPackPurchases: {}, claimedBattlePassRewards: [] });
    const store = useGameStore.getState();
    expect(store.claimBattlePassReward(11)).toBe(true);
    const after = useGameStore.getState();
    expect(after.coins).toBe(500);
    expect(after.claimedBattlePassRewards).toContain(11);
    const pending = Object.entries(after.pendingPackPurchases);
    expect(pending).toHaveLength(1);
    expect(pending[0][0]).toMatch(/^pass-/);
    expect(pending[0][1].packId).toBe("normal");
    expect(store.claimBattlePassReward(11)).toBe(false);
    expect(Object.keys(useGameStore.getState().pendingPackPurchases)).toHaveLength(1);
    expect(store.claimBattlePassReward(12)).toBe(false);
  });

  it("rolls a chest into real currency and saves its exact result", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    useGameStore.setState({ battlePassXp: 1100, coins: 300, free: 300,
      claimedBattlePassRewards: [], battlePassChestDrops: {} });
    expect(useGameStore.getState().claimBattlePassReward(12)).toBe(true);
    expect(useGameStore.getState().coins).toBe(450);
    expect(useGameStore.getState().battlePassChestDrops[12]).toEqual({ kind: "coins", amount: 150 });
    expect(useGameStore.getState().claimBattlePassReward(12)).toBe(false);
    expect(useGameStore.getState().coins).toBe(450);
  });

  it("can grant a card directly from the chest to owned inventory", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    useGameStore.setState({ battlePassXp: 1100, ownedCards: [], cardSerials: {},
      claimedBattlePassRewards: [], battlePassChestDrops: {} });
    expect(useGameStore.getState().claimBattlePassReward(12)).toBe(true);
    const after = useGameStore.getState();
    expect(after.ownedCards).toHaveLength(1);
    expect(after.ownedCards[0].rarity).toBe("epic");
    expect(after.battlePassChestDrops[12].kind).toBe("card");
  });

  it("stores collected music discs, avoids duplicates and gives coins for a full collection", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    useGameStore.setState({ battlePassXp: 1600, ownedMusicDiscs: [],
      claimedBattlePassRewards: [], battlePassChestDrops: {} });
    expect(useGameStore.getState().claimBattlePassReward(12)).toBe(true);
    expect(useGameStore.getState().ownedMusicDiscs).toEqual([10]);
    expect(useGameStore.getState().claimBattlePassReward(17)).toBe(true);
    expect(useGameStore.getState().ownedMusicDiscs).toEqual([9, 10]);
    expect(rollBattlePassChestReward(Array.from({ length: 10 }, (_, i) => i + 1), () => 0.9))
      .toEqual({ kind: "coins", amount: 250 });
  });
});
