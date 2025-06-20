import { getPwBlocks, getPwGameClient, getPwGameWorldHelper, usePWClientStore } from '@/store/PWClientStore.ts'
import { Block, ComponentTypeHeader, IPlayer, LayerType, Point, PWGameWorldHelper } from 'pw-js-world'
import { cloneDeep } from 'lodash-es'
import { BotData, createBotData } from '@/type/BotData.ts'
import { getPlayerBotData } from '@/store/BotStore.ts'
import { BotState } from '@/enum/BotState.ts'
import { WorldBlock } from '@/type/WorldBlock.ts'
import { sendGlobalChatMessage, sendPrivateChatMessage } from '@/service/ChatMessageService.ts'
import { vec2 } from '@basementuniverse/vec'
import {
  convertDeserializedStructureToWorldBlocks,
  getBlockAt,
  getBlockName,
  placeMultipleBlocks,
} from '@/service/WorldService.ts'
import { addUndoItemWorldBlock, performRedo, performUndo } from '@/service/UndoRedoService.ts'
import { PwBlockName } from '@/gen/PwBlockName.ts'
import { performRuntimeTests } from '@/test/RuntimeTests.ts'
import { ProtoGen, PWApiClient, PWGameClient } from 'pw-js-api'
import {
  getAllWorldBlocks,
  pwAuthenticate,
  pwCheckEdit,
  pwCreateEmptyBlocks,
  pwEnterEditKey,
  pwJoinWorld,
} from '@/service/PWClientService.ts'
import { getImportedFromPwlvlData } from '@/service/PwlvlImporterService.ts'
import { getWorldIdIfUrl } from '@/service/WorldIdExtractorService.ts'
import { handleException } from '@/util/Exception.ts'
import { GameError } from '@/class/GameError.ts'
import { TOTAL_PW_LAYERS } from '@/constant/General.ts'

export function registerCallbacks() {
  getPwGameClient()
    .addHook(getPwGameWorldHelper().receiveHook)
    .addCallback('debug', console.log)
    .addCallback('playerInitPacket', playerInitPacketReceived)
    .addCallback('worldBlockPlacedPacket', worldBlockPlacedPacketReceived)
    .addCallback('playerChatPacket', playerChatPacketReceived)
    .addCallback('playerJoinedPacket', playerJoinedPacketReceived)
}

function playerJoinedPacketReceived(data: ProtoGen.PlayerJoinedPacket) {
  const playerId = data.properties?.playerId
  if (!playerId) {
    return
  }
  if (!getPlayerBotData()[playerId]) {
    getPlayerBotData()[playerId] = createBotData()
  }
  sendPrivateChatMessage('Copy Bot is here! Type .help to show usage!', playerId)
}

async function playerChatPacketReceived(data: ProtoGen.PlayerChatPacket) {
  const args = data.message.split(' ')
  const playerId = data.playerId!

  switch (args[0].toLowerCase()) {
    case '.placeall':
      await placeallCommandReceived(args, playerId)
      break
    case '.ping':
      sendPrivateChatMessage('pong', playerId)
      break
    case '.help':
      helpCommandReceived(args, playerId)
      break
    case '.paste':
      pasteCommandReceived(args, playerId, false)
      break
    case '.smartpaste':
      pasteCommandReceived(args, playerId, true)
      break
    case '.undo':
      undoCommandReceived(args, playerId)
      break
    case '.redo':
      redoCommandReceived(args, playerId)
      break
    case '.move':
      moveCommandReceived(args, playerId)
      break
    case '.mask':
      maskCommandReceived(args, playerId)
      break
    case '.test':
      await testCommandReceived(args, playerId)
      break
    case '.import':
      await importCommandReceived(args, playerId)
      break
    default:
      if (args[0].startsWith('.')) {
        sendPrivateChatMessage('ERROR! Unrecognised command', playerId)
      }
  }
}

function maskCommandReceived(args: string[], playerId: number) {
  const botData = getPlayerBotData()[playerId]
  if (args.includes('all')) {
    botData.maskBackgroundEnabled = true
    botData.maskForegroundEnabled = true
    botData.maskOverlayEnabled = true
    sendPrivateChatMessage(`Mask all enabled`, playerId)
    return
  }

  botData.maskBackgroundEnabled = false
  botData.maskForegroundEnabled = false
  botData.maskOverlayEnabled = false

  if (args.includes('background')) {
    botData.maskBackgroundEnabled = true
    sendPrivateChatMessage(`Mask background enabled`, playerId)
  }

  if (args.includes('foreground')) {
    botData.maskForegroundEnabled = true
    sendPrivateChatMessage(`Mask foreground enabled`, playerId)
  }

  if (args.includes('overlay')) {
    botData.maskOverlayEnabled = true
    sendPrivateChatMessage(`Mask overlay enabled`, playerId)
  }

  if (!botData.maskBackgroundEnabled && !botData.maskForegroundEnabled && !botData.maskOverlayEnabled) {
    sendPrivateChatMessage(`ERROR! Correct usage is .mask [all | background | foreground | overlay]`, playerId)
  }
}

function moveCommandReceived(_args: string[], playerId: number) {
  const botData = getPlayerBotData()[playerId]
  botData.moveEnabled = true

  sendPrivateChatMessage(`Move mode enabled`, playerId)
}

async function placeallCommandReceived(_args: string[], playerId: number) {
  if (!pwCheckEdit(getPwGameWorldHelper(), playerId)) {
    return
  }

  if (getPwGameWorldHelper().getPlayer(playerId)?.username !== 'PIRATUX') {
    return
  }

  const sortedListBlocks = getPwBlocks()
  const worldBlocks = []
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x < 100; x++) {
      const idx = y * 100 + x
      if (idx >= sortedListBlocks.length) {
        const success = await placeMultipleBlocks(worldBlocks)
        if (success) {
          sendPrivateChatMessage('Succesfully placed all blocks', playerId)
        } else {
          sendPrivateChatMessage('ERROR! Failed to place all blocks', playerId)
        }

        return
      }
      const singleBlock = sortedListBlocks[idx]
      const pos = vec2(x, y)
      let worldBlock: WorldBlock
      if ((singleBlock.PaletteId as PwBlockName) === PwBlockName.PORTAL_WORLD) {
        worldBlock = {
          block: new Block(singleBlock.Id, ['ewki341n7ve153l', 0]),
          layer: singleBlock.Layer,
          pos,
        }
      } else {
        worldBlock = { block: new Block(singleBlock.Id), layer: singleBlock.Layer, pos }
      }
      worldBlocks.push(worldBlock)
      for (let layer = 0; layer < TOTAL_PW_LAYERS; layer++) {
        if (layer !== singleBlock.Layer) {
          worldBlocks.push({ block: new Block(0), layer, pos })
        }
      }
    }
  }
}

async function importCommandReceived(args: string[], playerId: number) {
  if (
    getPwGameWorldHelper().getPlayer(playerId)?.username !== 'PIRATUX' &&
    getPwGameWorldHelper().getPlayer(playerId)?.isWorldOwner !== true
  ) {
    sendPrivateChatMessage('ERROR! Command is exclusive to world owners', playerId)
    return
  }

  if (!pwCheckEdit(getPwGameWorldHelper(), playerId)) {
    return
  }

  const ERROR_MESSAGE =
    'ERROR! Correct usage is .import world_id [src_from_x src_from_y src_to_x src_to_y dest_to_x dest_to_y]'

  if (![2, 8].includes(args.length)) {
    sendPrivateChatMessage(ERROR_MESSAGE, playerId)
    return
  }

  const partialImportUsed = args.length === 8
  let srcFromX = 0
  let srcFromY = 0
  let srcToX = 0
  let srcToY = 0
  let destToX = 0
  let destToY = 0
  if (partialImportUsed) {
    srcFromX = Number(args[2])
    srcFromY = Number(args[3])
    srcToX = Number(args[4])
    srcToY = Number(args[5])
    destToX = Number(args[6])
    destToY = Number(args[7])

    if (
      !isFinite(srcFromX) ||
      !isFinite(srcFromY) ||
      !isFinite(srcToX) ||
      !isFinite(srcToY) ||
      !isFinite(destToX) ||
      !isFinite(destToY)
    ) {
      sendPrivateChatMessage(ERROR_MESSAGE, playerId)
      return
    }

    const mapWidth = getPwGameWorldHelper().width
    const mapHeight = getPwGameWorldHelper().height
    const pasteSizeX = srcToX - srcFromX + 1
    const pasteSizeY = srcToY - srcFromY + 1
    if (destToX < 0 || destToY < 0 || destToX + pasteSizeX > mapWidth || destToY + pasteSizeY > mapHeight) {
      sendPrivateChatMessage(
        `ERROR! Pasted area would be placed at pos (${destToX}, ${destToY}) with size (${pasteSizeX}, ${pasteSizeY}), but that's outside world bounds`,
        playerId,
      )
      return
    }
  }

  const pwApiClient = new PWApiClient(usePWClientStore().email, usePWClientStore().password)

  try {
    await pwAuthenticate(pwApiClient)
  } catch (e) {
    handleException(e)
    return
  }

  const pwGameClient = new PWGameClient(pwApiClient)
  const pwGameWorldHelper = new PWGameWorldHelper()

  const worldId = getWorldIdIfUrl(args[1])

  pwGameClient.addHook(pwGameWorldHelper.receiveHook).addCallback('playerInitPacket', async () => {
    try {
      pwGameClient.send('playerInitReceived')

      const blocks = partialImportUsed
        ? pwGameWorldHelper.sectionBlocks(srcFromX, srcFromY, srcToX, srcToY)
        : getAllWorldBlocks(pwGameWorldHelper)

      sendGlobalChatMessage(`Importing world from ${worldId}`)

      const botData = getPlayerBotData()[playerId]

      let allBlocks: WorldBlock[]
      if (partialImportUsed) {
        allBlocks = convertDeserializedStructureToWorldBlocks(blocks)
      } else {
        const emptyBlocks = pwCreateEmptyBlocks(getPwGameWorldHelper())
        const worldData = getImportedFromPwlvlData(blocks.toBuffer())
        const emptyBlocksWorldBlocks = convertDeserializedStructureToWorldBlocks(emptyBlocks)
        const worldDataWorldBlocks = convertDeserializedStructureToWorldBlocks(worldData)
        allBlocks = mergeWorldBlocks(emptyBlocksWorldBlocks, worldDataWorldBlocks)
      }
      allBlocks = filterByLayerMasks(allBlocks, botData)

      addUndoItemWorldBlock(botData, allBlocks)

      const success = await placeMultipleBlocks(allBlocks)
      let message: string
      if (success) {
        message = 'Finished importing world.'
        sendGlobalChatMessage(message)
      } else {
        message = 'ERROR! Failed to import world.'
        sendGlobalChatMessage(message)
      }
    } catch (e) {
      handleException(e)
    } finally {
      pwGameClient.disconnect(false)
    }
  })

  try {
    await pwJoinWorld(pwGameClient, worldId)
  } catch (e) {
    handleException(e)
    return
  }
}

async function testCommandReceived(_args: string[], playerId: number) {
  if (getPwGameWorldHelper().getPlayer(playerId)?.username !== 'PIRATUX') {
    return
  }

  if (!pwCheckEdit(getPwGameWorldHelper(), playerId)) {
    return
  }

  if (getPwGameWorldHelper().width < 100 || getPwGameWorldHelper().height < 100) {
    sendPrivateChatMessage('ERROR! To perform tests, world must be at least 100x100 size.', playerId)
    return
  }

  await performRuntimeTests()
}

function helpCommandReceived(args: string[], playerId: number) {
  if (args.length == 1) {
    sendPrivateChatMessage('Gold coin - select blocks', playerId)
    sendPrivateChatMessage('Blue coin - paste blocks', playerId)
    sendPrivateChatMessage('Commands: .help .ping .paste .smartpaste .undo .redo .import .move .mask', playerId)
    sendPrivateChatMessage('See more info about each command via .help [command]', playerId)
    sendPrivateChatMessage('You can also use the bot: piratux.github.io/PixelWalker-Copy-Bot/', playerId)
    return
  }

  switch (args[1]) {
    case 'ping':
    case '.ping':
      sendPrivateChatMessage('.ping - check if bot is alive by pinging it.', playerId)
      sendPrivateChatMessage(`Example usage: .ping`, playerId)
      break
    case 'help':
    case '.help':
      sendPrivateChatMessage(
        '.help [command] - get general help, or if command is specified, get help about command.',
        playerId,
      )
      sendPrivateChatMessage(`Example usage: .help paste`, playerId)
      break
    case 'paste':
    case '.paste':
      sendPrivateChatMessage('.paste x_times y_times [x_spacing y_spacing] - repeat next paste (x/y)_times.', playerId)
      sendPrivateChatMessage('(x/y)_spacing - gap size to leave between pastes.', playerId)
      sendPrivateChatMessage(`Example usage 1: .paste 2 3`, playerId)
      sendPrivateChatMessage(`Example usage 2: .paste 2 3 4 1`, playerId)
      break
    case 'smartpaste':
    case '.smartpaste':
      sendPrivateChatMessage(
        '.smartpaste - same as .paste, but increments special block arguments, when using repeated paste.',
        playerId,
      )
      sendPrivateChatMessage(`Requires specifying pattern before placing in paste location.`, playerId)
      sendPrivateChatMessage(
        `Example: place purple switch id=1 at {x=0,y=0} and purple switch id=2 at {x=1,y=0}.`,
        playerId,
      )
      sendPrivateChatMessage(`Then select region for copy from {x=0,y=0} to {x=0,y=0}.`, playerId)
      sendPrivateChatMessage(`Then Type in chat .smartpaste 5 1`, playerId)
      sendPrivateChatMessage(`Lastly paste your selection at {x=0,y=0}`, playerId)
      sendPrivateChatMessage(
        `As result, you should see purple switches with ids [1,2,3,4,5] placed in a row.`,
        playerId,
      )
      break
    case 'undo':
    case '.undo':
      sendPrivateChatMessage('.undo [count] - undoes last paste performed by bot "count" times', playerId)
      sendPrivateChatMessage(`Example usage 1: .undo`, playerId)
      sendPrivateChatMessage(`Example usage 2: .undo 3`, playerId)
      break
    case 'redo':
    case '.redo':
      sendPrivateChatMessage('.redo [count] - redoes last paste performed by bot "count" times', playerId)
      sendPrivateChatMessage(`Example usage 1: .redo`, playerId)
      sendPrivateChatMessage(`Example usage 2: .redo 3`, playerId)
      break
    case 'move':
    case '.move':
      sendPrivateChatMessage('.move - enabled move mode, which deletes blocks in last selected area', playerId)
      sendPrivateChatMessage('Move mode lasts until next area selection', playerId)
      break
    case 'mask':
    case '.mask':
      sendPrivateChatMessage('.mask [all | background | foreground | overlay] - masks layers when pasting', playerId)
      sendPrivateChatMessage(
        `Example usage 1: .mask foreground background (only pastes foreground and background blocks)`,
        playerId,
      )
      sendPrivateChatMessage(`Example usage 2: .mask all (resets to default mask)`, playerId)
      break
    case 'import':
    case '.import':
      sendPrivateChatMessage('.import world_id [src_from_x src_from_y src_to_x src_to_y dest_to_x dest_to_y]', playerId)
      sendPrivateChatMessage('Copies blocks from world with "world_id" and places them into current world', playerId)
      sendPrivateChatMessage('src_from_(x/y) - top left corner position to copy from', playerId)
      sendPrivateChatMessage('src_to_(x/y) - bottom right corner position to copy to', playerId)
      sendPrivateChatMessage('dest_to_(x/y) - top left corner position to paste to', playerId)
      sendPrivateChatMessage(`Example usage 1: .import https://pixelwalker.net/world/9gf53f4qf5z1f42`, playerId)
      sendPrivateChatMessage(`Example usage 2: .import legacy:PW4gnKMssUb0I 2 4 25 16 2 4`, playerId)
      break
    default:
      sendPrivateChatMessage(`ERROR! Unrecognised command ${args[1]}`, playerId)
  }
}

function undoCommandReceived(args: string[], playerId: number) {
  if (!pwCheckEdit(getPwGameWorldHelper(), playerId)) {
    return
  }

  let count = 1
  if (args.length >= 2) {
    const ERROR_MESSAGE = `ERROR! Correct usage is .undo [count]`
    count = Number(args[1])
    if (!isFinite(count)) {
      sendPrivateChatMessage(ERROR_MESSAGE, playerId)
      return
    }
  }
  const botData = getPlayerBotData()[playerId]
  performUndo(botData, playerId, count)
}

function redoCommandReceived(args: string[], playerId: number) {
  if (!pwCheckEdit(getPwGameWorldHelper(), playerId)) {
    return
  }

  let count = 1
  if (args.length >= 2) {
    const ERROR_MESSAGE = `ERROR! Correct usage is .redo [count]`
    count = Number(args[1])
    if (!isFinite(count)) {
      sendPrivateChatMessage(ERROR_MESSAGE, playerId)
      return
    }
  }
  const botData = getPlayerBotData()[playerId]
  performRedo(botData, playerId, count)
}

function pasteCommandReceived(args: string[], playerId: number, smartPaste: boolean) {
  if (!pwCheckEdit(getPwGameWorldHelper(), playerId)) {
    return
  }

  const ERROR_MESSAGE = `ERROR! Correct usage is ${smartPaste ? '.smartpaste' : '.paste'} x_times y_times [x_spacing y_spacing]`
  const repeatX = Number(args[1])
  const repeatY = Number(args[2])
  if (!isFinite(repeatX) || !isFinite(repeatY)) {
    sendPrivateChatMessage(ERROR_MESSAGE, playerId)
    return
  }

  let spacingX = 0
  let spacingY = 0
  if (args.length >= 4) {
    spacingX = Number(args[3])
    spacingY = Number(args[4])
    if (!isFinite(spacingX) || !isFinite(spacingY)) {
      sendPrivateChatMessage(ERROR_MESSAGE, playerId)
      return
    }
  }

  const botData = getPlayerBotData()[playerId]
  botData.repeatVec = vec2(repeatX, repeatY)
  botData.spacingVec = vec2(spacingX, spacingY)
  botData.smartRepeatEnabled = smartPaste
  sendPrivateChatMessage(`Next paste will be repeated ${repeatX}x${repeatY} times`, playerId)
}

function playerInitPacketReceived() {
  getPwGameClient().send('playerInitReceived')
  void pwEnterEditKey(getPwGameClient(), usePWClientStore().secretEditKey)
}

function applySmartTransformForBlocks(
  pastedBlocks: WorldBlock[],
  pastePosBlocks: WorldBlock[],
  nextBlocksX: WorldBlock[],
  nextBlocksY: WorldBlock[],
  repetitionX: number,
  repetitionY: number,
) {
  return pastedBlocks.map((pastedBlock, i) => {
    const pastePosBlock = pastePosBlocks[i]
    const nextBlockX = nextBlocksX[i]
    const nextBlockY = nextBlocksY[i]
    const blockCopy = cloneDeep(pastedBlock)

    if (pastePosBlock.block.bId === nextBlockX.block.bId || pastePosBlock.block.bId === nextBlockY.block.bId) {
      const blockArgTypes: ComponentTypeHeader[] = Block.getArgTypesByBlockId(pastePosBlock.block.bId)
      for (let i = 0; i < blockArgTypes.length; i++) {
        const blockArgType = blockArgTypes[i]
        if (blockArgType === ComponentTypeHeader.Int32) {
          if (pastePosBlock.block.bId === nextBlockX.block.bId) {
            const diffX = (nextBlockX.block.args[i] as number) - (pastePosBlock.block.args[i] as number)
            blockCopy.block.args[i] = (blockCopy.block.args[i] as number) + diffX * repetitionX
          }
          if (pastePosBlock.block.bId === nextBlockY.block.bId) {
            const diffY = (nextBlockY.block.args[i] as number) - (pastePosBlock.block.args[i] as number)
            blockCopy.block.args[i] = (blockCopy.block.args[i] as number) + diffY * repetitionY
          }
        }
      }
    }
    return blockCopy
  })
}

function getSelectedAreaAsEmptyBlocks(botData: BotData) {
  const [minPos, maxPos] = getMinMaxPos(botData.selectedFromPos, botData.selectedToPos)
  const emptyBlocks: WorldBlock[] = []
  for (let x = 0; x <= maxPos.x - minPos.x; x++) {
    for (let y = 0; y <= maxPos.y - minPos.y; y++) {
      const sourcePos = vec2.add(minPos, vec2(x, y))
      for (let layer = 0; layer < TOTAL_PW_LAYERS; layer++) {
        emptyBlocks.push({ block: new Block(0), layer: layer, pos: sourcePos })
      }
    }
  }
  return emptyBlocks
}

// Merges blocks into bigger WorldBlock[], but gives priority to blocks_top
function mergeWorldBlocks(blocks_bottom: WorldBlock[], blocks_top: WorldBlock[]) {
  const emptyBlocksMap = new Map<string, WorldBlock>()
  for (const emptyBlock of blocks_top) {
    const key = `${emptyBlock.pos.x},${emptyBlock.pos.y},${emptyBlock.layer}`
    emptyBlocksMap.set(key, emptyBlock)
  }

  const filtered_blocks_bottom = blocks_bottom.filter((block) => {
    const key = `${block.pos.x},${block.pos.y},${block.layer}`
    return !emptyBlocksMap.has(key)
  })

  return filtered_blocks_bottom.concat(blocks_top)
}

function applyMoveMode(botData: BotData, allBlocks: WorldBlock[]) {
  if (botData.moveEnabled) {
    const replacedByLastMoveOperationBlocks = allBlocks.map(
      (block) =>
        botData.replacedByLastMoveOperationBlocks.find(
          (replacedBlock) => vec2.eq(block.pos, replacedBlock.pos) && block.layer === replacedBlock.layer,
        ) ?? {
          pos: block.pos,
          layer: block.layer,
          block: getBlockAt(block.pos, block.layer),
        },
    )

    if (botData.moveOperationPerformedOnce) {
      allBlocks = mergeWorldBlocks(botData.replacedByLastMoveOperationBlocks, allBlocks)
    }
    const emptyBlocks = getSelectedAreaAsEmptyBlocks(botData)
    allBlocks = mergeWorldBlocks(emptyBlocks, allBlocks)

    botData.moveOperationPerformedOnce = true

    botData.replacedByLastMoveOperationBlocks = replacedByLastMoveOperationBlocks
  }
  return allBlocks
}

function filterByLayerMasks(allBlocks: WorldBlock[], botData: BotData) {
  return allBlocks.filter((block) => {
    if (block.layer === LayerType.Background) {
      return botData.maskBackgroundEnabled
    }

    if (block.layer === LayerType.Foreground) {
      return botData.maskForegroundEnabled
    }

    if (block.layer === LayerType.Overlay) {
      return botData.maskOverlayEnabled
    }
  })
}

function pasteBlocks(botData: BotData, blockPos: Point) {
  try {
    let allBlocks: WorldBlock[] = []

    const mapWidth = getPwGameWorldHelper().width
    const mapHeight = getPwGameWorldHelper().height

    const repeatDir = vec2(botData.repeatVec.x < 0 ? -1 : 1, botData.repeatVec.y < 0 ? -1 : 1)
    const offsetSize = vec2.mul(repeatDir, vec2.add(botData.selectionSize, botData.spacingVec))

    const pastePosBlocksFromPos = vec2.add(blockPos, botData.selectionLocalTopLeftPos)
    const pastePosBlocksToPos = vec2.add(blockPos, botData.selectionLocalBottomRightPos)
    const pastePosBlocks = getBlocksInArea(pastePosBlocksFromPos, pastePosBlocksToPos)

    const nextBlocksXFromPos = vec2.add(pastePosBlocksFromPos, vec2(offsetSize.x, 0))
    const nextBlocksXToPos = vec2.add(pastePosBlocksToPos, vec2(offsetSize.x, 0))
    const nextBlocksX = getBlocksInArea(nextBlocksXFromPos, nextBlocksXToPos)

    const nextBlocksYFromPos = vec2.add(pastePosBlocksFromPos, vec2(0, offsetSize.y))
    const nextBlocksYToPos = vec2.add(pastePosBlocksToPos, vec2(0, offsetSize.y))
    const nextBlocksY = getBlocksInArea(nextBlocksYFromPos, nextBlocksYToPos)

    for (let x = 0; x < Math.abs(botData.repeatVec.x); x++) {
      const offsetPosX = pastePosBlocksFromPos.x + x * offsetSize.x
      // TODO: fix this, so it doesn't require break, because it currently doesn't work when pasting structure where top left x is negative
      if (
        offsetPosX + botData.selectionLocalTopLeftPos.x >= mapWidth ||
        offsetPosX + botData.selectionLocalBottomRightPos.x < 0
      ) {
        break
      }
      for (let y = 0; y < Math.abs(botData.repeatVec.y); y++) {
        const offsetPosY = pastePosBlocksFromPos.y + y * offsetSize.y
        if (
          offsetPosY + botData.selectionLocalTopLeftPos.y >= mapHeight ||
          offsetPosY + botData.selectionLocalBottomRightPos.y < 0
        ) {
          break
        }

        const offsetPos = vec2(offsetPosX, offsetPosY)

        let finalBlocks = applyPosOffsetForBlocks(offsetPos, botData.selectedBlocks)
        if (botData.smartRepeatEnabled) {
          finalBlocks = applySmartTransformForBlocks(finalBlocks, pastePosBlocks, nextBlocksX, nextBlocksY, x, y)
        }
        allBlocks = allBlocks.concat(finalBlocks)
      }
    }

    allBlocks = applyMoveMode(botData, allBlocks)
    allBlocks = filterByLayerMasks(allBlocks, botData)

    addUndoItemWorldBlock(botData, allBlocks)
    void placeMultipleBlocks(allBlocks)
  } finally {
    botData.repeatVec = vec2(1, 1)
  }
}

function disableMoveMode(botData: BotData, playerId: number) {
  if (botData.moveEnabled) {
    botData.moveEnabled = false
    botData.moveOperationPerformedOnce = false
    sendPrivateChatMessage('Move mode disabled', playerId)
  }
}

function selectBlocks(botData: BotData, blockPos: Point, playerId: number) {
  let selectedTypeText: string
  if ([BotState.NONE, BotState.SELECTED_TO].includes(botData.botState)) {
    selectedTypeText = 'from'
    botData.botState = BotState.SELECTED_FROM
    botData.selectedFromPos = blockPos
  } else {
    selectedTypeText = 'to'
    botData.botState = BotState.SELECTED_TO
    botData.selectedToPos = blockPos
    botData.selectionSize = vec2(
      Math.abs(botData.selectedToPos.x - botData.selectedFromPos.x) + 1,
      Math.abs(botData.selectedToPos.y - botData.selectedFromPos.y) + 1,
    )

    const dirX = botData.selectedFromPos.x <= botData.selectedToPos.x ? 1 : -1
    const dirY = botData.selectedFromPos.y <= botData.selectedToPos.y ? 1 : -1

    if (dirX == 1) {
      botData.selectionLocalTopLeftPos.x = 0
      botData.selectionLocalBottomRightPos.x = botData.selectionSize.x - 1
    } else {
      botData.selectionLocalTopLeftPos.x = -botData.selectionSize.x + 1
      botData.selectionLocalBottomRightPos.x = 0
    }

    if (dirY == 1) {
      botData.selectionLocalTopLeftPos.y = 0
      botData.selectionLocalBottomRightPos.y = botData.selectionSize.y - 1
    } else {
      botData.selectionLocalTopLeftPos.y = -botData.selectionSize.y + 1
      botData.selectionLocalBottomRightPos.y = 0
    }

    botData.selectedBlocks = getBlocksInArea(botData.selectedFromPos, botData.selectedToPos)

    disableMoveMode(botData, playerId)
  }

  sendPrivateChatMessage(`Selected ${selectedTypeText} x: ${blockPos.x} y: ${blockPos.y}`, playerId)
}

function updateWorldImportFinished(data: ProtoGen.WorldBlockPlacedPacket) {
  // Not really reliable, but good enough
  if (usePWClientStore().totalBlocksLeftToReceiveFromWorldImport > 0) {
    usePWClientStore().totalBlocksLeftToReceiveFromWorldImport -= data.positions.length
    if (usePWClientStore().totalBlocksLeftToReceiveFromWorldImport <= 0) {
      usePWClientStore().totalBlocksLeftToReceiveFromWorldImport = 0
    }
  }
}

function worldBlockPlacedPacketReceived(
  data: ProtoGen.WorldBlockPlacedPacket,
  states?: { player: IPlayer | undefined; oldBlocks: Block[]; newBlocks: Block[] },
) {
  updateWorldImportFinished(data)

  if (data.playerId === getPwGameWorldHelper().botPlayerId) {
    return
  }

  if (states === undefined) {
    return
  }

  const playerId = data.playerId
  if (playerId === undefined) {
    return
  }

  if (data.positions.length !== states.oldBlocks.length || states.oldBlocks.length !== states.newBlocks.length) {
    handleException(new GameError('Packet block count and old/new block count mismatch detected'))
    return
  }

  switch (getBlockName(data.blockId)) {
    case PwBlockName.COIN_GOLD:
      goldCoinBlockPlaced(data, states)
      break

    case PwBlockName.COIN_BLUE:
      blueCoinBlockPlaced(data, states)
      break
  }
}

function getBotData(playerId: number) {
  if (!getPlayerBotData()[playerId]) {
    getPlayerBotData()[playerId] = createBotData()
  }
  return getPlayerBotData()[playerId]
}

function createOldWorldBlocks(positions: vec2[], oldBlocks: Block[]) {
  return oldBlocks.map((block, idx) => ({
    block: block,
    layer: LayerType.Foreground,
    pos: positions[idx],
  }))
}

function goldCoinBlockPlaced(
  data: ProtoGen.WorldBlockPlacedPacket,
  states: {
    player: IPlayer | undefined
    oldBlocks: Block[]
    newBlocks: Block[]
  },
) {
  const playerId = data.playerId!
  if (!pwCheckEdit(getPwGameWorldHelper(), playerId)) {
    return
  }

  const worldBlocks = createOldWorldBlocks(data.positions, states.oldBlocks)
  void placeMultipleBlocks(worldBlocks)

  // We assume that if more packets arrived, it was by mistake via fill tool, brush tool or accidental drag through the map
  const MAX_GOLD_COINS_EXPECTED_PER_PACKET = 1
  if (data.positions.length > MAX_GOLD_COINS_EXPECTED_PER_PACKET) {
    return
  }

  const botData = getBotData(playerId)

  const blockPos = data.positions[0]

  selectBlocks(botData, blockPos, playerId)
}

function blueCoinBlockPlaced(
  data: ProtoGen.WorldBlockPlacedPacket,
  states: {
    player: IPlayer | undefined
    oldBlocks: Block[]
    newBlocks: Block[]
  },
) {
  const playerId = data.playerId!
  if (!pwCheckEdit(getPwGameWorldHelper(), playerId)) {
    return
  }

  const worldBlocks = createOldWorldBlocks(data.positions, states.oldBlocks)
  void placeMultipleBlocks(worldBlocks)

  const MAX_BLUE_COINS_EXPECTED_PER_PACKET = 4
  if (data.positions.length > MAX_BLUE_COINS_EXPECTED_PER_PACKET) {
    return
  }

  const botData = getBotData(playerId)

  if (botData.botState !== BotState.SELECTED_TO) {
    sendPrivateChatMessage('ERROR! You need to select area first', playerId)
    return
  }

  // We want to prevent paste happening when player accidentally uses fill or brush tool
  // But simultaneously, if player drags blue coin across the map, there could be multiple blue coins in single packet
  // This is not ideal, but good enough
  for (let i = 0; i < data.positions.length; i++) {
    const blockPos = data.positions[i]

    if (getBlockName(data.blockId) === PwBlockName.COIN_BLUE) {
      pasteBlocks(botData, blockPos)
    }
  }
}

function applyPosOffsetForBlocks(offsetPos: Point, worldBlocks: WorldBlock[]) {
  return worldBlocks.map((worldBlock) => {
    const clonedBlock = cloneDeep(worldBlock)
    clonedBlock.pos = vec2.add(clonedBlock.pos, offsetPos)
    return clonedBlock
  })
}

function getMinMaxPos(pos1: Point, pos2: Point) {
  const minPos = cloneDeep(pos1)
  const maxPos = cloneDeep(pos2)
  if (minPos.x > maxPos.x) {
    ;[minPos.x, maxPos.x] = [maxPos.x, minPos.x]
  }
  if (minPos.y > maxPos.y) {
    ;[minPos.y, maxPos.y] = [maxPos.y, minPos.y]
  }
  return [minPos, maxPos]
}

function getBlocksInArea(fromPos: Point, toPos: Point): WorldBlock[] {
  const [minPos, maxPos] = getMinMaxPos(fromPos, toPos)
  const data: WorldBlock[] = []
  for (let x = 0; x <= maxPos.x - minPos.x; x++) {
    for (let y = 0; y <= maxPos.y - minPos.y; y++) {
      const sourcePos = vec2.add(minPos, vec2(x, y))

      for (let i = 0; i < TOTAL_PW_LAYERS; i++) {
        data.push({
          block: getBlockAt(sourcePos, i),
          pos: vec2(x, y),
          layer: i,
        })
      }
    }
  }
  return data
}
