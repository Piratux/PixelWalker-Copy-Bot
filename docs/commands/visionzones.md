# .visionzones

Create visibility zones around see-through tiles in a rectangular area.

Both you and the bot need edit permission. No coin selection is required.

## Syntax

```text
.visionzones fromX fromY toX toY visionRadius
```

| Argument         | Meaning                                                                  |
| ---------------- | ------------------------------------------------------------------------ |
| `fromX`, `fromY` | Tile coordinates of one corner of the rectangle                          |
| `toX`, `toY`     | Tile coordinates of the opposite corner                                  |
| `visionRadius`   | Visibility radius in tiles; a finite number greater than or equal to `0` |

All five arguments are required. Coordinates must be integers inside the world. Both corners are included, and they can be supplied in either order.

## Example

```text
.visionzones 10 10 20 20 5
```

The bot creates one zone for each see-through tile in the rectangle from `(10, 10)` to `(20, 20)`. Each zone covers tiles visible from its origin within an approximately circular radius of `5` tiles. Visibility can extend outside the requested rectangle, but never outside the world.

## Visibility rules

Foreground air, gravity dots, slow dots, and their invisible variants are see-through. All other foreground blocks block vision and do not receive their own zones. Background and overlay blocks do not affect visibility.

The first blocking tile along a line of sight is included, but tiles behind it are hidden. Visibility is calculated from the blocks present when you run the command; rerunning it adds new zones rather than updating the old ones.

## Interactions with other commands

The command adds zones without removing existing zones or changing blocks. The current [mask](./mask.md) and [skip-air setting](./skipair.md) do not affect it.

Use [`.undo`](./undo.md) to remove the zones created by one invocation and [`.redo`](./redo.md) to restore them.

Large rectangles can create many zones. Start with a small area and wait for placement to finish before sending another command.
