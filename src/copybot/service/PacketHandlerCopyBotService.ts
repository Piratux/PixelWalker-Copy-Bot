import {
  getPwBlocks,
  getPwBlocksByPwId,
  getPwBotType,
  getPwGameClient,
  getPwGameWorldHelper,
  usePwClientStore,
} from '@/core/store/PwClientStore.ts'
import { Block, ComponentTypeHeader, IPlayer, LayerType, Point } from 'pw-js-world'
import { cloneDeep, isEqual } from 'lodash-es'
import { CopyBotData, createBotData } from '@/copybot/type/CopyBotData.ts'
import { getPlayerCopyBotData } from '@/copybot/store/CopyBotStore.ts'
import { CopyBotState } from '@/copybot/enum/CopyBotState.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { sendGlobalChatMessage, sendPrivateChatMessage } from '@/core/service/ChatMessageService.ts'
import { vec2 } from '@basementuniverse/vec'
import {
  applyPosOffsetForBlocks,
  blockIsPortal,
  convertDeserializedStructureToWorldBlocks,
  getAnotherWorldBlocks,
  getBlockAt,
  getBlockIdFromString,
  getBlockLayer,
  getBlockName,
  getDeserialisedStructureSection,
  mergeWorldBlocks,
  placeMultipleBlocks,
  portalIdToNumber,
} from '@/core/service/WorldService.ts'
import { addUndoItemWorldBlock, performRedo, performUndo } from '@/copybot/service/UndoRedoService.ts'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import { performRuntimeTests } from '@/test/RuntimeTests.ts'
import { ProtoGen } from 'pw-js-api'
import {
  commonPlayerInitPacketReceived,
  createEmptyBlocks,
  handlePlaceBlocksResult,
  hotReloadCallbacks,
  requirePlayerAndBotEditPermission,
} from '@/core/service/PwClientService.ts'
import { isDeveloper, isWorldOwner, requireDeveloper } from '@/core/util/Environment.ts'
import { getImportedFromPwlvlData } from '@/pwlvl/service/PwlvlImporterService.ts'
import { getWorldIdIfUrl } from '@/core/util/WorldIdExtractor.ts'
import { handleException } from '@/core/util/Exception.ts'
import { GameError } from '@/core/class/GameError.ts'
import { TOTAL_PW_LAYERS } from '@/core/constant/General.ts'
import { bufferToArrayBuffer } from '@/core/util/Buffers.ts'
import { CallbackEntry } from '@/core/type/CallbackEntry.ts'
import { BotType } from '@/core/enum/BotType.ts'

const callbacks: CallbackEntry[] = [
  { name: 'playerInitPacket', fn: commonPlayerInitPacketReceived },
  { name: 'worldBlockPlacedPacket', fn: worldBlockPlacedPacketReceived },
  { name: 'playerChatPacket', fn: playerChatPacketReceived },
  { name: 'playerJoinedPacket', fn: playerJoinedPacketReceived },
]

export function registerCopyBotCallbacks() {
  const client = getPwGameClient()
  const helper = getPwGameWorldHelper()
  client.addHook(helper.receiveHook)
  client.addCallback('debug', console.log)
  client.addCallback('error', handleException)
  for (const cb of callbacks) {
    client.addCallback(cb.name, cb.fn)
  }
}

if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', ({}) => {
    if (getPwBotType() === BotType.COPY_BOT) {
      hotReloadCallbacks(callbacks)
    }
  })
}

function playerJoinedPacketReceived(data: ProtoGen.PlayerJoinedPacket) {
  const playerId = data.properties?.playerId
  if (playerId === undefined) {
    return
  }
  if (!(playerId in getPlayerCopyBotData())) {
    getPlayerCopyBotData()[playerId] = createBotData()
  }
  sendPrivateChatMessage('Copy Bot is here! Type .help to show usage!', playerId)
}

async function playerChatPacketReceived(data: ProtoGen.PlayerChatPacket) {
  const args = data.message.split(' ')
  const playerId = data.playerId!

  switch (args[0].toLowerCase()) {
    case '.help':
      helpCommandReceived(args, playerId)
      break
    case '.placeall':
      await placeallCommandReceived(args, playerId)
      break
    case '.ping':
      sendPrivateChatMessage('pong', playerId)
      break
    case '.edit':
      editCommandReceived(args, playerId)
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
        throw new GameError('Unrecognised command. Type .help to see all commands', playerId)
      }
  }
}

function maskCommandReceived(args: string[], playerId: number) {
  const botData = getPlayerCopyBotData()[playerId]
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
    throw new GameError(`Correct usage is .mask [all | background | foreground | overlay]`, playerId)
  }
}

function moveCommandReceived(_args: string[], playerId: number) {
  const botData = getPlayerCopyBotData()[playerId]
  botData.moveEnabled = !botData.moveEnabled

  sendPrivateChatMessage(`Move mode ${botData.moveEnabled ? 'enabled' : 'disabled'}`, playerId)
}

async function placeallCommandReceived(_args: string[], playerId: number) {
  requireDeveloper(playerId)
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  const sortedListBlocks = getPwBlocks()
  const worldBlocks = []
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x < 100; x++) {
      const idx = y * 100 + x
      if (idx >= sortedListBlocks.length) {
        const success = await placeMultipleBlocks(worldBlocks)
        handlePlaceBlocksResult(success)

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
      } else if (blockIsPortal(singleBlock.PaletteId)) {
        worldBlock = { block: new Block(singleBlock.Id, ['0', '0']), layer: singleBlock.Layer, pos }
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
  if (!isDeveloper(playerId) && !isWorldOwner(playerId)) {
    throw new GameError('Command is exclusive to world owners', playerId)
  }

  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  const ERROR_MESSAGE =
    'Correct usage is .import world_id [src_from_x src_from_y src_to_x src_to_y dest_to_x dest_to_y]'

  if (![2, 8].includes(args.length)) {
    throw new GameError(ERROR_MESSAGE, playerId)
  }

  const worldId = getWorldIdIfUrl(args[1])

  sendGlobalChatMessage(`Importing world from ${worldId}`)

  const blocksFromAnotherWorld = await getAnotherWorldBlocks(worldId)
  if (!blocksFromAnotherWorld) {
    throw new GameError('Failed to get blocks from another world.')
  }

  const partialImportUsed = args.length === 8
  let allBlocks: WorldBlock[]
  if (partialImportUsed) {
    const numberArgs = args.slice(2, 8).map(Number)
    if (numberArgs.some((n) => !isFinite(n))) {
      throw new GameError(ERROR_MESSAGE, playerId)
    }
    let [srcFromX, srcFromY, srcToX, srcToY, destToX, destToY] = numberArgs

    const mapWidth = getPwGameWorldHelper().width
    const mapHeight = getPwGameWorldHelper().height
    const pasteSizeX = srcToX - srcFromX + 1
    const pasteSizeY = srcToY - srcFromY + 1
    if (destToX < 0 || destToY < 0 || destToX + pasteSizeX > mapWidth || destToY + pasteSizeY > mapHeight) {
      throw new GameError(
        `Pasted area would be placed at pos (${destToX}, ${destToY}) with size (${pasteSizeX}, ${pasteSizeY}), but that's outside world bounds`,
        playerId,
      )
    }

    // Allow specifying any 2 corners of source area
    if (srcFromX > srcToX) {
      ;[srcFromX, srcToX] = [srcToX, srcFromX]
      destToX = destToX - (srcToX - srcFromX)
    }
    if (srcFromY > srcToY) {
      ;[srcFromY, srcToY] = [srcToY, srcFromY]
      destToY = destToY - (srcToY - srcFromY)
    }

    const partialBlocks = getDeserialisedStructureSection(blocksFromAnotherWorld, srcFromX, srcFromY, srcToX, srcToY)
    allBlocks = convertDeserializedStructureToWorldBlocks(partialBlocks, vec2(destToX, destToY))
  } else {
    const emptyBlocks = createEmptyBlocks(getPwGameWorldHelper())
    const worldData = getImportedFromPwlvlData(bufferToArrayBuffer(blocksFromAnotherWorld.toBuffer()))
    const emptyBlocksWorldBlocks = convertDeserializedStructureToWorldBlocks(emptyBlocks)
    const worldDataWorldBlocks = convertDeserializedStructureToWorldBlocks(worldData)
    allBlocks = mergeWorldBlocks(emptyBlocksWorldBlocks, worldDataWorldBlocks)
  }

  const botData = getPlayerCopyBotData()[playerId]
  allBlocks = filterByLayerMasks(allBlocks, botData)
  addUndoItemWorldBlock(botData, allBlocks)

  const success = await placeMultipleBlocks(allBlocks)
  handlePlaceBlocksResult(success)
}

async function testCommandReceived(_args: string[], playerId: number) {
  requireDeveloper(playerId)
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  if (getPwGameWorldHelper().width < 200 || getPwGameWorldHelper().height < 200) {
    throw new GameError('To perform tests, world must be at least 200x200 size.', playerId)
  }

  await performRuntimeTests()
}

function helpCommandReceived(args: string[], playerId: number) {
  if (args.length == 1) {
    sendPrivateChatMessage('Gold coin - select blocks', playerId)
    sendPrivateChatMessage('Blue coin - paste blocks', playerId)
    sendPrivateChatMessage('Commands: .help .ping .paste .smartpaste .undo .redo .import .edit .move .mask', playerId)
    sendPrivateChatMessage('See more info about each command via .help [command]', playerId)
    sendPrivateChatMessage('You can also use the bot: piratux.github.io/PixelWalker-Copy-Bot/', playerId)
    return
  }

  if (args[1].startsWith('.')) {
    args[1] = args[1].substring(1)
  }

  switch (args[1]) {
    case 'ping':
      sendPrivateChatMessage('.ping - check if bot is alive by pinging it.', playerId)
      sendPrivateChatMessage(`Example usage: .ping`, playerId)
      break
    case 'help':
      sendPrivateChatMessage(
        '.help [command] - get general help, or if command is specified, get help about command.',
        playerId,
      )
      sendPrivateChatMessage(`Example usage: .help paste`, playerId)
      break
    case 'edit':
      sendPrivateChatMessage(
        '.edit name find replace - edits selected block name substrings from "find" to "replace".',
        playerId,
      )
      sendPrivateChatMessage(
        '.edit id find_id replace_id - edits selected block ids from "find_id" to "replace_id".',
        playerId,
      )
      sendPrivateChatMessage('edit math_op number [name_find] - edits selected block number arguments.', playerId)
      sendPrivateChatMessage('math_op - add, sub, mul or div.', playerId)
      sendPrivateChatMessage('name_find - restricts to blocks with this substring in their name', playerId)
      break
    case 'paste':
      sendPrivateChatMessage('.paste x_times y_times [x_spacing y_spacing] - repeat next paste (x/y)_times.', playerId)
      sendPrivateChatMessage('(x/y)_spacing - gap size to leave between pastes.', playerId)
      sendPrivateChatMessage(`Example usage 1: .paste 2 3`, playerId)
      sendPrivateChatMessage(`Example usage 2: .paste 2 3 4 1`, playerId)
      break
    case 'smartpaste':
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
      sendPrivateChatMessage('.undo [count] - undoes last paste performed by bot "count" times', playerId)
      sendPrivateChatMessage(`Example usage 1: .undo`, playerId)
      sendPrivateChatMessage(`Example usage 2: .undo 3`, playerId)
      break
    case 'redo':
      sendPrivateChatMessage('.redo [count] - redoes last paste performed by bot "count" times', playerId)
      sendPrivateChatMessage(`Example usage 1: .redo`, playerId)
      sendPrivateChatMessage(`Example usage 2: .redo 3`, playerId)
      break
    case 'move':
      sendPrivateChatMessage('.move - enabled move mode, which deletes blocks in last selected area', playerId)
      sendPrivateChatMessage('Move mode lasts until next area selection', playerId)
      break
    case 'mask':
      sendPrivateChatMessage('.mask [all | background | foreground | overlay] - masks layers when pasting', playerId)
      sendPrivateChatMessage(
        `Example usage 1: .mask foreground background (only pastes foreground and background blocks)`,
        playerId,
      )
      sendPrivateChatMessage(`Example usage 2: .mask all (resets to default mask)`, playerId)
      break
    case 'import':
      sendPrivateChatMessage('.import world_id [src_from_x src_from_y src_to_x src_to_y dest_to_x dest_to_y]', playerId)
      sendPrivateChatMessage('Copies blocks from world with "world_id" and places them into current world', playerId)
      sendPrivateChatMessage('src_from_(x/y) - top left corner position to copy from', playerId)
      sendPrivateChatMessage('src_to_(x/y) - bottom right corner position to copy to', playerId)
      sendPrivateChatMessage('dest_to_(x/y) - top left corner position to paste to', playerId)
      sendPrivateChatMessage(`Example usage 1: .import https://pixelwalker.net/world/9gf53f4qf5z1f42`, playerId)
      sendPrivateChatMessage(`Example usage 2: .import legacy:PW4gnKMssUb0I 2 4 25 16 2 4`, playerId)
      break
    default:
      throw new GameError(`Unrecognised command ${args[1]}. Type .help to see all commands`, playerId)
  }
}

function undoCommandReceived(args: string[], playerId: number) {
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  let count = 1
  if (args.length >= 2) {
    count = Number(args[1])
    if (!isFinite(count)) {
      throw new GameError(`Correct usage is .undo [count]`, playerId)
    }
  }
  const botData = getPlayerCopyBotData()[playerId]
  performUndo(botData, playerId, count)
}

function redoCommandReceived(args: string[], playerId: number) {
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  let count = 1
  if (args.length >= 2) {
    count = Number(args[1])
    if (!isFinite(count)) {
      throw new GameError(`Correct usage is .redo [count]`, playerId)
    }
  }
  const botData = getPlayerCopyBotData()[playerId]
  performRedo(botData, playerId, count)
}

function pasteCommandReceived(args: string[], playerId: number, smartPaste: boolean) {
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  const ERROR_MESSAGE = `Correct usage is ${smartPaste ? '.smartpaste' : '.paste'} x_times y_times [x_spacing y_spacing]`
  const repeatX = Number(args[1])
  const repeatY = Number(args[2])
  if (!isFinite(repeatX) || !isFinite(repeatY)) {
    throw new GameError(ERROR_MESSAGE, playerId)
  }

  let spacingX = 0
  let spacingY = 0
  if (args.length >= 4) {
    spacingX = Number(args[3])
    spacingY = Number(args[4])
    if (!isFinite(spacingX) || !isFinite(spacingY)) {
      throw new GameError(ERROR_MESSAGE, playerId)
    }
  }

  const botData = getPlayerCopyBotData()[playerId]

  if (botData.botState !== CopyBotState.SELECTED_TO) {
    throw new GameError('You need to select area first', playerId)
  }

  botData.repeatVec = vec2(repeatX, repeatY)
  botData.spacingVec = vec2(spacingX, spacingY)
  botData.smartRepeatEnabled = smartPaste
  sendPrivateChatMessage(
    `Selection repeated ${repeatX}x${repeatY} times` +
      (spacingX !== 0 && spacingY !== 0 ? ` with spacing ${spacingX}x${spacingY}` : ''),
    playerId,
  )
  pasteBlocks(botData, botData.selectedFromPos)
}

function placeEditedBlocks(playerId: number, editedBlocks: WorldBlock[]) {
  if (editedBlocks.length === 0) {
    return
  }

  const botData = getBotData(playerId)
  const offsetPos = vec2.add(botData.selectedFromPos, botData.selectionLocalTopLeftPos)
  editedBlocks = applyPosOffsetForBlocks(offsetPos, editedBlocks)
  addUndoItemWorldBlock(botData, editedBlocks)
  void placeMultipleBlocks(editedBlocks)
}

function editCommandReceived(args: string[], playerId: number) {
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  if (getPlayerCopyBotData()[playerId].selectedBlocks.length === 0) {
    throw new GameError(`Select blocks before replacing them!`, playerId)
  }

  let editedBlocks: WorldBlock[] = []
  switch (args[1]?.toLowerCase()) {
    case 'name':
      editedBlocks = editNameCommand(args, playerId)
      break
    case 'id':
      editedBlocks = editIdCommand(args, playerId)
      break
    case 'div':
      editedBlocks = editDivideCommand(args, playerId)
      break
    case 'mul':
      editedBlocks = editMultiplyCommand(args, playerId)
      break
    case 'add':
      editedBlocks = editAddCommand(args, playerId)
      break
    case 'sub':
      editedBlocks = editSubCommand(args, playerId)
      break
    default:
      throw new GameError(`Correct usage is .edit <type> arg1 arg2`, playerId)
  }

  placeEditedBlocks(playerId, editedBlocks)
}

function editNameCommand(args: string[], playerId: number): WorldBlock[] {
  let searchFor = args[2]
  let replaceWith = args[3]
  if (searchFor === '' || replaceWith === '') {
    throw new GameError(`Correct usage is .edit name find replace`, playerId)
  }

  searchFor = searchFor.toUpperCase()
  replaceWith = replaceWith.toUpperCase()
  let counter = 0
  const copyNamesFound: Set<string> = new Set<string>()
  let warning = ''

  const editedBlocks: WorldBlock[] = []

  getPlayerCopyBotData()[playerId].selectedBlocks = getPlayerCopyBotData()[playerId].selectedBlocks.map(
    (worldBlock) => {
      const copyName = worldBlock.block.name.replace(searchFor, replaceWith)
      if (worldBlock.block.name !== copyName && copyName != '') {
        copyNamesFound.add(copyName)
        const possBlockId = getBlockIdFromString(copyName)
        if (possBlockId !== undefined && !isNaN(possBlockId)) {
          const deepBlock = cloneDeep(worldBlock)
          if (getBlockLayer(possBlockId) !== getBlockLayer(worldBlock.block.bId)) {
            warning = '.edit name does not support changing layers'
            return worldBlock
          }
          deepBlock.block = new Block(possBlockId, worldBlock.block.args)
          counter++
          editedBlocks.push(deepBlock)
          return deepBlock
        }
      }
      return worldBlock
    },
  )
  if (warning === '' && counter == 0 && copyNamesFound.size == 1) {
    // some blocks are confusingly named, if they're trying to edit a single block type let them know that it's not valid.
    sendPrivateChatMessage(`${counter} blocks changed. ${[...copyNamesFound][0]} is not a valid block.`, playerId)
    return editedBlocks
  }
  sendPrivateChatMessage(`${counter} blocks changed ${searchFor} to ${replaceWith}`, playerId)
  if (warning !== '') {
    sendPrivateChatMessage(`Warning: ${warning}`, playerId)
  }

  return editedBlocks
}

function editIdCommand(args: string[], playerId: number): WorldBlock[] {
  const searchForId = Number(args[2])
  const replaceWithId = Number(args[3])
  if (isNaN(searchForId) || isNaN(replaceWithId)) {
    throw new GameError(`Correct usage is .edit id find_id replace_id`, playerId)
  }

  const blocksById = getPwBlocksByPwId()
  if (!(searchForId in blocksById) || !(replaceWithId in blocksById)) {
    throw new GameError(`Invalid id specified`, playerId)
  }

  if (searchForId === 0) {
    throw new GameError(`find_id=0 is not allowed`, playerId)
  }

  const searchForBlock = blocksById[searchForId]
  const replaceWithBlock = blocksById[replaceWithId]

  if (replaceWithId === 0) {
    replaceWithBlock.Layer = searchForBlock.Layer
  }

  if (searchForBlock.Layer !== replaceWithBlock.Layer) {
    throw new GameError(`find and replace block layers must match`, playerId)
  }

  if (
    (searchForBlock.BlockDataArgs !== undefined || replaceWithBlock.BlockDataArgs !== undefined) &&
    !isEqual(searchForBlock.BlockDataArgs, replaceWithBlock.BlockDataArgs)
  ) {
    throw new GameError(`find and replace block arguments must match`, playerId)
  }

  const editedBlocks: WorldBlock[] = []

  let counter = 0
  getPlayerCopyBotData()[playerId].selectedBlocks = getPlayerCopyBotData()[playerId].selectedBlocks.map(
    (worldBlock) => {
      if (worldBlock.block.bId !== searchForId) {
        return worldBlock
      } else {
        const deepBlock = cloneDeep(worldBlock)
        deepBlock.block = new Block(replaceWithId, worldBlock.block.args)
        counter++
        editedBlocks.push(deepBlock)
        return deepBlock
      }
    },
  )
  sendPrivateChatMessage(`${counter} blocks changed ${searchForId} to ${replaceWithId}`, playerId)
  return editedBlocks
}

type mathOp = (a: number, b: number) => number

function editArithmeticCommand(args: string[], playerId: number, op: mathOp, opPast: string): WorldBlock[] {
  const amount = Number(args[2])
  if (isNaN(amount)) {
    throw new GameError(`Correct usage is .edit math_op number [name_find]`, playerId)
  }

  const searchFor = args[3]?.toUpperCase() ?? ''
  let counter = 0

  const editedBlocks: WorldBlock[] = []

  getPlayerCopyBotData()[playerId].selectedBlocks = getPlayerCopyBotData()[playerId].selectedBlocks.map(
    (worldBlock) => {
      if (searchFor === '' || worldBlock.block.name.includes(searchFor)) {
        if (worldBlock.block.args.length !== 0) {
          const deepBlock = cloneDeep(worldBlock)
          if (deepBlock.block.name === (PwBlockName.SWITCH_LOCAL_ACTIVATOR as string)) {
            deepBlock.block.args[0] = Math.floor(op(deepBlock.block.args[0] as number, amount))
            editedBlocks.push(deepBlock)
            return deepBlock
          }
          deepBlock.block.args = deepBlock.block.args.map((arg) => {
            if (typeof arg === 'number') {
              counter++
              return Math.floor(op(arg, amount))
            } else {
              return arg
            }
          })
          editedBlocks.push(deepBlock)
          return deepBlock
        }
      }
      return worldBlock
    },
  )
  sendPrivateChatMessage(`${counter} blocks ${opPast} by ${amount}`, playerId)
  return editedBlocks
}

function editDivideCommand(args: string[], playerId: number): WorldBlock[] {
  if (Number(args[2]) <= 0) {
    throw new GameError(`Cannot divide by zero or negative numbers.`, playerId)
  }
  return editArithmeticCommand(args, playerId, (a, b) => a / b, 'divided')
}

function editMultiplyCommand(args: string[], playerId: number): WorldBlock[] {
  if (Number(args[2]) < 0) {
    throw new GameError(`Cannot multiply by negative numbers.`, playerId)
  }
  return editArithmeticCommand(args, playerId, (a, b) => a * b, 'multiplied')
}

function editAddCommand(args: string[], playerId: number): WorldBlock[] {
  return editArithmeticCommand(args, playerId, (a, b) => a + b, 'added')
}

function editSubCommand(args: string[], playerId: number): WorldBlock[] {
  return editArithmeticCommand(args, playerId, (a, b) => a - b, 'subtracted')
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
        } else if (blockIsPortal(pastePosBlock.block.name)) {
          if (pastePosBlock.block.bId === nextBlockX.block.bId) {
            const nextBlockXPortalId = portalIdToNumber(nextBlockX.block.args[i] as string)
            const pastePosBlockPortalId = portalIdToNumber(pastePosBlock.block.args[i] as string)
            const blockCopyPortalId = portalIdToNumber(blockCopy.block.args[i] as string)
            if (
              nextBlockXPortalId !== undefined &&
              pastePosBlockPortalId !== undefined &&
              blockCopyPortalId !== undefined
            ) {
              const diffX = nextBlockXPortalId - pastePosBlockPortalId
              blockCopy.block.args[i] = (blockCopyPortalId + diffX * repetitionX).toString()
            }
          }
          if (pastePosBlock.block.bId === nextBlockY.block.bId) {
            const nextBlockYPortalId = portalIdToNumber(nextBlockY.block.args[i] as string)
            const pastePosBlockPortalId = portalIdToNumber(pastePosBlock.block.args[i] as string)
            const blockCopyPortalId = portalIdToNumber(blockCopy.block.args[i] as string)
            if (
              nextBlockYPortalId !== undefined &&
              pastePosBlockPortalId !== undefined &&
              blockCopyPortalId !== undefined
            ) {
              const diffY = nextBlockYPortalId - pastePosBlockPortalId
              blockCopy.block.args[i] = (blockCopyPortalId + diffY * repetitionY).toString()
            }
          }
        }
      }
    }
    return blockCopy
  })
}

function getSelectedAreaAsEmptyBlocks(botData: CopyBotData) {
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

function applyMoveMode(botData: CopyBotData, allBlocks: WorldBlock[]) {
  // TODO: There is an issue, where quickly spamming blue coins to move selected blocks, will cause some blocks to remain permanent, even though move should be non destructive.
  //  I have no idea what causes it and how to fix it.
  if (!botData.moveEnabled) {
    return allBlocks
  }

  let resultBlocks: WorldBlock[] = []
  const replacedByLastMoveOperationBlocksMap = new Map(
    botData.replacedByLastMoveOperationBlocks.map((block) => [`${block.layer},${block.pos.x},${block.pos.y}`, block]),
  )
  const replacedByLastMoveOperationBlocks = allBlocks.map(
    (block) =>
      replacedByLastMoveOperationBlocksMap.get(`${block.layer},${block.pos.x},${block.pos.y}`) ?? {
        pos: block.pos,
        layer: block.layer,
        block: getBlockAt(block.pos, block.layer),
      },
  )

  if (botData.moveOperationPerformedOnce) {
    resultBlocks = botData.replacedByLastMoveOperationBlocks
  }
  const emptyBlocks = getSelectedAreaAsEmptyBlocks(botData)
  resultBlocks = mergeWorldBlocks(resultBlocks, emptyBlocks)
  resultBlocks = mergeWorldBlocks(resultBlocks, allBlocks)

  botData.moveOperationPerformedOnce = true

  botData.replacedByLastMoveOperationBlocks = replacedByLastMoveOperationBlocks
  return resultBlocks
}

function filterByLayerMasks(allBlocks: WorldBlock[], botData: CopyBotData) {
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

    return true
  })
}

function pasteBlocks(botData: CopyBotData, blockPos: Point) {
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
      const pastePosBlocksFromPosOffsetX = pastePosBlocksFromPos.x + x * offsetSize.x
      const pastePosBlocksToPosOffsetX = pastePosBlocksToPos.x + x * offsetSize.x
      if (
        (pastePosBlocksFromPosOffsetX >= mapWidth || pastePosBlocksFromPosOffsetX < 0) &&
        (pastePosBlocksToPosOffsetX >= mapWidth || pastePosBlocksToPosOffsetX < 0)
      ) {
        break
      }
      for (let y = 0; y < Math.abs(botData.repeatVec.y); y++) {
        const pastePosBlocksFromPosOffsetY = pastePosBlocksFromPos.y + y * offsetSize.y
        const pastePosBlocksToPosOffsetY = pastePosBlocksToPos.y + y * offsetSize.y
        if (
          (pastePosBlocksFromPosOffsetY >= mapHeight || pastePosBlocksFromPosOffsetY < 0) &&
          (pastePosBlocksToPosOffsetY >= mapHeight || pastePosBlocksToPosOffsetY < 0)
        ) {
          break
        }

        const offsetPos = vec2(pastePosBlocksFromPosOffsetX, pastePosBlocksFromPosOffsetY)

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

function resetMoveModeData(botData: CopyBotData) {
  botData.moveOperationPerformedOnce = false
  botData.replacedByLastMoveOperationBlocks = []
}

function selectBlocks(botData: CopyBotData, blockPos: Point, playerId: number) {
  let selectedTypeText: string
  if ([CopyBotState.NONE, CopyBotState.SELECTED_TO].includes(botData.botState)) {
    selectedTypeText = 'from'
    botData.botState = CopyBotState.SELECTED_FROM
    botData.selectedFromPos = blockPos
  } else {
    selectedTypeText = 'to'
    botData.botState = CopyBotState.SELECTED_TO
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

    resetMoveModeData(botData)
  }

  sendPrivateChatMessage(`Selected ${selectedTypeText} x: ${blockPos.x} y: ${blockPos.y}`, playerId)
}

function updateWorldImportFinished(data: ProtoGen.WorldBlockPlacedPacket) {
  // Not really reliable, but good enough
  if (usePwClientStore().totalBlocksLeftToReceiveFromWorldImport > 0) {
    usePwClientStore().totalBlocksLeftToReceiveFromWorldImport -= data.positions.length
    if (usePwClientStore().totalBlocksLeftToReceiveFromWorldImport <= 0) {
      usePwClientStore().totalBlocksLeftToReceiveFromWorldImport = 0
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
  if (!(playerId in getPlayerCopyBotData())) {
    getPlayerCopyBotData()[playerId] = createBotData()
  }
  return getPlayerCopyBotData()[playerId]
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
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

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
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  const worldBlocks = createOldWorldBlocks(data.positions, states.oldBlocks)
  void placeMultipleBlocks(worldBlocks)

  const MAX_BLUE_COINS_EXPECTED_PER_PACKET = 4
  if (data.positions.length > MAX_BLUE_COINS_EXPECTED_PER_PACKET) {
    return
  }

  const botData = getBotData(playerId)

  if (botData.botState !== CopyBotState.SELECTED_TO) {
    throw new GameError('You need to select area first', playerId)
  }

  if (botData.moveEnabled) {
    const blockPos = data.positions[data.positions.length - 1]
    pasteBlocks(botData, blockPos)
  } else {
    // We want to prevent paste happening when player accidentally uses fill or brush tool
    // But simultaneously, if player drags blue coin across the map, there could be multiple blue coins in single packet
    // This is not ideal, but good enough
    for (const blockPos of data.positions) {
      pasteBlocks(botData, blockPos)
    }
  }
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
