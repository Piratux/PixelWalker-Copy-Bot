# .import

Import blocks, labels and zones from another world into the current world. A full import replaces existing labels and zones.

Both you and the bot need edit permission. **You must be the current world's owner**. No selection is required.

## Syntax

```text
.import world_id
.import world_id src_from_x src_from_y src_to_x src_to_y dest_to_x dest_to_y
```

The first argument accepts a world ID or a PixelWalker world URL. Provide either only that argument or all six coordinate arguments.

## Full-world import

```text
.import https://pixelwalker.net/world/9gf53f4qf5z1f42
```

Blocks are imported at their original coordinates. The current [block-layer mask](./mask.md) and [skip-air setting](./skipair.md) apply.

::: danger Replaces world content
With default settings, imported air clears destination blocks, including areas not covered by the source world. All destination labels and zones are replaced with the source labels and zones, **regardless of the label/zone masks or skip-air**. Labels whose anchors are outside the destination world are skipped.

Block changes and label/zone replacement are recorded together for [`.undo`](./undo.md), so one undo reverses all three. Back up important world content first.
:::

The import does not resize the destination world. Use a destination large enough for the source or import a smaller rectangle.

## Partial import

| Argument                   | Meaning                            |
| -------------------------- | ---------------------------------- |
| `src_from_x`, `src_from_y` | Top-left source tile               |
| `src_to_x`, `src_to_y`     | Bottom-right source tile, included |
| `dest_to_x`, `dest_to_y`   | Top-left destination tile          |

Coordinates are tile coordinates starting at `(0, 0)`. Use integers and specify source corners from top-left to bottom-right. The entire source rectangle and destination rectangle must fit inside their respective worlds.

```text
.import legacy:PW4gnKMssUb0I 2 4 25 16 2 4
```

This copies the inclusive source rectangle `(2, 4)` to `(25, 16)` (24 tiles wide and 13 high) to destination `(2, 4)`.

Partial import copies blocks, **labels anchored inside the source rectangle**, and **zones fully contained in the source rectangle**, shifting them to the destination together. Label text and styling are preserved. Zones crossing the source rectangle's boundary are not imported. The corresponding label/zone mask must be enabled (for example, with `.mask default`, `.mask label`, or `.mask zone`).

Existing destination zones and labels are left unchanged, and blocks outside the destination rectangle are not cleared. Air inside the imported rectangle can still clear destination blocks unless skip-air is enabled. Imported blocks, labels and zones are recorded together for [`.undo`](./undo.md) and [`.redo`](./redo.md).

## Interactions with other commands

The bot announces the source world ID in global chat and announces completion after all imported blocks, labels and zones are placed. The bot must be able to access the source world; inaccessible or invalid worlds can fail to load.

The current [block-layer mask](./mask.md) and [skip-air setting](./skipair.md) apply to both import forms. [Move mode](./move.md) does not apply.
