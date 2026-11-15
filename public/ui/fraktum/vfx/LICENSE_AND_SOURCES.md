# FRAKTUM Pixel Battle VFX Atlas — CC0

This file, **battle_vfx_atlas.png**, contains 11 real pixel-art combat animations
in one lightweight image. It has 160×680 pixels (5 columns × 34 rows,
20×20-pixel frames). The UI scales individual frames using
CSS image-rendering: pixelated. Each effect plays once at 20 FPS.

Source: **PVFX Foundry 1.0.0**, user-provided archive, subdirectory
legacy/0.10.0. The included PVFX_FOUNDRY_LICENSE.txt applies CC0 1.0
Universal to the exported sprite sheets. This claim does not extend to
the source programs, renderer software, product marks, or other files.

| Effect name in code | Atlas first row | Source effect | Number of frames |
|---|---:|---|---:|
| slash | 0 | crescent-slash | 10 |
| fire | 2 | ember-jet | 14 |
| ice | 5 | frost-nova | 13 |
| lightning | 8 | electric-impact | 14 |
| heal | 11 | radiant-heal | 14 |
| shield | 14 | arcane-parry | 16 |
| void | 18 | void-implosion | 14 |
| summon | 21 | spectral-bloom | 16 |
| destroy | 25 | warm-explosion | 15 |
| arcane | 28 | magical-projectile | 12 |
| poison | 31 | acid-splash | 14 |

The original PNG sprite sheets were resized from 96×96 to 20×20 using
nearest-neighbor interpolation, combined into one atlas and palettized.
The resulting image is a derivative of the CC0 source sprite art.

Engine integration:
- src/components/match/PixelVfxSprite.tsx — animated pixel atlas renderer
- src/components/match/MatchFxLayer.tsx — effects for 1v1/online
- src/components/match/TriadPixelFxLayer.tsx — effects for triad
