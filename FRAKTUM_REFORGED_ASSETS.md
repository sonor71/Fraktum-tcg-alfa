# FRAKTUM: REFORGED — installation of pixel UI assets

This branch updates the visual design across menus and both match screens.

## WHERE TO PUT IMAGES

Only assets actually used by the interface belong in the repository:
`public/ui/fraktum/` with subfolders `buttons/`, `panels/`,
`icons/`, `battle/`. Example:
`public/ui/fraktum/icons/icon_hp.png`
`public/ui/fraktum/battle/arena_1v1.png`.

The 47MB sorted archive is **not** intended to be committed. It contains
thousands of source files, duplicate variants, fonts, audio and assets with
incomplete licence documentation. Committing its ZIP will NOT make the images
accessible to the frontend: Vite serves unpacked files in `public/`.

The selected 27-image bundle was provided separately to the user as
`FRAKTUM_REFORGED_UI_ASSETS_DROPIN.zip`. Unpack **only its public/ directory**
into the repository root. Do not place assets under `src/` or rename the files.

## LICENSING BEFORE PUBLIC PUSH

`CrispPixel_Sampler/LICENSE.txt` in the uploaded archive allows graphics
in commercial/non-commercial games, but explicitly prohibits sharing the
art itself as a standalone pack. **Check your intended public repository
distribution and the asset author's licence before committing its PNGs.**
The wooden arena's source-specific licence was not included in the upload;
confirm you own rights to it or have permission.

The CSS has gradient/color fallbacks and builds without optional assets.
Do not publish the full sorted asset archive or any files with unverified rights.

## SCOPE OF THE UPDATE

- Wood/bronze global interface; shared navigation, home, modes, collection,
  decks, inventory, shop, market, clubs, profile, settings.
- Wooden 1v1 and 1v1v1 arenas, thin board slots, coloured HP/shield meters,
  D20 pedestal styling, clearer turn and battle overlays.
- Menu icons can be read from `public/ui/fraktum/icons/`.
- Game mechanics, costs, authentication, matchmaking, bot logic, packs,
  saved progress, and network sync remain unchanged.

## TESTING

Run `npm ci`, then `npm run build` and `npm test -- --run` if available.
Manually inspect desktop and mobile layouts and online/triad matches before
merging. This change was prepared without a local checkout; CI and manual
review are required before production deployment.
