import type { CardDefinition, CardInstance, MatchState, PlayerState } from "../core/types";
import { resolveCardEffects } from "../engine/EffectResolver";
import { getD20PlayLimit, getD20Rule } from "../engine/Rules";
import { rollDie, shuffleWithSeed } from "../engine/Random";
import { getWillCostByRarity } from "../rarityWillCost";

export type TriadSeat = "a" | "b" | "c";
export type TriadLane = TriadSeat | "support";
export type TriadPhase = "roll" | "main" | "between" | "ended";
export const TRIAD_SEATS: TriadSeat[] = ["a", "b", "c"];
export const TRIAD_VICTORIES_TO_WIN = 3;
export const TRIAD_LANE_SLOTS = 3;
export type TriadCard = { instanceId: string; definition: CardDefinition; hp: number; armor: number; statuses: string[]; playedTurn: number };
export type TriadLoadout = { name: string; deck: CardDefinition[]; hero?: CardDefinition; bonusCards?: CardDefinition[]; maxWill?: number; regen?: number };
export type TriadPlayer = {
  name: string; hero: CardDefinition; hp: number; maxHp: number; shield: number;
  will: number; maxWill: number; regen: number; turnsTaken: number;
  deck: TriadCard[]; hand: TriadCard[]; discard: TriadCard[];
  lanes: Record<TriadSeat, Array<TriadCard | null>>; support: Array<TriadCard | null>;
  effects: PlayerState["effects"]; eliminated: boolean; victories: number;
};
export type TriadState = {
  id: string; seed: number; rngSeed: number; round: number; battle: number;
  phase: TriadPhase; active: TriadSeat; players: Record<TriadSeat, TriadPlayer>;
  roll: number | null; playLimit: number | "unlimited"; played: number; costMultiplier: number;
  freeCard: boolean; discardPlay: boolean; rouletteEvent: string | null;
  awakeningPending: boolean; borrowedCard: { seat: TriadSeat; cardId: string } | null;
  rouletteUsed: boolean;
  log: string[]; battleWinner: TriadSeat | "draw" | null; winner: TriadSeat | null;
};
export type TriadAction =
  | { type: "ROLL"; seat: TriadSeat }
  | { type: "CHOOSE_AWAKENING"; seat: TriadSeat; choice: "freeCard" | "passive" }
  | { type: "PLAY"; seat: TriadSeat; cardId: string; lane: TriadLane; slot: number; targetSeat?: TriadSeat; targetSlot?: number }
  | { type: "END"; seat: TriadSeat }
  | { type: "NEXT"; seat: TriadSeat }
  | { type: "CONCEDE"; seat: TriadSeat };

const empty = () => Array<TriadCard | null>(TRIAD_LANE_SLOTS).fill(null);
export const triadRivals = (seat: TriadSeat) => TRIAD_SEATS.filter((s) => s !== seat);
const aliveRivals = (state: TriadState, seat: TriadSeat) =>
  triadRivals(seat).filter((s) => !state.players[s].eliminated);
const record = (state: TriadState, message: string): TriadState =>
  ({ ...state, log: [...state.log, message].slice(-80) });
const price = (card: TriadCard) => getWillCostByRarity(card.definition.rarity);
const lightningIds = new Set(["thunderbolts", "thunderer", "spherical_lightning", "Stun_Gun", "energy_sword", "felix", "ten_thousand_volts"]);
function isLightning(card: TriadCard) {
  return card.definition.element === "lightning" || lightningIds.has(card.definition.id);
}
export function triadEffectiveCost(state: TriadState, seat: TriadSeat, card: TriadCard) {
  if (state.freeCard || state.rouletteEvent === "WORLD_WITHOUT_WILL") return 0;
  const discount = isLightning(card) && state.players[seat].effects.some((effect) => effect.id === "alpha_next_lightning_discount") ? 1 : 0;
  return Math.max(0, price(card) * state.costMultiplier - discount);
}

function makeCard(seat: TriadSeat, definition: CardDefinition, index: number, battle: number): TriadCard {
  return { instanceId: seat + "_" + battle + "_" + index + "_" + definition.id, definition,
    hp: Math.max(0, Number(definition.health) || 0), armor: Math.max(0, Number(definition.armor) || 0),
    statuses: [], playedTurn: -1 };
}

function createSide(seat: TriadSeat, loadout: TriadLoadout, battle: number, seed: number, victories: number) {
  if (loadout.deck.length !== 20 || new Set(loadout.deck.map((c) => c.id)).size !== 20) {
    throw new Error("Для матча 1×1×1 необходимо ровно 20 уникальных карт в каждой колоде.");
  }
  const hero = loadout.hero ?? loadout.deck[0];
  const shuffled = shuffleWithSeed(loadout.deck.map((card, i) => makeCard(seat, card, i, battle)), seed);
  const hp = Math.max(1, Number(hero.health) || 30);
  const maxWill = Math.max(1, Math.min(20, Math.floor(loadout.maxWill || 5)));
  const side: TriadPlayer = {
    name: loadout.name, hero, hp, maxHp: hp, shield: 0, will: maxWill,
    maxWill, regen: Math.max(1, Math.floor(loadout.regen || 2)), turnsTaken: 0,
    deck: shuffled.items.slice(7), hand: shuffled.items.slice(0, 7), discard: [],
    lanes: { a: empty(), b: empty(), c: empty() }, support: empty(), effects: [],
    eliminated: false, victories,
  };
  return side;
}

export function createTriadMatch(loadouts: Record<TriadSeat, TriadLoadout>, seed = 12345, battle = 1,
  scores: Record<TriadSeat, number> = { a: 0, b: 0, c: 0 }): TriadState {
  const normalizedSeed = (Math.floor(seed) >>> 0) || 12345;
  const a = rollDie(normalizedSeed ^ (battle * 313), 2147483647);
  const b = rollDie(a.seed, 2147483647);
  const c = rollDie(b.seed, 2147483647);
  return {
    id: "triad-" + normalizedSeed, seed: normalizedSeed, rngSeed: c.seed,
    round: 1, battle, phase: "roll", active: "a", roll: null, playLimit: 0,
    played: 0, costMultiplier: 1, freeCard: false, discardPlay: false, rouletteEvent: null,
    awakeningPending: false, borrowedCard: null, rouletteUsed: false,
    players: {
      a: createSide("a", loadouts.a, battle, a.value, scores.a),
      b: createSide("b", loadouts.b, battle, b.value, scores.b),
      c: createSide("c", loadouts.c, battle, c.value, scores.c),
    },
    log: ["Бой " + battle + ". Ходит " + loadouts.a.name + "."], battleWinner: null, winner: null,
  };
}
export function triadCanPlay(state: TriadState, seat: TriadSeat, card: TriadCard, lane: TriadLane, slot: number) {
  if (state.phase !== "main" || state.active !== seat || state.players[seat].eliminated) return false;
  if (!Number.isInteger(slot) || slot < 0 || slot >= TRIAD_LANE_SLOTS) return false;
  if (state.playLimit !== "unlimited" && state.played >= state.playLimit) return false;
  if (state.awakeningPending) return false;
  if ((lane === "support") !== triadIsSupport(card)) return false;
  if (lane !== "support" && (lane === seat || state.players[lane].eliminated)) return false;
  if ((lane === "support" ? state.players[seat].support : state.players[seat].lanes[lane])[slot]) return false;
  const fromHand = state.players[seat].hand.some((c) => c.instanceId === card.instanceId);
  const fromDiscard = state.discardPlay && state.players[seat].discard.some((c) => c.instanceId === card.instanceId);
  const fromBlind = state.rouletteEvent === "BLIND_TOP" && state.players[seat].deck[0]?.instanceId === card.instanceId;
  const fromBorrowed = state.borrowedCard?.cardId === card.instanceId &&
    state.players[state.borrowedCard.seat].deck.some((c) => c.instanceId === card.instanceId);
  if (state.rouletteEvent === "BLIND_TOP" && !fromBlind) return false;
  if (!fromHand && !fromDiscard && !fromBlind && !fromBorrowed) return false;
  return state.players[seat].will >= triadEffectiveCost(state, seat, card);
}

const asDuelCard = (card: TriadCard, id: "player" | "enemy"): CardInstance => ({
  instanceId: card.instanceId, baseId: card.definition.id, definition: card.definition, ownerId: id,
  controllerId: id, currentAttack: Number(card.definition.attack) || 0,
  currentHealth: card.hp, currentArmor: card.armor, statuses: card.statuses,
  playedRound: card.playedTurn, temporaryUntilRoundEnd: card.definition.health <= 0,
});
const fromDuelCard = (card: CardInstance): TriadCard => ({
  instanceId: card.instanceId, definition: card.definition,
  hp: Number(card.currentHealth ?? card.definition.health) || 0,
  armor: Number(card.currentArmor ?? 0) || 0, statuses: card.statuses ?? [],
  playedTurn: Number(card.playedRound ?? -1),
});
function duelSide(side: TriadPlayer, id: "player" | "enemy"): PlayerState {
  return {
    id, hero: asDuelCard(makeCard(id === "player" ? "a" : "b", side.hero, 999, 0), id),
    hp: side.hp, maxHp: side.maxHp, shield: side.shield, will: side.will,
    maxWill: side.maxWill, willRegenPerRound: side.regen, personalTurnsTaken: side.turnsTaken,
    deck: side.deck.map((card) => asDuelCard(card, id)),
    hand: side.hand.map((card) => asDuelCard(card, id)),
    discard: side.discard.map((card) => asDuelCard(card, id)),
    bonusCards: [], effects: side.effects, lastTurnLostHp: 0,
  };
}
function applyDuelSide(side: TriadPlayer, duel: PlayerState): TriadPlayer {
  return {
    ...side, hp: duel.hp, shield: duel.shield, will: duel.will,
    deck: duel.deck.map(fromDuelCard), hand: duel.hand.map(fromDuelCard),
    discard: duel.discard.map(fromDuelCard), effects: duel.effects,
  };
}
const fromDuelSlots = (cards: Array<CardInstance | null>) => cards.map((card) => card ? fromDuelCard(card) : null);

// Executes the existing FRAKTUM card-effect resolver against the selected rival.
// The projection maps the acting player's indicated lane to playerSlots, and the
// rival's lane facing the actor to enemySlots. Unrelated third-player zones stay intact.
function resolveAgainst(state: TriadState, actor: TriadSeat, rival: TriadSeat, card: TriadCard,
  lane: TriadLane, slot: number, applyOwner = true): TriadState {
  const p = state.players[actor];
  const e = state.players[rival];
  const ownSlots = lane === "support" ? p.support : p.lanes[rival];
  const duel: MatchState = {
    id: state.id, phase: "main", turn: state.round, activePlayerId: "player",
    player: duelSide(p, "player"), enemy: duelSide(e, "enemy"),
    board: { playerSlots: ownSlots.map((c) => c ? asDuelCard(c, "player") : null),
      enemySlots: e.lanes[actor].map((c) => c ? asDuelCard(c, "enemy") : null) },
    stack: [], log: [], rngSeed: state.rngSeed, battleNumber: state.battle,
    currentTurn: { playerId: "player", d20Limit: state.playLimit, playsUsed: state.played,
      cardsPlayed: state.played, destroyedOwnCard: false, freeCards: state.freeCard,
      skipDamageApplied: false, timerSeconds: 60, playedCosts: [] },
    seriesScore: { player: 0, enemy: 0 },
  };
  const resolved = resolveCardEffects(duel, "player", asDuelCard(card, "player"), undefined, slot);
  const ownerSide = applyOwner ? applyDuelSide(p, resolved.player) : p;
  const rivalSide = applyDuelSide(e, resolved.enemy);
  const ownField = fromDuelSlots(resolved.board.playerSlots);
  const enemyField = fromDuelSlots(resolved.board.enemySlots);
  const updatedOwner = lane === "support"
    ? { ...ownerSide, support: ownField }
    : { ...ownerSide, lanes: { ...ownerSide.lanes, [rival]: ownField } };
  const updatedRival = { ...rivalSide, lanes: { ...rivalSide.lanes, [actor]: enemyField } };
  return {
    ...state, rngSeed: resolved.rngSeed,
    players: { ...state.players, [actor]: updatedOwner, [rival]: updatedRival },
    log: [...state.log, ...resolved.log].slice(-80),
  };
}

function damageHero(side: TriadPlayer, raw: number): TriadPlayer {
  const amount = Math.max(0, Math.floor(raw));
  const blocked = Math.min(amount, side.shield);
  return { ...side, shield: side.shield - blocked, hp: Math.max(0, side.hp - amount + blocked) };
}
function hitUnit(card: TriadCard, amount: number) {
  const absorbed = Math.min(card.armor, amount);
  const remaining = Math.max(0, amount - absorbed);
  return {
    card: { ...card, armor: card.armor - absorbed, hp: Math.max(0, card.hp - remaining) },
    overflow: Math.max(0, remaining - card.hp),
  };
}
function attackPower(card: TriadCard | null, turns: number) {
  if (!card || card.hp <= 0 || card.definition.canAttack === false || card.statuses.includes("alpha_frozen")) return 0;
  if (card.playedTurn >= turns) return 0;
  return Math.max(0, Math.floor(card.definition.attack || 0));
}
function attackLanes(state: TriadState, actor: TriadSeat): TriadState {
  let next = state;
  // The current player engages EACH surviving rival in their own forward lane.
  // Both cards in an opposed pair attack simultaneously, matching 1x1 combat.
  for (const rival of aliveRivals(next, actor)) {
    const source = next.players[actor];
    const opponent = next.players[rival];
    const attackSlots = [...source.lanes[rival]];
    const defendSlots = [...opponent.lanes[actor]];
    let sourceHeroDamage = 0;
    let rivalHeroDamage = 0;
    const sourceDiscard: TriadCard[] = [];
    const rivalDiscard: TriadCard[] = [];
    for (let i = 0; i < TRIAD_LANE_SLOTS; i += 1) {
      const attacking = attackSlots[i];
      const defending = defendSlots[i];
      const attack = attackPower(attacking, source.turnsTaken);
      const counter = attackPower(defending, opponent.turnsTaken);
      if (attack > 0) {
        if (defending) {
          const outcome = hitUnit(defending, attack);
          defendSlots[i] = outcome.card;
          rivalHeroDamage += outcome.overflow;
        } else rivalHeroDamage += attack;
      }
      if (counter > 0) {
        if (attacking) {
          const outcome = hitUnit(attacking, counter);
          attackSlots[i] = outcome.card;
          sourceHeroDamage += outcome.overflow;
        } else sourceHeroDamage += counter;
      }
    }
    const finalAttack = attackSlots.map((card) => {
      if (!card) return null;
      if (card.hp <= 0) { sourceDiscard.push(card); return null; }
      return { ...card, statuses: card.statuses.filter((status) => status !== "alpha_frozen") };
    });
    const finalDefend = defendSlots.map((card) => {
      if (!card) return null;
      if (card.hp <= 0) { rivalDiscard.push(card); return null; }
      return card;
    });
    const updatedSource = damageHero({
      ...source, lanes: { ...source.lanes, [rival]: finalAttack },
      discard: [...source.discard, ...sourceDiscard],
    }, sourceHeroDamage);
    const updatedOpponent = damageHero({
      ...opponent, lanes: { ...opponent.lanes, [actor]: finalDefend },
      discard: [...opponent.discard, ...rivalDiscard],
    }, rivalHeroDamage);
    next = { ...next, players: { ...next.players, [actor]: updatedSource, [rival]: updatedOpponent } };
  }
  return next;
}

function assessBattle(state: TriadState): TriadState {
  if (state.phase === "between" || state.phase === "ended") return state;
  const players = { ...state.players };
  for (const seat of TRIAD_SEATS) {
    const side = players[seat];
    if (side.hp <= 0 && !side.eliminated) players[seat] = { ...side, eliminated: true, hp: 0 };
  }
  let next = { ...state, players };
  const survivors = TRIAD_SEATS.filter((seat) => !players[seat].eliminated);
  if (survivors.length > 1) {
    if (players[state.active].eliminated) {
      const startIndex = TRIAD_SEATS.indexOf(state.active);
      const successor = [1, 2].map((offset) => TRIAD_SEATS[(startIndex + offset) % 3])
        .find((candidate) => !players[candidate].eliminated);
      if (successor) {
        next = record({
          ...next, active: successor, phase: "roll", roll: null, played: 0, playLimit: 0,
          freeCard: false, costMultiplier: 1, discardPlay: false,
          borrowedCard: null, rouletteEvent: null, awakeningPending: false,
          players: { ...players, [state.active]: {
            ...players[state.active], turnsTaken: players[state.active].turnsTaken + 1,
          } },
        }, players[successor].name + " получает ход после выбывания " + players[state.active].name + ".");
      }
    }
    return next;
  }
  if (survivors.length === 0) return record({ ...next, phase: "between", battleWinner: "draw" }, "Все игроки выбыли. Ничья.");
  const battleWinner = survivors[0];
  const side = { ...players[battleWinner], victories: players[battleWinner].victories + 1 };
  const finished = side.victories >= TRIAD_VICTORIES_TO_WIN;
  next = {
    ...next, players: { ...players, [battleWinner]: side }, phase: finished ? "ended" : "between",
    battleWinner, winner: finished ? battleWinner : null,
  };
  return record(next, side.name + " победил в бою " + state.battle + ". Побед: " + side.victories + "/3.");
}

const GLOBAL_EFFECT_CARDS = new Set(["tsunami", "warlock", "ten_thousand_volts", "dawnless_winter", "revolver", "sandstorm"]);
export function triadIsGlobal(card: TriadCard) {
  return GLOBAL_EFFECT_CARDS.has(card.definition.id) || /damageall|all_enemies|aoe/i.test(card.definition.effectKey ?? "");
}
export function triadIsSupport(card: TriadCard) {
  return triadIsGlobal(card) || /heal|shield|bonus|buff|knowledge|draw|restore|self|caduceus|reverse|clean_sheet|armor_of_chaos/i.test(
    card.definition.id + " " + (card.definition.effectKey ?? "")) || card.definition.type === "upgrade";
}

export function reduceTriad(state: TriadState, action: TriadAction, loadouts: Record<TriadSeat, TriadLoadout>): TriadState {
  if (state.phase === "ended") return state;
  if (action.type === "NEXT") {
    if (state.phase !== "between" || action.seat !== "a") return state;
    const scores = { a: state.players.a.victories, b: state.players.b.victories, c: state.players.c.victories };
    return createTriadMatch(loadouts, state.seed, state.battle + 1, scores);
  }
  if (state.phase === "between") return state;
  if (action.seat !== state.active || state.players[action.seat].eliminated) return state;

  if (action.type === "CHOOSE_AWAKENING") {
    if (state.phase !== "main" || !state.awakeningPending) return state;
    if (action.choice === "passive") {
      const side = state.players[action.seat];
      const activeLane = triadRivals(action.seat).find((seat) => side.lanes[seat].some(Boolean));
      const ownerLane: TriadLane | undefined = activeLane ?? (side.support.some(Boolean) ? "support" : undefined);
      const rival = activeLane ?? aliveRivals(state, action.seat)[0];
      if (!ownerLane || !rival) return state;
      const card = (ownerLane === "support" ? side.support : side.lanes[ownerLane]).find((entry) => entry !== null);
      if (!card) return state;
      const next = resolveAgainst({ ...state, awakeningPending: false }, action.seat, rival, card, ownerLane, 0);
      return assessBattle(record(next, side.name + " повторно активировал способность " + card.definition.title + "."));
    }
    return record({ ...state, awakeningPending: false, freeCard: true }, "Пробуждение: следующая карта бесплатна.");
  }

  if (action.type === "CONCEDE") {
    return assessBattle(record({ ...state, players: {
      ...state.players, [action.seat]: { ...state.players[action.seat], hp: 0, eliminated: true },
    } }, state.players[action.seat].name + " выбыл из боя."));
  }

  if (action.type === "ROLL") {
    if (state.phase !== "roll") return state;
    let die = rollDie(state.rngSeed, 20);
    if (state.rouletteUsed && (die.value === 15 || die.value === 16)) {
      do { die = rollDie(die.seed, 20); } while (die.value === 15 || die.value === 16);
    }
    const rule = getD20Rule(die.value);
    const side = state.players[action.seat];
    let next: TriadState = {
      ...state, rngSeed: die.seed, phase: "main", roll: die.value,
      playLimit: getD20PlayLimit(die.value), played: 0,
      costMultiplier: rule === "doubleWill" ? 2 : 1,
      freeCard: false, discardPlay: rule === "discard", awakeningPending: rule === "awakening", borrowedCard: null,
      players: { ...state.players, [action.seat]: {
        ...side, will: Math.min(side.maxWill, side.will + side.regen),
        deck: side.deck.slice(Math.min(7 - side.hand.length, side.deck.length)),
        hand: [...side.hand, ...side.deck.slice(0, Math.max(0, 7 - side.hand.length))],
      } },
    };
    if (rule === "roulette") {
      const events = ["MERGED_DECKS", "WORLD_WITHOUT_WILL", "BLIND_TOP", "HIDDEN_HAND", "EMPTY_OUTCOME"];
      const random = rollDie(next.rngSeed, events.length);
      next = { ...next, rngSeed: random.seed, rouletteEvent: events[random.value - 1], rouletteUsed: true };
      if (next.rouletteEvent === "MERGED_DECKS") {
        const pool = TRIAD_SEATS.flatMap((seat) => next.players[seat].deck);
        const shuffle = shuffleWithSeed(pool, next.rngSeed);
        let cursor = 0;
        const players = { ...next.players };
        for (const seat of TRIAD_SEATS) {
          const count = players[seat].deck.length;
          players[seat] = { ...players[seat], deck: shuffle.items.slice(cursor, cursor + count) };
          cursor += count;
        }
        next = { ...next, rngSeed: shuffle.seed, players };
      }
      // Fate Roulette resolves once, then the owner receives a new D20 result.
      let reroll = rollDie(next.rngSeed, 20);
      while (reroll.value === 15 || reroll.value === 16) reroll = rollDie(reroll.seed, 20);
      const rerule = getD20Rule(reroll.value);
      next = { ...next, rngSeed: reroll.seed, roll: reroll.value,
        playLimit: getD20PlayLimit(reroll.value),
        costMultiplier: rerule === "doubleWill" ? 2 : 1,
        discardPlay: rerule === "discard", awakeningPending: rerule === "awakening" };
      if (next.rouletteEvent === "WORLD_WITHOUT_WILL") next.freeCard = true;
    } else next.rouletteEvent = null;
    if (getD20Rule(next.roll ?? die.value) === "enemyDeck") {
      const targets = aliveRivals(next, action.seat).filter((id) => next.players[id].deck.length > 0);
      if (targets.length > 0) {
        const rand = rollDie(next.rngSeed, targets.length);
        const victim = targets[rand.value - 1];
        const deck = next.players[victim].deck;
        const selected = rollDie(rand.seed, deck.length);
        next = { ...next, rngSeed: selected.seed, borrowedCard: { seat: victim, cardId: deck[selected.value - 1].instanceId } };
      }
    }
    next = attackLanes(next, action.seat);
    next = assessBattle(next);
    return record(next, side.name + " бросил D20: " + die.value + " (" + rule + ").");
  }
  if (action.type === "PLAY") {
    const player = state.players[action.seat];
    const source = player.hand.find((c) => c.instanceId === action.cardId) ??
      (state.discardPlay ? player.discard.find((c) => c.instanceId === action.cardId) : undefined) ??
      (state.rouletteEvent === "BLIND_TOP" && player.deck[0]?.instanceId === action.cardId ? player.deck[0] : undefined) ??
      (state.borrowedCard?.cardId === action.cardId ? state.players[state.borrowedCard.seat].deck.find((c) => c.instanceId === action.cardId) : undefined);
    if (!source || !triadCanPlay(state, action.seat, source, action.lane, action.slot)) return state;
    if (source.definition.id === "healing") {
      const healingLane = action.targetSeat;
      const index = action.targetSlot;
      if (!healingLane || healingLane === action.seat || typeof index !== "number" ||
        !Number.isInteger(index) || index < 0 || index >= TRIAD_LANE_SLOTS ||
        !player.lanes[healingLane][index]) return state;
    }
    if (action.lane === "support" && !triadIsSupport(source)) return state;
    if (action.lane !== "support" && triadIsSupport(source)) return state;
    const cost = triadEffectiveCost(state, action.seat, source);
    const played: TriadCard = { ...source, playedTurn: player.turnsTaken,
      hp: Math.max(0, Number(source.definition.health) || 0) };
    const nextSide = {
      ...player, will: player.will - cost,
      effects: isLightning(source) ? player.effects.filter((effect) => effect.id !== "alpha_next_lightning_discount") : player.effects,
      hand: player.hand.filter((c) => c.instanceId !== source.instanceId),
      discard: player.discard.filter((c) => c.instanceId !== source.instanceId),
      deck: player.deck.filter((c) => c.instanceId !== source.instanceId),
      lanes: action.lane === "support" ? player.lanes :
        { ...player.lanes, [action.lane]: player.lanes[action.lane].map((c, i) => i === action.slot ? played : c) },
      support: action.lane === "support" ?
        player.support.map((c, i) => i === action.slot ? played : c) : player.support,
    };
    let next: TriadState = { ...state, played: state.played + 1,
      freeCard: state.rouletteEvent === "WORLD_WITHOUT_WILL", discardPlay: false,
      borrowedCard: null,
      players: { ...state.players, [action.seat]: nextSide } };
    if (state.borrowedCard?.cardId === source.instanceId) {
      const victim = state.borrowedCard.seat;
      next = { ...next, players: { ...next.players, [victim]: {
        ...next.players[victim], deck: next.players[victim].deck.filter((c) => c.instanceId !== source.instanceId),
      } } };
    }
    const rivals = aliveRivals(next, action.seat);
    if (source.definition.id === "healing" && action.targetSeat && typeof action.targetSlot === "number") {
      const healingSide = next.players[action.seat];
      const index = action.targetSlot;
      const wounded = healingSide.lanes[action.targetSeat][index];
      if (wounded) {
        const maxHp = Math.max(0, Number(wounded.definition.health) || 0);
        const healed = { ...wounded, hp: Math.min(maxHp, wounded.hp + 3) };
        next = { ...next, players: { ...next.players, [action.seat]: {
          ...healingSide, lanes: { ...healingSide.lanes,
            [action.targetSeat]: healingSide.lanes[action.targetSeat].map((c, i) => i === index ? healed : c),
          },
        } } };
      }
    } else if (action.lane === "support") {
      // Support/global cards interact with both opponents only when they have an area effect.
      const targets = triadIsGlobal(source) ? rivals : rivals.slice(0, 1);
      targets.forEach((rival, index) => { next = resolveAgainst(next, action.seat, rival, played, "support", action.slot, index === 0); });
    } else {
      next = resolveAgainst(next, action.seat, action.lane, played, action.lane, action.slot);
    }
    // One-shot effects leave the board; permanent cards stay and can attack on later turns.
    const resolvedOwner = next.players[action.seat];
    if (source.definition.health <= 0) {
      if (action.lane === "support") {
        next.players = { ...next.players, [action.seat]: {
          ...resolvedOwner, support: resolvedOwner.support.map((c, i) => i === action.slot ? null : c),
          discard: [...resolvedOwner.discard, played],
        } };
      } else {
        next.players = { ...next.players, [action.seat]: {
          ...resolvedOwner, lanes: { ...resolvedOwner.lanes, [action.lane]: resolvedOwner.lanes[action.lane].map((c, i) => i === action.slot ? null : c) },
          discard: [...resolvedOwner.discard, played],
        } };
      }
    }
    return assessBattle(record(next, player.name + " разыграл " + source.definition.title + " (" + cost + " Воли)."));
  }
  if (action.type === "END") {
    if (state.phase !== "main") return state;
    let next = state;
    const current = state.players[action.seat];
    if (!current.hand.length && !current.deck.length) {
      next = { ...next, players: { ...next.players,
        [action.seat]: damageHero(current, 3) } };
      next = assessBattle(next);
      if (next.phase !== "main") return next;
    }
    const updated = next.players[action.seat];
    const nextPlayers = { ...next.players, [action.seat]: { ...updated,
      turnsTaken: updated.turnsTaken + 1 } };
    const order = TRIAD_SEATS.map((_, i) => TRIAD_SEATS[(TRIAD_SEATS.indexOf(action.seat) + i + 1) % 3]);
    const successor = order.find((seat) => !nextPlayers[seat].eliminated);
    if (!successor) return assessBattle({ ...next, players: nextPlayers });
    return record({ ...next, players: nextPlayers, active: successor, phase: "roll",
      round: next.round + (successor === "a" ? 1 : 0), roll: null,
      playLimit: 0, played: 0, freeCard: false, discardPlay: false,
      rouletteEvent: null, costMultiplier: 1, awakeningPending: false, borrowedCard: null }, nextPlayers[successor].name + " начинает ход.");
  }
  return state;
}

export function chooseTriadBotAction(state: TriadState): TriadAction {
  const seat = state.active;
  if (state.phase === "roll") return { type: "ROLL", seat };
  const owner = state.players[seat];
  const targets = aliveRivals(state, seat);
  if (state.awakeningPending) return { type: "CHOOSE_AWAKENING", seat, choice: "freeCard" };
  const available = state.rouletteEvent === "BLIND_TOP" ? owner.deck.slice(0, 1) :
    [...owner.hand, ...(state.discardPlay ? owner.discard : []),
      ...(state.borrowedCard ? state.players[state.borrowedCard.seat].deck.filter((c) => c.instanceId === state.borrowedCard?.cardId) : [])];
  for (const card of available) {
    const lanes: TriadLane[] = triadIsSupport(card) ? ["support"] : targets;
    for (const lane of lanes) {
      const slots = lane === "support" ? owner.support : owner.lanes[lane];
      const index = slots.findIndex((c) => !c);
      if (index >= 0 && triadCanPlay(state, seat, card, lane, index)) {
        return { type: "PLAY", seat, cardId: card.instanceId, lane, slot: index };
      }
    }
  }
  return { type: "END", seat };
}
