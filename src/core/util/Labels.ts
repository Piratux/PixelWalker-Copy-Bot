import { vec2 } from '@basementuniverse/vec'
import { ILabel, LayerType, TextAlignment } from 'pw-js-world'
import { Colours } from '@/core/type/Colour.ts'
import { colourToUint32 } from '@/core/util/Colours.ts'

export function createLabel(overrides: Partial<ILabel> = {}): ILabel {
  return {
    position: vec2(0, 0),
    text: '',
    color: colourToUint32(Colours.WHITE),
    maxWidth: -1,
    shadow: true,
    textAlignment: TextAlignment.CENTER,
    fontSize: 12,
    characterSpacing: 0,
    lineSpacing: 3,
    renderLayer: LayerType.Foreground,
    shadowColor: colourToUint32({ r: 0, g: 0, b: 0, a: 153 }),
    shadowOffsetX: 1,
    shadowOffsetY: 1,
    outline: false,
    outlineColor: colourToUint32({ r: 0, g: 0, b: 0, a: 255 }),
    outlineWidth: 1,
    ...overrides,
  }
}
