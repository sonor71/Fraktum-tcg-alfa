# FRAKTUM: REFORGED — pixel-art UI assets in this branch

## Asset installation

**The selected textures have already been uploaded on this PR branch.**
No manual ZIP upload, file renaming, or copying is required.

The application loads textures directly from `public/ui/fraktum/`:

- `buttons/` — button states,
- `panels/` — pixel panels and window chrome,
- `icons/` — hearts, shields, coins, sword, bag, etc.,
- `battle/arena_1v1.png` — original, procedurally drawn warm wooden tabletop.

The same arena texture is currently used behind 1×1 and 1×1×1, so that
both game modes share the wooden-board visual language. The triad-specific
layout still uses its own scene components.

The CSS has a fallback wooden gradient if an image fails to load.
Icons and other visual assets are independent of card art, network logic,
and player progress.

## Scope

Updated home, navigation, existing shared menus, pack opening, card passport,
1×1 match and triad match visual styling. Game rules, card costs, balances,
online matchmaking and Supabase code are not changed by this update.

## License conditions

The 26 third-party UI textures came from **CrispPixel Sampler** and are
used inside the game. See `public/ui/fraktum/THIRD_PARTY_ASSETS.md`.
The included licence permits commercial/non-commercial use in games and apps
but prohibits redistributing them as a standalone asset pack, UI kit, or
template. Do not treat the PNGs as freely reusable files in another project
or republish them as a pack.

The original user-uploaded `arena_1v1.png` was **not** committed because
its source-specific copyright/licence could not be verified. A new, original
wooden-board texture was created specifically for this game instead.

The large sorted resource archive (46MB) remains **outside** the public
repository. It includes thousands of unused images and unverified licences.

## Verify before merging

The repository's GitHub Actions workflow runs the build and relevant tests.
Also manually inspect 1×1 AI match, 1×1 online matchmaking and roulette,
triad, card costs, store, pack opening, and the mobile layout. The PR
does not claim to fix functional gameplay bugs that were already present.
