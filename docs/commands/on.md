# .on

Resume handling **your** gold and blue coins after [`.off`](./off.md).

## Syntax and example

```text
.on
```

No selection or edit permission is required. The initial state of coin handling is **on**. The bot confirms that coin handling is on, or reports that it was already on. This is not a toggle; repeated invocations leave it on.

Your previous selection and mode settings are retained. If snake mode was enabled before `.off`, blue coins will place time doors again; use [`.snake off`](./snake.md) to return to pasting.

Only newly placed coins trigger handling; coins placed while off are not retroactively processed. Both you and the bot need edit permission to select or paste blocks with coins.
