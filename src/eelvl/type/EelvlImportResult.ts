import { MissingBlockInfo } from '@/eelvl/type/MissingBlockInfo.ts'
import { DeserialisedStructure } from 'pw-js-world'

export interface EelvlImportResult {
  blocks: DeserialisedStructure
  missingBlocks: MissingBlockInfo[]
}
