import { MissingBlockInfo } from '@/eelvl/type/MissingBlockInfo.ts'

export interface EelvlExportResult {
  byteBuffer: Buffer
  fileName: string
  missingBlocks: MissingBlockInfo[]
}
