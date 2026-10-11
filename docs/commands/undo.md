# .undo

Restore recorded changes made by the bot for your player. Both you and the bot need edit permission.

## Syntax

```text
.undo [count]
```

`count` defaults to `1`. Use a positive integer to request multiple actions. If fewer actions are available, only those actions are undone. The bot privately reports separate block and zone counts.

## Examples

```text
.undo
.undo 3
```

## Coverage

| Action                                                                                                 | Recorded for undo and redo                                                 |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Blue-coin pastes, [`.paste`](./paste.md), [`.smartpaste`](./smartpaste.md), and [move mode](./move.md) | Block and zone changes                                                     |
| [`.edit`](./edit.md) and [`.flip`](./flip.md)                                                          | Block changes                                                              |
| Full and partial [imports](./import.md)                                                                | Block changes only; full-import label and zone replacement is not recorded |
| [Snake placements](./snake.md) and manual player edits                                                 | Not recorded                                                               |

History keeps up to **100 actions affecting blocks and 100 actions affecting zones per player**, not just 100 individual tiles. Your undo history is not shared with other players.

## Important limits

Block and zone changes are undone **separately**. `.undo 1` reverses the block changes from up to one action and the zone changes from up to one action. These may be different actions: undoing a block-only edit may also undo an older zone paste.

Undo does not restore your copied selection or mode settings. Reselect the restored area if you want subsequent pastes to use the restored blocks.

Full-import label and zone replacement is not recorded for undo or redo. Back up important world content first.

Snake placements are not recorded for undo or redo. `.undo` will not remove doors created this way. Manual player edits are not recorded for undo or redo.

Undo can overwrite changes made at the same positions by other players after your bot operation. Coordinate with other builders. Undo is not a world backup.

Use [`.redo`](./redo.md) to reapply available undone changes. New block changes clear block redo history; new zone changes clear zone redo history.
