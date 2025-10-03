import { DeserialisedStructure, StructureHelper } from 'pw-js-world'
import { placeWorldDataBlocks } from '@/service/WorldService.ts'
import { getPwGameWorldHelper } from '@/store/PwClientStore.ts'
import { createEmptyBlocks, handlePlaceBlocksResult, requireBotEditPermission } from '@/service/PwClientService.ts'

export function getImportedFromPwlvlData(fileData: ArrayBuffer): DeserialisedStructure {
  const blocks = createEmptyBlocks(getPwGameWorldHelper())
  const importedBlocks = StructureHelper.read(Buffer.from(fileData))
  const layersInImportedBlocks = importedBlocks.blocks.length
  const width = Math.min(getPwGameWorldHelper().width, importedBlocks.width)
  const height = Math.min(getPwGameWorldHelper().height, importedBlocks.height)
  for (let layer = 0; layer < layersInImportedBlocks; layer++) {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        blocks.blocks[layer][x][y] = importedBlocks.blocks[layer][x][y]
      }
    }
  }

  return blocks
}

export async function importFromPwlvl(fileData: ArrayBuffer): Promise<void> {
  requireBotEditPermission(getPwGameWorldHelper())

  const worldData = getImportedFromPwlvlData(fileData)
  const success = await placeWorldDataBlocks(worldData)
  handlePlaceBlocksResult(success)
}
