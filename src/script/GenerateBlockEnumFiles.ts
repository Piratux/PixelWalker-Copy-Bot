import { writeFile } from 'fs/promises'
import { EELVL_BLOCKS } from '../eelvl/EelvlBlocks.ts'
import { ListBlockResult } from 'pw-js-api'
import { EER_BLOCKS } from '@/eer/EerBlocks.ts'

await generateBlockEnumFiles()

async function generateBlockEnumFiles() {
  await generatePwBlockNameEnum()
  await generateEelvlBlockIdEnum()
  await generateEerBlockIdEnum()
}

async function generatePwBlockNameEnum() {
  const blocks: ListBlockResult[] = await fetch('https://game.pixelwalker.net/listblocks').then((res) => res.json())
  const blocksSorted = blocks.sort((a, b) => a.Id - b.Id)

  let tsOutput = 'export enum PwBlockName {\r\n'

  for (let i = 0, len = blocksSorted.length; i < len; i++) {
    tsOutput += `  ${blocksSorted[i].PaletteId.toUpperCase()} = '${blocksSorted[i].PaletteId.toUpperCase()}',\r\n`
  }

  tsOutput += '}\r\n\r\nexport type PwBlockNameKeys = keyof typeof PwBlockName\r\n'

  await writeFile('./src/gen/PwBlockName.ts', tsOutput)
}

async function generateEelvlBlockIdEnum() {
  const blocks = EELVL_BLOCKS

  let tsOutput = 'export enum EelvlBlockId {\r\n'

  for (let i = 0, len = blocks.length; i < len; i++) {
    tsOutput += `  ${blocks[i].name} = ${blocks[i].id},\r\n`
  }

  tsOutput += '}\n\nexport type EelvlBlockIdKeys = keyof typeof EelvlBlockId\r\n'

  await writeFile('./src/gen/EelvlBlockId.ts', tsOutput)
}

async function generateEerBlockIdEnum() {
  const blocks = EER_BLOCKS

  let tsOutput = 'export enum EerBlockId {\r\n'

  for (let i = 0, len = blocks.length; i < len; i++) {
    tsOutput += `  ${blocks[i].name} = ${blocks[i].id},\r\n`
  }

  tsOutput += '}\n\nexport type EerBlockIdKeys = keyof typeof EerBlockId\r\n'

  await writeFile('./src/gen/EerBlockId.ts', tsOutput)
}
