# .smartpaste

Repeat the selection like [`.paste`](./paste.md), while deriving changes to supported block arguments from a pattern already in the world.

Both you and the bot need edit permission. Complete a two-gold-coin selection first.

The command acts **immediately at the selection's original location**. No blue coin is required.

## Syntax

```text
.smartpaste x_times y_times [x_spacing y_spacing]
```

Counts, directions, and spacing are the same as [`.paste`](./paste.md). The current [mask](./mask.md), [skip-air setting](./skipair.md), and [move mode](./move.md) apply.

Labels and fully selected zones repeat just as with `.paste` when their masks are enabled. Label text and styling are copied unchanged; numbers in label text are not incremented.

## Define a pattern

Place matching blocks **one repetition step away** horizontally and vertically to show how their settings should change between copies. A step is the selected width/height plus the specified spacing, in the direction of the repeat count. Corresponding pattern blocks must have the same block type.

Each copy continues the change shown by the neighboring pattern blocks. Without matching pattern blocks in a direction, settings remain unchanged in that direction.

## Example: numbered switches

1. Place a purple switch with ID `1` at `(0, 0)`.
2. Place the same type of purple switch with ID `2` at `(1, 0)`.
3. Select **only `(0, 0)`**, using both gold coins at that tile.
4. Type `.smartpaste 5 1`.

The resulting switches at `(0, 0)` through `(4, 0)` have IDs `1, 2, 3, 4, 5`. Prepare the neighboring pattern **before running the command**.

```text
.smartpaste 5 1
.smartpaste 3 2 1 1
```

With spacing, place the example pattern one full step away, not merely in the adjacent tile.

## Supported arguments and limits

| Argument kind                                   | Behavior                                                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Whole-number settings, such as switch IDs       | Continue the numeric pattern                                                                     |
| Colors                                          | Change red, green, and blue amounts separately                                                   |
| Short portal IDs containing letters and numbers | Continue the numeric parts when the pattern IDs use matching arrangements of letters and numbers |
| Time-door offset                                | Wrap around the door's cycle, which lasts twice its time setting                                 |

Not all block settings are supported. Other text, on/off settings, and unsupported numeric settings remain unchanged. Color values must remain in range; generated portal IDs must not exceed five characters. Invalid generated values can produce an error.

## After the command

A later blue coin pastes only one copy without advancing the pattern. Run `.paste 1 1` with a valid selection to switch back to ordinary paste mode; this also immediately pastes once at the source.

A failed command may still have changed the world, including labels and zones; check the result before continuing.
