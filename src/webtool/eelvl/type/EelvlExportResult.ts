import { MissingBlockInfo } from '@/webtool/eelvl/type/MissingBlockInfo.ts'

export interface EelvlExportResult {
  byteBuffer: Buffer
  fileName: string
  missingBlocks: MissingBlockInfo[]
}
