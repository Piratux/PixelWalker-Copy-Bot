# Getting started

[PixelWalker Copy Bot](https://github.com/Piratux/PixelWalker-Copy-Bot) helps you build worlds faster. Open the [Copy Bot application](https://piratux.github.io/PixelWalker-Copy-Bot/) and connect it to the world you want to edit.

## Permissions and chat syntax

Both you and the bot need edit permission to select or paste blocks with coins and to run commands that change world blocks. [`.import`](../commands/import.md) additionally requires you to be the current world's owner.

Type commands in the world's chat with a leading period, for example `.ping`. Command names are case-insensitive. Arguments are separated by spaces; use the spelling shown in each example, especially lowercase mask modes. Square brackets in syntax mean optional arguments; do not type the brackets. Do not use quotes around arguments.

The selection, modes, and undo/redo history belong to **each player separately**. Turning your coin handling off does not turn it off for anyone else. Do not rely on these settings or history surviving a bot restart or reconnection.

## Select and paste

1. Place a **gold coin** at one corner of the rectangle to copy.
2. Place another **gold coin** at the opposite corner. Both corners are included.
3. Place a **blue coin** where you want the copy.

The blue coin corresponds to the **first gold coin's position**, not necessarily the top-left corner. Selecting from top-left to bottom-right is the easiest way to make the paste extend right and down.

The bot restores the blocks underneath the marker coins. Place gold coins one at a time; placing several at once may not select an area. Avoid fill tools and large brushes: placing more than four blue coins at once may be ignored. Place coins one at a time for reliable results.

After pasting, your selection remains available for more blue-coin pastes. The next gold coin starts a new selection. Select again after changing the world manually if you want to copy those changes.

## What gets copied?

By default, all three block layers (**background, foreground, overlay**) are copied, including air. A copied air block clears the corresponding destination block. Use [`.skipair`](../commands/skipair.md) to preserve destination blocks under empty parts of your selection.

Labels are included when their **anchor position is inside the selected tiles**, even if some of the text extends outside. Text, styling, render layer, and the anchor's position within its tile are preserved. Labels whose pasted anchors would be outside the world are skipped.

Commands are not blocked while labels are being placed. For reliable results, let placement finish before moving or undoing newly placed labels, and avoid editing labels manually during placement.

Zones are included only when **every tile belonging to the zone is inside your selection**. Partially enclosed zones are not copied. Use [`.mask`](../commands/mask.md) to restrict the layers, labels or zones pasted; `.mask label` copies only labels.

## Try a repeated build

Select a small structure, then type:

```text
.paste 3 2 1 1
```

The command acts **immediately at the selection's original location**. No blue coin is required. It repeats your selection in three columns and two rows, with one empty tile of spacing between copies on each axis. See [`.paste`](../commands/paste.md) for direction and spacing details.

## Defaults and useful controls

| Setting                    | Initial state | Command                                                   |
| -------------------------- | ------------- | --------------------------------------------------------- |
| Coin handling              | On            | [`.off`](../commands/off.md) / [`.on`](../commands/on.md) |
| Layer, label and zone mask | All enabled   | [`.mask`](../commands/mask.md)                            |
| Skip air                   | Off           | [`.skipair`](../commands/skipair.md)                      |
| Move mode                  | Off           | [`.move`](../commands/move.md)                            |
| Snake mode                 | Off           | [`.snake`](../commands/snake.md)                          |

Use [`.help`](../commands/help.md) for in-game help.

Block, label and zone changes from coin pastes are recorded together for [`.undo`](../commands/undo.md). See [undo coverage](../commands/undo.md#coverage) for other actions and [undo limitations](../commands/undo.md#important-limits) before relying on history. Undo is not a world backup.

## Report issues

Found a problem? Choose **Report issues** in the app's navigation or [report it on GitHub](https://github.com/Piratux/PixelWalker-Copy-Bot/issues). Check existing issues first, then include steps to reproduce the problem, expected and actual behavior, and any relevant screenshots or error messages. Do not share passwords, access tokens, or other private information.
