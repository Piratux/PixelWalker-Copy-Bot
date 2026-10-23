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

| Action                                                                                                 | Recorded for undo and redo                                              |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Blue-coin pastes, [`.paste`](./paste.md), [`.smartpaste`](./smartpaste.md), and [move mode](./move.md) | Block and zone changes                                                  |
| [`.edit`](./edit.md) and [`.flip`](./flip.md)                                                          | Block changes                                                           |
| Full and partial [imports](./import.md)                                                                | Block changes and full-import zone replacement; labels are not recorded |
| [Snake placements](./snake.md) and manual player edits                                                 | Not recorded                                                            |

History keeps up to **100 actions per player**, not just 100 individual tiles. Your undo history is not shared with other players.

## Important limits

Block and zone changes from the same action are undone **together**. `.undo 1` reverses one recorded action. Undoing a block-only edit does not undo zones from an older action.

Undo does not restore your copied selection or mode settings. Reselect the restored area if you want subsequent pastes to use the restored blocks.

Full-import label replacement is not recorded for undo or redo. Back up important world content first.

Snake placements are not recorded for undo or redo. `.undo` will not remove doors created this way. Manual player edits are not recorded for undo or redo.

Undo can overwrite changes made at the same positions by other players after your bot operation. Coordinate with other builders. Undo is not a world backup.

Use [`.redo`](./redo.md) to reapply available undone changes. Any newly recorded action clears your redo history for both blocks and zones.
