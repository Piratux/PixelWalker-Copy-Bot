import { MissingBlockInfo } from '@/webtool/eelvl/type/MissingBlockInfo.ts'
import { DeserialisedStructure, ILabel } from 'pw-js-world'

export interface EelvlImportResult {
  blocks: DeserialisedStructure
  labels: ILabel[]
  missingBlocks: MissingBlockInfo[]
}
