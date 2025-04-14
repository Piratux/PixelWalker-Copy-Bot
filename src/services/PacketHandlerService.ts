import { getPwBlocks, getPwGameClient, getPwGameWorldHelper, usePWClientStore } from '@/stores/PWClientStore.ts'
import {
  Block,
  ComponentTypeHeader,
  createBlockPacket,
  IPlayer,
  LayerType,
  Point,
  PWGameWorldHelper,
  SendableBlockPacket,
} from 'pw-js-world'
import { cloneDeep } from 'lodash-es'
import { BotData, createBotData } from '@/types/BotData.ts'
import { getPlayerBotData } from '@/stores/BotStore.ts'
import { BotState } from '@/enums/BotState.ts'
import { WorldBlock } from '@/types/WorldBlock.ts'
import { sendGlobalChatMessage, sendPrivateChatMessage } from '@/services/ChatMessageService.ts'
import { vec2 } from '@basementuniverse/vec'
import {
  getBlockAt,
  getBlockName,
  placeBlockPacket,
  placeMultipleBlocks,
  placeWorldDataBlocks,
} from '@/services/WorldService.ts'
import {
  addUndoItemDeserializedStructure,
  addUndoItemWorldBlock,
  performRedo,
  performUndo,
} from '@/services/UndoRedoService.ts'
import { PwBlockName } from '@/gen/PwBlockName.ts'
import { performRuntimeTests } from '@/tests/RuntimeTests.ts'
import { ProtoGen, PWApiClient, PWGameClient } from 'pw-js-api'
import {
  getAllWorldBlocks,
  pwAuthenticate,
  pwEnterEditKey,
  pwCheckEdit,
  pwClearWorld,
  pwJoinWorld,
} from '@/services/PWClientService.ts'
import { importFromPwlvl } from '@/services/PwlvlImporterService.ts'
import { getWorldIdIfUrl } from '@/services/WorldIdExtractorService.ts'
import { handleException } from '@/utils/Exception.ts'
import { GameError } from '@/classes/GameError.ts'
import { TOTAL_PW_LAYERS } from '@/constants/General.ts'

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

      if (partialImportUsed) {
        const destPos = vec2(destToX, destToY)
        const botData = getPlayerBotData()[playerId]
        addUndoItemDeserializedStructure(botData, blocks, destPos)
        await placeWorldDataBlocks(blocks, destPos)
      } else {
        await pwClearWorld()
        await importFromPwlvl(blocks.toBuffer())
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
    sendPrivateChatMessage('Commands: .help .ping .paste .smartpaste .undo .redo .import', playerId)
    sendPrivateChatMessage('See more info about each command via .help [command]', playerId)
    sendPrivateChatMessage('You can also use the bot: piratux.github.io/Pixel-Walker-Copy-Bot/', playerId)
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

function pasteBlocks(blockPacket: SendableBlockPacket, botData: BotData, blockPos: Point, oldBlock: Block) {
  try {
    placeBlockPacket(blockPacket)
    let allBlocks: WorldBlock[] = []

    const mapWidth = getPwGameWorldHelper().width
    const mapHeight = getPwGameWorldHelper().height

    const repeatDir = vec2(botData.repeatVec.x < 0 ? -1 : 1, botData.repeatVec.y < 0 ? -1 : 1)
    const offsetSize = vec2.mul(repeatDir, vec2.add(botData.selectionSize, botData.spacingVec))

    const pastePosBlocksFromPos = vec2.add(blockPos, botData.selectionLocalTopLeftPos)
    const pastePosBlocksToPos = vec2.add(blockPos, botData.selectionLocalBottomRightPos)
    const pastePosBlocks = getBlocksInArea(oldBlock, blockPos, pastePosBlocksFromPos, pastePosBlocksToPos)

    const nextBlocksXFromPos = vec2.add(pastePosBlocksFromPos, vec2(offsetSize.x, 0))
    const nextBlocksXToPos = vec2.add(pastePosBlocksToPos, vec2(offsetSize.x, 0))
    const nextBlocksX = getBlocksInArea(oldBlock, blockPos, nextBlocksXFromPos, nextBlocksXToPos)

    const nextBlocksYFromPos = vec2.add(pastePosBlocksFromPos, vec2(0, offsetSize.y))
    const nextBlocksYToPos = vec2.add(pastePosBlocksToPos, vec2(0, offsetSize.y))
    const nextBlocksY = getBlocksInArea(oldBlock, blockPos, nextBlocksYFromPos, nextBlocksYToPos)

    for (let x = 0; x < Math.abs(botData.repeatVec.x); x++) {
      const offsetPosX = pastePosBlocksFromPos.x + x * offsetSize.x
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

    addUndoItemWorldBlock(botData, allBlocks, oldBlock, blockPos)
    void placeMultipleBlocks(allBlocks)
  } finally {
    botData.repeatVec = vec2(1, 1)
  }
}

function selectBlocks(
  blockPacket: SendableBlockPacket,
  botData: BotData,
  blockPos: Point,
  oldBlock: Block,
  playerId: number,
) {
  placeBlockPacket(blockPacket)

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

    botData.selectedBlocks = getBlocksInArea(oldBlock, blockPos, botData.selectedFromPos, botData.selectedToPos)
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

  if (!getPlayerBotData()[playerId]) {
    getPlayerBotData()[playerId] = createBotData()
  }
  const botData = getPlayerBotData()[playerId]

  if (data.positions.length !== states.oldBlocks.length || states.oldBlocks.length !== states.newBlocks.length) {
    handleException(new GameError('Packet block count and old/new block count mismatch detected'))
    return
  }

  for (let i = 0; i < data.positions.length; i++) {
    const blockPos = data.positions[i]
    const oldBlock = states.oldBlocks[i]
    const blockPacket = createBlockPacket(oldBlock, LayerType.Foreground, blockPos)
    if (getBlockName(data.blockId) === PwBlockName.COIN_GOLD) {
      if (!pwCheckEdit(getPwGameWorldHelper(), playerId)) {
        return
      }

      selectBlocks(blockPacket, botData, blockPos, oldBlock, playerId)
    }

    if (getBlockName(data.blockId) === PwBlockName.COIN_BLUE) {
      if (!pwCheckEdit(getPwGameWorldHelper(), playerId)) {
        return
      }

      pasteBlocks(blockPacket, botData, blockPos, oldBlock)
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

function getBlocksInArea(oldBlock: Block, oldBlockPos: Point, fromPos: Point, toPos: Point): WorldBlock[] {
  fromPos = cloneDeep(fromPos)
  toPos = cloneDeep(toPos)
  if (fromPos.x > toPos.x) {
    ;[fromPos.x, toPos.x] = [toPos.x, fromPos.x]
  }
  if (fromPos.y > toPos.y) {
    ;[fromPos.y, toPos.y] = [toPos.y, fromPos.y]
  }
  const data: WorldBlock[] = []
  for (let x = 0; x <= toPos.x - fromPos.x; x++) {
    for (let y = 0; y <= toPos.y - fromPos.y; y++) {
      const sourcePos = vec2.add(fromPos, vec2(x, y))

      let foregroundBlock = getBlockAt(sourcePos, LayerType.Foreground)
      if (vec2.eq(sourcePos, oldBlockPos)) {
        foregroundBlock = oldBlock
      }

      for (let i = 0; i < TOTAL_PW_LAYERS; i++) {
        if ((i as LayerType) !== LayerType.Foreground) {
          data.push({
            block: getBlockAt(sourcePos, i),
            pos: vec2(x, y),
            layer: i,
          })
        } else {
          data.push({
            block: foregroundBlock,
            pos: vec2(x, y),
            layer: LayerType.Foreground,
          })
        }
      }
    }
  }
  return data
}
