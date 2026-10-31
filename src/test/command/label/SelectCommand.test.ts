import { describe, test } from 'vitest'
import { vec2 } from '@basementuniverse/vec'
import { compareLabelData, runSelectLabelCommandTest } from '@/test/RuntimeTestsUtil.ts'
import { createLabel } from '@/core/util/Labels.ts'

describe('Selection (labels)', { concurrent: false }, () => {
  test.each([
    { from: vec2(1, 2), to: vec2(2, 3) },
    { from: vec2(2, 2), to: vec2(1, 3) },
    { from: vec2(1, 3), to: vec2(2, 2) },
    { from: vec2(2, 3), to: vec2(1, 2) },
  ])('Selects anchors within tile boundaries from $from to $to', async ({ from, to }) => {
    const selectedLabels = [
      createLabel({ position: vec2(16, 32), text: 'Top left' }),
      createLabel({ position: vec2(47, 63), text: 'Bottom right' }),
    ]
    const inputLabels = [
      ...selectedLabels,
      createLabel({ position: vec2(15, 32), text: 'Left' }),
      createLabel({ position: vec2(16, 31), text: 'Above' }),
      createLabel({ position: vec2(48, 32), text: 'Right' }),
      createLabel({ position: vec2(16, 64), text: 'Below' }),
    ]
    await runSelectLabelCommandTest(inputLabels, inputLabels, from, to, (botData) => {
      compareLabelData(botData.selectedLabels, selectedLabels)
    })
  })

  test('Selecting an area without labels produces an empty selection', async () => {
    const label = createLabel({ position: vec2(80, 80), text: 'Unselected' })
    await runSelectLabelCommandTest([label], [label], vec2(0, 0), vec2(0, 0), (botData) => {
      compareLabelData(botData.selectedLabels, [])
    })
  })
})
