# FRAKTUM Pixel Effects — source and licence verification

## What this update actually uses
The previous version carried 11 real animated effects in `battle_vfx_atlas.png`.
Reforged v3 adds **27 additional distinct pixel sprite animations** in
`battle_vfx_extra.png` (80 x 976 pixels; 5 columns; 61 rows; 16 x 16 per frame).
This brings the total to **38 distinct visual animations**, not 38 different
gameplay mechanics. The atlas is combined and optimized from the actual
user-supplied asset pack, **PVFX Foundry 1.0.0 / effects/** strict/grid
sprite sheets, retaining nearest-neighbor pixel edges.

The original user-provided source includes
`PVFX_FOUNDRY_LICENSE.txt`, which explicitly licenses the exported
`effects/**/sprite-sheet.png` files under **CC0 1.0 Universal**, to the
extent of the publisher's rights. This permission does NOT automatically
cover the creation software, source programs, names or trademarks.

| Game visual | Original effects/ source | Atlas row | Frames |
|---|---|---:|---:|
| fire_nova | explosions/fire-nova | 0 | 10 |
| meteor | fire/meteor-strike | 2 | 13 |
| flamethrower | fire/flamethrower | 5 | 8 |
| ice_wall | ice/ice-wall | 7 | 11 |
| blizzard | ice/blizzard | 10 | 8 |
| freeze | ice/freeze-encase | 12 | 10 |
| ice_spike | ice/ice-spike | 14 | 13 |
| chain_lightning | lightning/chain-lightning | 17 | 7 |
| electric_burst | lightning/static-burst | 19 | 7 |
| shield_break | arcane/shield-shatter | 21 | 9 |
| regen | holy/regen-aura | 23 | 8 |
| holy | holy/divine-beam | 25 | 10 |
| crit | impacts/crit-hit | 27 | 6 |
| smash | melee/hammer-smash | 29 | 8 |
| arrow | projectiles/arrow-impact | 31 | 9 |
| earth_spike | nature/earth-spike | 33 | 11 |
| vines | nature/vine-snare | 36 | 10 |
| curse | shadow/curse | 38 | 14 |
| soul_drain | shadow/soul-drain | 41 | 12 |
| smoke | smoke/smoke-bomb | 44 | 11 |
| stun | status/stun-stars | 47 | 8 |
| water | water/tidal-wave | 49 | 10 |
| wind_blade | wind/wind-blade | 51 | 8 |
| fate | arcane/magic-circle | 53 | 10 |
| teleport | arcane/teleport-in | 55 | 10 |
| burning | status/burning-aura | 57 | 6 |
| poisoned | status/poisoned | 59 | 9 |

The source atlas is reduced by selecting evenly spaced animation frames,
resizing with nearest-neighbor and indexing colours for efficient loading.

## Activation rules
`PixelVfxSprite.tsx` selects animations from card IDs, explicit card
elements, and effect-key hints. Therefore visually themed card-play
animations can appear even if a seasonal card's game effect is still
`season_basic_v1`. **This is deliberate appearance only; it does not
add effects, status effects or balance changes to those cards.**

1x1 and 1x1x1 play the same assets when the corresponding game state changes
(card played, damage, heal, shield, status, Will and D20). Animations are
one-shot, no input is intercepted, and reduced-motion users get a still frame.

**Not yet included:** unique animations for every one of the 102 cards,
per-card cinematic camera sequences or new sound effects. Real-time Vercel
deploy and visual browser inspection must still be verified.
