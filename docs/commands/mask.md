# .mask

Choose the block layers and/or zones included in pasting.

## Syntax

```text
.mask mode [mode ...]
```

At least one lowercase mode is required:

| Mode         | Includes                             |
| ------------ | ------------------------------------ |
| `background` | Background blocks                    |
| `foreground` | Foreground blocks                    |
| `overlay`    | Overlay blocks                       |
| `zone`       | Fully selected zones                 |
| `default`    | All three block layers **and zones** |

Each command **replaces** the previous mask. It is not a toggle and does not add to the old mask. Initially, **all three block layers and zones are enabled**. No selection or edit permission is required to change the setting.

## Examples

```text
.mask foreground
.mask foreground background
.mask overlay zone
.mask zone
.mask default
```

`.mask zone` pastes zones without copying block layers. `.mask default` enables all three block layers and zones.

## Interactions with other commands

The mask filters blue-coin pastes, [`.paste`](./paste.md), [`.smartpaste`](./smartpaste.md), and source clearing in [move mode](./move.md). It filters imported **blocks**, too.

The mask does not apply to [`.edit`](./edit.md), [`.flip`](./flip.md), or [snake placements](./snake.md). A full [`.import`](./import.md) replaces labels and zones regardless of the zone mask.

Air is still copied on enabled layers unless [`.skipair`](./skipair.md) is enabled.
