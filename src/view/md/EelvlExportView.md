## Export info

EELVL is a file format that was used by Everybody Edits (EE).

Here you can export EE worlds from PixelWalker to `.eelvl` file and open it in Everybody Edits: Offline (EEO) client.

## Differences

Compared with PixelWalker, EELVL doesn't have:

- Climbable horizontal chains and rope
- Local/global switch activator block. EELVL has a limited equivalent that always sets switch state to off. If switch activator is set to off, it is replaced with EELVL equivalent. If switch activator is set to on, it is replaced with a normal sign containing switch ID and on/off value.
- Local/global switch resetter block
- Multiple notes per music block. In EELVL it is limited to 1. If there is 1 note, it is replaced with note. Otherwise, replaced with text sign containing notes.
- Cyan and magenta spikes
- Generic yellow face smile/frown block
- All 4 rotation variants of corner decorations. Usually it has just 2 rotation variants (like snow, web, beach sand, etc.)
- Green sign
- Purple mineral block
- Plate with cake chocolate and pie cherry
- A use for world portal. There is no way to enter PixelWalker world ID and then open browser to join it. So it is always replaced with world ID pointing to "Current" with ID 1.
- A use for world portal spawn. Same as world portal, so ID is always replaced with 1.
- Hex backgrounds
- Counter blocks
- Orange, yellow, cyan and purple canvas foreground blocks
- Bronze and silver colors of gilded block pack
- Multiple layers: water, fog and some decorations are placed on overlay layer. If there are blocks in overlay and foreground layer, blocks in overlay layer are not exported.
- Strings in portal ID and portal target ID
- Strings in world portal spawn point ID and world portal spawn point target ID
- White and black crystal
- 1px and 2px outlines
- Red, blue and black outerspace decorations that also act as signs
- Configurable time doors
- Configurable fireworks
- Arrow signs
- Highly customizable labels
- Weak boosts
- Curse/poison door/gates

All missing blocks are replaced with sign (except for backgrounds). Labels aren't exported as they can be placed off-grid in PixelWalker.

Fun fact: signs only let you enter 140 characters in EEO. But it accepts EELVL files with signs longer than 140 characters and correctly shows them in game.
