# FRAKTUM Reforged v3 — original icon sources and limits

`ui_icon_atlas_extra.png` is a compact 8x4 atlas of **32 real bitmaps**
from the user's previously supplied `FRAKTUM_UI_STARTER_2026-11-15.zip`.
Each tile is 32 x 32 pixels. No icons are fabricated as CSS shapes.

Original subfolders inside the supplied starter ZIP:
- `02_HOME_MENU/icons/`: 9 menu icons (home, settings, profile, shop,
  inventory, collection, decks, clubs, trophy).
- `06_PROFILE_CLUBS_RANKS/icons/`: chat, warning, search, reward.
- `05_BATTLE/controls/`: target, play, pause, config, Will.
- `05_BATTLE/status/`: burn, freeze, poison, regen, shield, stun.
- `06_PROFILE_CLUBS_RANKS/avatar/`: avatar frame.
- `03_SHOP_PACKS_CHESTS/chests/`: five chest variants.
- `04_COLLECTION_DECK/slots/`: rare and epic slot borders.

The image is intended for **use inside FRAKTUM TCG**, not as a
separate redistribution-ready asset pack. The starter archive includes
licences for the CrispPixel Sampler, Framewright Lite, Card Battle Pixel UI,
and PVFX Foundry. The imported icon textures include multiple sources:
**this document does not assert they are all CC0**. Some original
licences permit commercial game use but prohibit redistributing the
graphics as independent assets or packs. If a stricter interpretation
applies to publicly committing the sprite atlas, remove the icon atlas
from the public repository and provide it through a licensed asset
delivery process instead.

Other UI panels and buttons used by `fraktum-authentic-pixel.css`
are the CrispPixel-derived 26 bitmaps already committed before v3.
The code uses original PNGs as 9-slice edges and tile fills.
It specifically avoids `border-image-slice: fill` to prevent the prior
yellow-background / white-text contrast problem.

Additional original combat bar sprites from `FRAKTUM_UI_STARTER_2026-11-15.zip`:
- `05_BATTLE/bars/hp_bar_bg.png` -> `battle/hp_bar_bg.png`
- `05_BATTLE/bars/hp_bar_fill.png` -> `battle/hp_bar_fill.png`
- `05_BATTLE/bars/will_bar_fill.png` -> `battle/will_bar_fill.png`

These are **the supplied bitmap textures**, not an approximation drawn in CSS.
The game still computes the meter's numeric progress from its normal state.
