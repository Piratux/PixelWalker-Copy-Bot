# .skipair

Toggle ignoring air blocks from the copied selection when pasting.

## Syntax and example

```text
.skipair
```

The initial state is **off**. Run the command once to enable it and again to disable it. The bot privately confirms the new state. No selection or edit permission is required to change the setting.

## When to use it

A rectangular selection can contain empty space around a nonrectangular structure. With skip-air enabled, copied air is not placed, preserving destination blocks on those tiles and layers.

```text
.skipair
.paste 3 1
```

With a completed selection, this repeats the structure three times without placing its air blocks. The current [mask](./mask.md) still determines which block layers are eligible.

## Interactions with other commands

Skip-air applies to blue-coin pastes, [`.paste`](./paste.md), [`.smartpaste`](./smartpaste.md), and imported blocks. It does not affect zones, labels, [`.edit`](./edit.md), [`.flip`](./flip.md), [snake placements](./snake.md), or source clearing in [move mode](./move.md).

For a full [`.import`](./import.md), enabling skip-air prevents imported air from clearing existing blocks, but labels and zones are still replaced.
