# .redo

Reapply your available undone changes. Both you and the bot need edit permission.

## Syntax

```text
.redo [count]
```

`count` defaults to `1`. Use a positive integer to request multiple actions. If fewer actions are available, only those actions are redone. The bot privately reports the number of actions redone.

## Examples

```text
.undo 2
.redo
.redo 2
```

Redo reapplies the original changes regardless of your current selection or mask. Redo does not restore your copied selection or mode settings. Reselect the restored area if you want subsequent pastes to use the restored blocks.

## History limits

Block, label and zone changes from the same action are redone **together**. `.redo 1` reapplies one recorded action. Any newly recorded action clears your redo history for blocks, labels and zones. Your redo history is not shared with other players.

See [undo coverage](./undo.md#coverage) and [undo limitations](./undo.md#important-limits) before relying on history. Snake placements are not recorded for undo or redo. Redo can overwrite changes made at the same positions by other players. Coordinate with other builders.
