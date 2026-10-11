# .paste

Repeat the current selection in a grid.

Both you and the bot need edit permission. Complete a two-gold-coin selection first.

The command acts **immediately at the selection's original location**. No blue coin is required.

## Syntax

```text
.paste x_times y_times [x_spacing y_spacing]
```

| Argument    | Meaning                                                             |
| ----------- | ------------------------------------------------------------------- |
| `x_times`   | Number of copies horizontally, including the original-position copy |
| `y_times`   | Number of copies vertically, including the original-position copy   |
| `x_spacing` | Horizontal gap in tiles; defaults to `0`                            |
| `y_spacing` | Vertical gap in tiles; defaults to `0`                              |

Use nonzero integer repeat counts and provide either no spacing arguments or **both** spacing arguments. Positive counts extend right/down; negative counts extend left/up. The magnitude is the number of copies. Spacing is added to the selection's width/height to determine each step. Nonnegative integer spacing is the simplest choice.

## Examples

```text
.paste 2 3
.paste 2 3 4 1
.paste -3 1
```

For a selection that is 2 tiles wide and 3 tiles high, `.paste 2 3 4 1` places a 2-by-3 grid, stepping 6 tiles horizontally and 4 vertically.

## Interactions with other commands

The paste is anchored to the first gold coin. The first copy occupies the selection's original position. Copies are constrained by world bounds; do not rely on pasting outside the world.

The current [mask](./mask.md), [skip-air setting](./skipair.md), and [move mode](./move.md) apply. Fully selected zones are repeated if the zone mask is enabled; in normal copy mode, multi-copy repetition avoids duplicating zones at the original location.

A later blue coin pastes only one copy. `.paste` also switches back to ordinary pasting after [`.smartpaste`](./smartpaste.md).
