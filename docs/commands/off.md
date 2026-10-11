# .off

Make the bot ignore **your** gold and blue coins.

## Syntax and example

```text
.off
```

No selection or edit permission is required. The initial state of coin handling is **on**. The bot confirms that coin handling is off, or reports that it was already off. This is not a toggle; repeated invocations leave it off.

While off, you can place gold and blue coins as ordinary world blocks without the bot restoring them or triggering selection, copy/move, or snake placement.

This setting is per player. It does not disconnect the bot, affect other players, clear your selection/modes, or disable chat commands: `.paste`, `.edit`, and other commands can still modify the world.

Use [`.on`](./on.md) to resume coin handling.
