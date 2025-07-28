'use strict'

export { default as PlayerIOClient } from './client.ts'
export { default as Message } from './message.ts'
export { default as HTTPChannel } from './channel.ts'
export { default as Connection } from './connection.ts'
export { default as QuickConnect } from './quickconnect.ts'
export * as Constants from './constants.ts'

export { default as PlayerIOError } from './error.ts'

// services
import { default as Achievements } from './services/achievements.ts'
import { default as BigDB } from './services/bigdb.ts'
import { default as GameFS } from './services/gamefs.ts'
import { default as Multiplayer } from './services/multiplayer.ts'
import { default as PayVault } from './services/payvault.ts'

export const Services = {
  Achievements,
  BigDB,
  GameFS,
  Multiplayer,
  PayVault,
}

export * as Utilities from './utilities/util.ts'
export * as MessageSerializer from './utilities/messageserialiser.ts'

export { default as ByteArray, Endian } from './structures/ByteArray.ts'
