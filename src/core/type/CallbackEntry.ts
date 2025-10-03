import type { WorldEventNames } from 'pw-js-api'
import { Promisable } from '@/core/util/Promise.ts'

export interface CallbackEntry {
  name: WorldEventNames
  // we disable any here because there is no reasonable way to represent the generic packet arguments that properly interfaces with pw-js-api
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (...args: any) => Promisable<void | 'STOP'>
}
