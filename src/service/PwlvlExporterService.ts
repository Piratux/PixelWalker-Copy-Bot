import { getPwGameWorldHelper, usePwClientStore } from '@/store/PwClientStore.ts'
import { downloadFile } from '@/service/FileService.ts'
import { EelvlFileHeader } from '@/type/EelvlFileHeader.ts'
import { getAllWorldBlocks } from '@/service/PwClientService.ts'

export function getExportedToPwlvlData(): [Buffer, string] {
  const worldMeta = getPwGameWorldHelper().meta!
  const world: EelvlFileHeader = {
    ownerName: worldMeta.owner ?? 'Unknown',
    name: worldMeta.title ?? 'Untitled world',
    width: getPwGameWorldHelper().width,
    height: getPwGameWorldHelper().height,
    gravMultiplier: 1,
    backgroundColor: 0,
    description: worldMeta.description ?? '',
    isCampaign: false,
    crewId: '',
    crewName: '',
    crewStatus: 0,
    minimapEnabled: worldMeta.minimapEnabled ?? true,
    ownerId: 'owner ID',
  }

  const worldData = getAllWorldBlocks(getPwGameWorldHelper())

  const worldId = usePwClientStore().worldId
  const fileName = `${world.name} - ${world.width}x${world.height} - ${worldId}.pwlvl`

  return [worldData.toBuffer(), fileName]
}

export function exportToPwlvl() {
  const [byteBuffer, fileName] = getExportedToPwlvlData()
  downloadFile(byteBuffer, fileName)
}
