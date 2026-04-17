import { Colour, Colours } from '@/core/type/Colour.ts'
import { getPwGameClient, getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { vec2 } from '@basementuniverse/vec'
import { colourToUint32 } from '@/core/util/Colours.ts'
import { TextAlignment } from 'pw-js-world'
import { LABEL_GLYPH_MAP } from '@/core/type/LabelGlyphMap.ts'

export interface LabelData {
  text: string
  colour: Colour
}

// Automatically adds spaces between labels, so you can just pass in an array of strings or LabelData and it will handle the spacing for you
export function placeLabels(pos: vec2, labelData: (string | LabelData)[]) {
  const placePos = vec2(pos.x, pos.y)
  for (let i = 0; i < labelData.length; i++) {
    const labelEntry = labelData[i]
    let text: string
    let colour: Colour
    if (typeof labelEntry === 'string') {
      text = labelEntry
      colour = Colours.WHITE
    } else {
      text = labelEntry.text
      colour = labelEntry.colour
    }

    if (i !== 0) {
      text = ' ' + text
    }

    getPwGameClient().send('worldLabelUpsertRequestPacket', {
      // @ts-expect-error TODO: remove this as id should be optional
      label: {
        position: placePos,
        text: text,
        color: colourToUint32(colour),
        maxWidth: -1,
        shadow: true,
        textAlignment: TextAlignment.CENTER,
        fontSize: 12,
        characterSpacing: 0,
        lineSpacing: 3,
        renderLayer: 1,
        shadowColor: colourToUint32({ r: 0, g: 0, b: 0, a: 153 }),
        shadowOffsetX: 1,
        shadowOffsetY: 1,
      },
    })

    for (const char of text) {
      placePos.x += LABEL_GLYPH_MAP.get(char)?.advance ?? 10
    }
  }
}

export function removeAllLabels() {
  for (const labelId of getPwGameWorldHelper().labels.keys()) {
    getPwGameClient().send('worldLabelDeleteRequestPacket', {
      id: labelId,
    })
  }
}
