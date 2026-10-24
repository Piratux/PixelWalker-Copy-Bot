# Public command reference

These are the **15 public chat commands** implemented by Copy Bot. Start with the [selection guide](../guide/getting-started.md) if you have not used the gold/blue coin workflow.

`[argument]` means optional. `x` and `y` refer to horizontal and vertical tile coordinates, respectively.

Wait for placement to finish before sending another command. Each command clears pending placement work from previous commands, which can interrupt unfinished zone placement. Blocks and zones already placed are not removed.

| Command                          | Syntax                                                                                          | Purpose                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------- |
| [`.help`](./help.md)             | `.help [command]`                                                                               | General help or help for one command          |
| [`.ping`](./ping.md)             | `.ping`                                                                                         | Check whether the bot responds                |
| [`.paste`](./paste.md)           | `.paste x_times y_times [x_spacing y_spacing]`                                                  | Repeat the selection immediately              |
| [`.smartpaste`](./smartpaste.md) | `.smartpaste x_times y_times [x_spacing y_spacing]`                                             | Repeat with patterned block arguments         |
| [`.edit`](./edit.md)             | `.edit name find replace`, `.edit id find_id replace_id`, or `.edit math_op number [name_find]` | Replace blocks or edit numeric arguments      |
| [`.flip`](./flip.md)             | `.flip h` or `.flip v`                                                                          | Mirror selected block positions               |
| [`.move`](./move.md)             | `.move`                                                                                         | Toggle moving instead of copying              |
| [`.mask`](./mask.md)             | `.mask mode [mode ...]`                                                                         | Choose block layers and/or zones              |
| [`.skipair`](./skipair.md)       | `.skipair`                                                                                      | Toggle ignoring copied air                    |
| [`.snake`](./snake.md)           | `.snake off` or `.snake on time offset hideclock`                                               | Place time doors with stepping offsets        |
| [`.undo`](./undo.md)             | `.undo [count]`                                                                                 | Restore recorded block and zone changes       |
| [`.redo`](./redo.md)             | `.redo [count]`                                                                                 | Reapply undone changes                        |
| [`.import`](./import.md)         | `.import world_id [src_from_x src_from_y src_to_x src_to_y dest_to_x dest_to_y]`                | Import a whole world or rectangle; owner-only |
| [`.off`](./off.md)               | `.off`                                                                                          | Ignore your marker coins                      |
| [`.on`](./on.md)                 | `.on`                                                                                           | Resume handling your marker coins             |
