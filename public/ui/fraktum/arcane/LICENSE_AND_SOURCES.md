# FRAKTUM — arcane stone pixel UI sprite set

## Exact source
The 20 PNGs in this directory are palette-shifted derivatives of original
raster sprites from the archive provided by the game owner,
`FRAKTUM_ALL_SORTED_2026-11-15.zip`, located at:

`05_BATTLE_ARENAS_HUD_SLOTS/card_battle-kit_v1.0/ui/card_battle/`

The source file names (e.g. `panel_window.png`, `button_wide_normal.png`,
`slot_idle.png`, `bar_frame_64x12.png`) are recorded in the extraction
manifest delivered with this UI patch.

## License
The accompanying source license,
`98_DOCUMENTS_SOURCE_METADATA/card_battle-kit_v1.0/license.txt`, allows
use and modification in commercial and noncommercial games/apps but prohibits
redistributing the assets alone, modified or not, as an asset pack/library.

This directory is shipped solely as embedded assets of FRAKTUM TCG; it is
NOT a standalone asset pack. Do not repackage or resell these sprites separately.

## Rendering
True bitmap pixel art, no generated gradients. Use nearest-neighbor scaling and
the CSS nine-slice borders; sample slices: panels 9, buttons 4 9, slots 5.
Colours: dark slate/blue, cool arcane cyan, antique gold primary button.
Do not use `border-image-slice: fill` from the old yellow wooden theme.
