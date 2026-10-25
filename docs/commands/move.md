# .move

Toggle moving the selection rather than copying it.

## Syntax and example

```text
.move
```

The initial state is **off**. Run the command once to enable it and again to disable it. The bot privately confirms the new state. No selection or edit permission is required to change the setting. Both you and the bot need edit permission to select or move blocks with coins.

## Workflow

1. Complete a two-gold-coin selection.
2. Type `.move` to enable move mode.
3. Place a blue coin at the destination, anchored to the first gold coin.
4. Type `.move` again to return to copying.

The bot clears the source rectangle on the enabled block layers and places the selected blocks at the destination. Labels anchored inside the selection and fully selected zones are moved if their corresponding masks are enabled.

Within the same selection, another blue-coin move relocates the selection again. The bot attempts to restore blocks covered by the previous move and removes previously moved labels and zones. Selecting a new area starts a new move; move mode remains enabled until you turn it off.

## Interactions with other commands

[`.mask`](./mask.md) restricts which source layers are cleared and which layers, labels and zones are moved. [`.skipair`](./skipair.md) filters destination blocks, but **does not prevent source clearing** in move mode and does not affect labels or zones.

The mode also applies to immediate [`.paste`](./paste.md) and [`.smartpaste`](./smartpaste.md) repetition. Disable move mode first when you only want copies.

::: warning Avoid rapid dragging
Placing blue coins very quickly can leave some blocks behind instead of restoring them. Move deliberately, wait for placement to finish, and keep a backup of important builds.
:::
