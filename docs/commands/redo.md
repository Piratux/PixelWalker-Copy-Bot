# .redo

Reapply your available undone changes. Both you and the bot need edit permission.

## Syntax

```text
.redo [count]
```

`count` defaults to `1`. Use a positive integer to request multiple actions. If fewer actions are available, only those actions are redone. The bot privately reports separate block and zone counts.

## Examples

```text
.undo 2
.redo
.redo 2
```

Redo reapplies the original changes regardless of your current selection or mask. Redo does not restore your copied selection or mode settings. Reselect the restored area if you want subsequent pastes to use the restored blocks.

## History limits

Block and zone changes are redone **separately**. `.redo 1` reapplies the block changes from up to one action and the zone changes from up to one action. These may be different actions. New block changes clear block redo history; new zone changes clear zone redo history. Your redo history is not shared with other players.

See [undo coverage](./undo.md#coverage) and [undo limitations](./undo.md#important-limits) before relying on history. Full-import label and zone replacement is not recorded for undo or redo. Snake placements are not recorded for undo or redo. Redo can overwrite changes made at the same positions by other players. Coordinate with other builders.
