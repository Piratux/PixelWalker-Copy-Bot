# .snake

Use blue coins to place time doors with progressively changing offsets, instead of pasting a selection.

Both you and the bot need edit permission. No selection is required.

## Syntax

```text
.snake on time offset hideclock
.snake off
```

| Argument    | Meaning                                                                  |
| ----------- | ------------------------------------------------------------------------ |
| `time`      | Time-door time parameter in seconds; must be at least `0.5`              |
| `offset`    | Initial offset in seconds; must be between `0` and `2 * time`, inclusive |
| `hideclock` | `on` hides the clock; use `off` to show it                               |

Use finite numeric times. All four arguments are needed when enabling the mode; `off` is used alone. The initial state is **off**.

## Example

```text
.snake on 2.3 3.1 on
```

Now place blue coins along the desired path. The bot replaces each blue coin with a foreground time door using time `2.3` seconds and a hidden clock. The first door has offset `3.1` seconds, then offsets decrease by **0.1 seconds per door**, wrapping around the door's cycle (here, `4.6` seconds).

```text
.snake off
```

Disabling the mode returns blue coins to normal copy/move behavior. Re-enabling with new parameters resets the next door's offset.

## Interactions with other commands

Snake mode takes priority over copy and move behavior for blue coins. The current [mask](./mask.md) and [skip-air setting](./skipair.md) do not apply. [`.off`](./off.md) still disables coin handling.

Avoid fill tools and large brushes: placing more than four blue coins at once may be ignored. Place coins one at a time for reliable results.
