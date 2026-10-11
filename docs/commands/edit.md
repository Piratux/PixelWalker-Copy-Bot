# .edit

Change selected blocks by name, ID, or numeric arguments.

Both you and the bot need edit permission. Complete a two-gold-coin selection first.

Edits update both the **copied selection** and the blocks at its **original world location immediately**. Later blue-coin pastes use the edited selection. These operations affect blocks, not zones.

The current [mask](./mask.md) and [skip-air setting](./skipair.md) do not apply.

## Replace by name

```text
.edit name find replace
```

Replace the first matching substring in each selected block's name. Matching is case-insensitive. A replacement is applied only when the resulting name identifies an existing block on the **same layer**; cross-layer changes are skipped with a warning.

```text
.edit name red blue
```

This changes names containing `RED` to their corresponding `BLUE` variants where those variants exist. Names used by this command may differ from palette labels. Existing arguments are retained.

## Replace by ID

```text
.edit id find_id replace_id
```

Use numeric PixelWalker block IDs. Both IDs must exist, must use the same layer, and must support the same block settings. The existing setting values are retained.

`find_id` cannot be `0` (air). You can use air as the replacement only for blocks with compatible settings.

```text
.edit id 12 13
```

This illustrates the syntax; verify that the chosen IDs exist and are compatible in the current PixelWalker block list.

## Edit numeric arguments

```text
.edit add number [name_find]
.edit sub number [name_find]
.edit mul number [name_find]
.edit div number [name_find]
```

Apply an operation to **every numeric argument** of matching selected blocks. `name_find` optionally restricts the edit to block names containing that substring, case-insensitively. Without it, every selected block is considered. Text and on/off settings are unchanged.

| Operation | Calculation             | Restriction                      |
| --------- | ----------------------- | -------------------------------- |
| `add`     | Current value + number  | Use a valid numeric amount       |
| `sub`     | Current value - number  | Use a valid numeric amount       |
| `mul`     | Current value \* number | Number must not be negative      |
| `div`     | Current value / number  | Number must be greater than zero |

Results are rounded down to whole numbers, including negative results.

```text
.edit add 1 switch
.edit sub 2 switch
.edit mul 2
.edit div 2
```

::: warning All numeric fields are affected
There is no field-name selector. A block with multiple numeric arguments has all of them changed, including numeric color values or time-door parameters. Results are not automatically clamped to each block field's valid range. Use a narrow name filter and check the result.
:::
