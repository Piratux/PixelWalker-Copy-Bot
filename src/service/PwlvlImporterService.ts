import { DeserialisedStructure, StructureHelper } from 'pw-js-world'
import { vec2 } from '@basementuniverse/vec'
import { placeWorldDataBlocks } from '@/service/WorldService.ts'
import { getPwGameWorldHelper } from '@/store/PwClientStore.ts'
import { sendGlobalChatMessage } from '@/service/ChatMessageService.ts'
import { pwCheckEditWhenImporting, pwCreateEmptyBlocks } from '@/service/PwClientService.ts'
import { MessageService } from '@/service/MessageService.ts'

export function getImportedFromPwlvlData(fileData: ArrayBuffer): DeserialisedStructure {
  const blocks = pwCreateEmptyBlocks(getPwGameWorldHelper())
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
  if (!pwCheckEditWhenImporting(getPwGameWorldHelper())) {
    return
  }

  const worldData = getImportedFromPwlvlData(fileData)

  const success = await placeWorldDataBlocks(worldData, vec2(0, 0))
  let message: string
  if (success) {
    message = 'Finished importing world.'
    sendGlobalChatMessage(message)
    MessageService.success(message)
  } else {
    message = 'ERROR! Failed to import world.'
    sendGlobalChatMessage(message)
    MessageService.error(message)
  }
}
