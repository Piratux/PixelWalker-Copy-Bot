import { CopyBotData } from '@/bot/copybot/type/CopyBotData.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { WorldZone } from '@/core/type/WorldZone.ts'
import { getBlockAt, placeMultipleBlocks } from '@/core/service/WorldService.ts'
import { sendPrivateChatMessage } from '@/core/service/ChatMessageService.ts'

const MAX_UNDO_REDO_STACK_LENGTH = 100

export function addUndoItemBlock(botData: CopyBotData, newBlocks: WorldBlock[]) {
  botData.redoStack = []
  if (botData.undoStack.length >= MAX_UNDO_REDO_STACK_LENGTH) {
    botData.undoStack.shift()
  }
  botData.undoStack.push({
    newBlocks,
    oldBlocks: getOldBlocks(newBlocks),
  })
}

export function addUndoItemZone(botData: CopyBotData, newZones: WorldZone[]) {
  botData.redoZoneStack = []
  if (botData.undoZoneStack.length >= MAX_UNDO_REDO_STACK_LENGTH) {
    botData.undoZoneStack.shift()
  }
  botData.undoZoneStack.push({
    newZones,
    oldZones: [],
  })
}

// TODO: this could be improved by smartly merging blocks as opposed to doing undo one by one
export function performUndoBlocks(botData: CopyBotData, count: number) {
  let i = 0
  for (; i < count; i++) {
    const undoRedoItem = botData.undoStack.pop()
    if (undoRedoItem === undefined) {
      break
    }
    botData.redoStack.push(undoRedoItem)
    void placeMultipleBlocks(undoRedoItem.oldBlocks)
  }
  return i
}

// TODO: this could be improved by smartly merging blocks as opposed to doing redo one by one
export function performRedoBlocks(botData: CopyBotData, count: number) {
  let i = 0
  for (; i < count; i++) {
    const undoRedoItem = botData.redoStack.pop()
    if (undoRedoItem === undefined) {
      break
    }
    botData.undoStack.push(undoRedoItem)
    void placeMultipleBlocks(undoRedoItem.newBlocks)
  }
  return i
}

export function performUndoZones(botData: CopyBotData, count: number) {
  let i = 0
  for (; i < count; i++) {
    const undoRedoItem = botData.undoZoneStack.pop()
    if (undoRedoItem === undefined) {
      break
    }
    // applyZones(undoRedoItem.oldZones, undoRedoItem.newZones)
    botData.redoZoneStack.push(undoRedoItem)
  }
  return i
}

export function performRedoZones(botData: CopyBotData, count: number) {
  let i = 0
  for (; i < count; i++) {
    const undoRedoItem = botData.redoZoneStack.pop()
    if (undoRedoItem === undefined) {
      break
    }
    // applyZones(undoRedoItem.newZones, undoRedoItem.oldZones)
    botData.undoZoneStack.push(undoRedoItem)
  }
  return i
}

function getOldBlocks(newBlocks: WorldBlock[]): WorldBlock[] {
  return newBlocks.map((newBlock) => ({
    block: getBlockAt(newBlock.pos, newBlock.layer),
    layer: newBlock.layer,
    pos: newBlock.pos,
  }))
}

// function applyZones(targetZones: WorldZone[], previousZones: WorldZone[]) {
//   if (targetZones.length === 0 && previousZones.length === 0) {
//     return
//   }
//
//   const previousZoneKeys = new Set(previousZones.map(getZoneKey))
//   const targetZoneKeys = new Set(targetZones.map(getZoneKey))
//
//   for (const previousZone of previousZones) {
//     if (targetZoneKeys.has(getZoneKey(previousZone))) {
//       continue
//     }
//
//     deleteZone(previousZone)
//   }
//
//   for (const targetZone of targetZones) {
//     const zoneKey = getZoneKey(targetZone)
//     const existingZone = previousZoneKeys.has(zoneKey) ? findExistingZone(targetZone) : undefined
//     if (existingZone === undefined) {
//       createZone(targetZone)
//       continue
//     }
//
//     upsertZone(existingZone.id, targetZone)
//   }
// }

// function createZone(worldZone: WorldZone) {
//   const queuedZone = cloneDeep(worldZone)
//   useZoneStore().zonePasteQueue.set(queuedZone.zone.name, queuedZone)
//
//   // @ts-expect-error TODO: fix this when protocol is updated and marked as optional
//   queuedZone.zone.id = undefined
//
//   getPwGameClient().send('worldZoneUpsertRequestPacket', {
//     zone: queuedZone.zone.toJSON(),
//   })
// }
//
// function deleteZone(worldZone: WorldZone) {
//   const helperZone = waitForZone(worldZone)
//   if (helperZone === undefined) {
//     return
//   }
//
//   getPwGameClient().send('worldZoneDeleteRequestPacket', {
//     id: helperZone.id,
//   })
// }
//
// function upsertZone(zoneId: string, worldZone: WorldZone) {
//   const targetZone = cloneDeep(worldZone)
//   targetZone.zone.id = zoneId
//
//   getPwGameClient().send('worldZoneUpsertRequestPacket', {
//     zone: targetZone.zone.toJSON(),
//   })
//
//   const currentZone = waitForZone({ zone: targetZone.zone })
//   if (currentZone === undefined) {
//     return
//   }
//
//   const currentPositions = new Set(currentZone.membershipRle.toPositions().map((pos) => `${pos.x},${pos.y}`))
//   const targetPositions = new Set(targetZone.zone.membershipRle.toPositions().map((pos) => `${pos.x},${pos.y}`))
//
//   for (const posKey of currentPositions) {
//     if (targetPositions.has(posKey)) {
//       continue
//     }
//
//     const [x, y] = posKey.split(',').map(Number)
//     getPwGameClient().send('worldZoneAreaEditRequestPacket', {
//       zoneId,
//       x,
//       y,
//       width: 1,
//       height: 1,
//       add: false,
//     })
//   }
//
//   for (const posKey of targetPositions) {
//     if (currentPositions.has(posKey)) {
//       continue
//     }
//
//     const [x, y] = posKey.split(',').map(Number)
//     getPwGameClient().send('worldZoneAreaEditRequestPacket', {
//       zoneId,
//       x,
//       y,
//       width: 1,
//       height: 1,
//       add: true,
//     })
//   }
// }
//
// async function findExistingZone(worldZone: WorldZone) {
//   const zoneById = getZoneById(worldZone.zone.id)
//   if (zoneById !== undefined) {
//     return zoneById
//   }
//
//   return waitForZone(worldZone, 250)
// }
//
// function getZoneById(zoneId: string | undefined) {
//   if (zoneId === undefined || zoneId === '') {
//     return undefined
//   }
//
//   return getPwGameWorldHelper().zones.get(zoneId)
// }
//
// function waitForZone(worldZone: WorldZone, timeoutMs = 2000) {
//   const endTime = Date.now() + timeoutMs
//   while (Date.now() <= endTime) {
//     const zone = findZoneInHelper(worldZone)
//     if (zone !== undefined) {
//       return zone
//     }
//
//     await sleep(25)
//   }
//
//   return undefined
// }
//
// function findZoneInHelper(worldZone: WorldZone) {
//   const zoneById = getZoneById(worldZone.zone.id)
//   if (zoneById !== undefined) {
//     return zoneById
//   }
//
//   for (const zone of getPwGameWorldHelper().zones.values()) {
//     if (zone.name === worldZone.zone.name) {
//       return zone
//     }
//   }
//
//   return undefined
// }
//
// function getZoneKey(worldZone: WorldZone) {
//   return worldZone.zone.id !== undefined && worldZone.zone.id !== ''
//     ? `id:${worldZone.zone.id}`
//     : `name:${worldZone.zone.name}`
// }

export function performUndo(botData: CopyBotData, playerId: number, count: number) {
  const blockUndoCount = performUndoBlocks(botData, count)
  const zoneUndoCount = performUndoZones(botData, count)
  sendPrivateChatMessage(`Undo performed ${blockUndoCount} block time(s) and ${zoneUndoCount} zone time(s).`, playerId)
}

export function performRedo(botData: CopyBotData, playerId: number, count: number) {
  const blockRedoCount = performRedoBlocks(botData, count)
  const zoneRedoCount = performRedoZones(botData, count)
  sendPrivateChatMessage(`Redo performed ${blockRedoCount} block time(s) and ${zoneRedoCount} zone time(s).`, playerId)
}
