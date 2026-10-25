# .flip

Mirror selected **block positions** horizontally or vertically.

Both you and the bot need edit permission. Complete a two-gold-coin selection first.

## Syntax

```text
.flip h
.flip v
```

`h` mirrors left/right; `v` mirrors top/bottom. Exactly one direction is required.

## Example

Select a structure from its top-left corner to its bottom-right corner, then run:

```text
.flip h
```

The bot updates the copied block selection and immediately places its mirrored blocks at the original selection location. Blue coins subsequently paste the mirrored blocks.

::: tip Selection order
Select top-left first and bottom-right second for flipping. Selecting the corners in reverse order can place flipped blocks in unexpected positions.
:::

This changes positions, **not block arguments or directional orientation**. Labels and zones are not mirrored; The current [mask](./mask.md) and [skip-air setting](./skipair.md) do not apply.
