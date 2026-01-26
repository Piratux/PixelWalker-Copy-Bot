import {
  getPwApiClient,
  getPwBlocks,
  getPwBlocksByPwId,
  getPwBotType,
  getPwGameClient,
  getPwGameWorldHelper,
} from '@/core/store/PwClientStore.ts'
import { Block, IPlayer, LayerType, Point } from 'pw-js-world'
import { cloneDeep, isEqual } from 'lodash-es'
import { CopyBotData, createBotData } from '@/copybot/type/CopyBotData.ts'
import { getPlayerCopyBotData } from '@/copybot/store/CopyBotStore.ts'
import { CopyBotState } from '@/copybot/enum/CopyBotState.ts'
import { sendGlobalChatMessage, sendPrivateChatMessage } from '@/core/service/ChatMessageService.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { vec2 } from '@basementuniverse/vec'
import {
  applyPosOffsetForBlocks,
  convertDeserializedStructureToWorldBlocks,
  getAnotherWorldBlocks,
  getBlockAt,
  getBlockIdFromString,
  getBlockLayer,
  getBlockName,
  getDeserialisedStructureSection,
  mergeWorldBlocks,
  numberAndStringArrayTypesMatch,
  placeMultipleBlocks,
  placeWorldDataBlocks,
  portalIdToNumberAndStringArray,
} from '@/core/service/WorldService.ts'
import { addUndoItemWorldBlock, performRedo, performUndo } from '@/copybot/service/UndoRedoService.ts'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import { AnyBlockField, ProtoGen } from 'pw-js-api'
import {
  commonPlayerInitPacketReceived,
  createEmptyBlocksFullWorldSize,
  handlePlaceBlocksResult,
  hotReloadCallbacks,
  requirePlayerAndBotEditPermission,
  updateAwaitedWorldBlockPlacedPackets,
} from '@/core/service/PwClientService.ts'
import { isDeveloper, isWorldOwner, requireDeveloper } from '@/core/util/Environment.ts'
import { getWorldIdIfUrl } from '@/core/util/WorldIdExtractor.ts'
import { handleException } from '@/core/util/Exception.ts'
import { GameError } from '@/core/class/GameError.ts'
import { TOTAL_PW_LAYERS } from '@/core/constant/General.ts'
import { CallbackEntry } from '@/core/type/CallbackEntry.ts'
import { BotType } from '@/core/enum/BotType.ts'
import { CopyBotCommandName } from '@/copybot/enum/CopyBotCommandName.ts'
import { CopyBotMaskCommandMode } from '@/copybot/enum/CopyBotMaskCommandMode.ts'
import {
  createColourOutOfBoundsErrorString,
  createImportCommandDestinationAreaOutOfBoundsError,
  createImportCommandSourceAreaOutOfBoundsError,
  createPortalIdTooLongErrorString,
  createUnrecognisedMaskModeError,
} from '@/copybot/service/CopyBotErrorService.ts'
import { getExportedToEelvlData } from '@/webtool/eelvl/service/EelvlExporterService.ts'
import { getImportedFromEelvlData } from '@/webtool/eelvl/service/EelvlImporterService.ts'
import { bufferToArrayBuffer } from '@/core/util/Buffers.ts'
import { colourToUint32, uint32ToColour } from '@/core/util/Colours.ts'
import { mapGetOrInsert } from '@/core/util/MapGetOrInsert.ts'
import { modulo } from '@/core/util/Modulo.ts'

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

  // For some bizarre reason, printing lots of console logs, significantly slows down vitest test runs.
  // See: https://github.com/vitest-dev/vitest/issues/8982
  // client.addCallback('debug', console.log)

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

  // Joey from PW mentioned players complained when they all got pings on private messages when bot joins
  if (getPwGameWorldHelper().meta?.owner !== 'JOEY') {
    sendPrivateChatMessage('Copy Bot is here! Type .help to show usage!', playerId)
  }
}

async function playerChatPacketReceived(data: ProtoGen.PlayerChatPacket) {
  if (!data.message.startsWith('.')) {
    return
  }

  await commandReceived(data.message, data.playerId!)
}

export async function commandReceived(message: string, playerId: number) {
  const command = message.split(' ')
  const commandName = command[0].toLowerCase().slice(1)
  const commandArgs = command.slice(1)

  switch (commandName as CopyBotCommandName) {
    case CopyBotCommandName.HELP:
      helpCommandReceived(commandArgs, playerId)
      break
    case CopyBotCommandName.PING:
      sendPrivateChatMessage('pong', playerId)
      break
    case CopyBotCommandName.EDIT:
      editCommandReceived(commandArgs, playerId)
      break
    case CopyBotCommandName.FLIP:
      flipCommandReceived(commandArgs, playerId)
      break
    case CopyBotCommandName.PASTE:
      await pasteCommandReceived(commandArgs, playerId, false)
      break
    case CopyBotCommandName.SMART_PASTE:
      await pasteCommandReceived(commandArgs, playerId, true)
      break
    case CopyBotCommandName.SNAKE:
      snakeCommandReceived(commandArgs, playerId)
      break
    case CopyBotCommandName.UNDO:
      undoCommandReceived(commandArgs, playerId)
      break
    case CopyBotCommandName.REDO:
      redoCommandReceived(commandArgs, playerId)
      break
    case CopyBotCommandName.MOVE:
      moveCommandReceived(commandArgs, playerId)
      break
    case CopyBotCommandName.MASK:
      maskCommandReceived(commandArgs, playerId)
      break
    case CopyBotCommandName.SKIP_AIR:
      skipairCommandReceived(commandArgs, playerId)
      break
    case CopyBotCommandName.IMPORT:
      await importCommandReceived(commandArgs, playerId)
      break
    // DEV commands
    case CopyBotCommandName.PLACE_ALL:
      await placeallCommandReceived(commandArgs, playerId)
      break
    case CopyBotCommandName.PLACE_EELVL_EXPORT:
      await placeEelvlExportCommandReceived(commandArgs, playerId)
      break
    case CopyBotCommandName.PRINT_BLOCKS:
      printblocksCommandReceived(commandArgs, playerId)
      break
    default:
      throw new GameError('Unrecognised command. Type .help to see all commands', playerId)
  }
}

function maskCommandReceived(args: string[], playerId: number) {
  for (const arg of args) {
    // TODO: remove later
    if (arg === 'nonair') {
      throw new GameError('The "nonair" mask mode has been removed. Use ".skipair" command instead', playerId)
    }

    if (!Object.values(CopyBotMaskCommandMode).includes(arg as CopyBotMaskCommandMode)) {
      throw createUnrecognisedMaskModeError(arg, playerId)
    }
  }

  if (args.length === 0) {
    throw new GameError(`Correct usage is .mask [default | background | foreground | overlay]`, playerId)
  }

  const botData = getBotData(playerId)

  botData.maskBackgroundEnabled = false
  botData.maskForegroundEnabled = false
  botData.maskOverlayEnabled = false

  if (args.includes(CopyBotMaskCommandMode.DEFAULT)) {
    botData.maskBackgroundEnabled = true
    botData.maskForegroundEnabled = true
    botData.maskOverlayEnabled = true
    sendPrivateChatMessage(`Mask default enabled`, playerId)
  }

  if (args.includes(CopyBotMaskCommandMode.BACKGROUND)) {
    botData.maskBackgroundEnabled = true
    sendPrivateChatMessage(`Mask background enabled`, playerId)
  }

  if (args.includes(CopyBotMaskCommandMode.FOREGROUND)) {
    botData.maskForegroundEnabled = true
    sendPrivateChatMessage(`Mask foreground enabled`, playerId)
  }

  if (args.includes(CopyBotMaskCommandMode.OVERLAY)) {
    botData.maskOverlayEnabled = true
    sendPrivateChatMessage(`Mask overlay enabled`, playerId)
  }
}

function skipairCommandReceived(_args: string[], playerId: number) {
  const botData = getBotData(playerId)
  botData.skipAirEnabled = !botData.skipAirEnabled

  sendPrivateChatMessage(`Skip air ${botData.skipAirEnabled ? 'enabled' : 'disabled'}`, playerId)
}

function moveCommandReceived(_args: string[], playerId: number) {
  const botData = getBotData(playerId)
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
      if (singleBlock.Fields.some((f) => f.Required)) {
        // TODO: required field may not always be a string
        const args = Object.fromEntries(singleBlock.Fields.map((f) => [f.Name, '0']))
        worldBlock = { block: new Block(singleBlock.Id, args), layer: singleBlock.Layer, pos }
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

async function placeEelvlExportCommandReceived(_args: string[], playerId: number) {
  requireDeveloper(playerId)
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  const everyBlockWorldId = 'ewki341n7ve153l'
  const everyBlockWorldData = await getAnotherWorldBlocks(everyBlockWorldId, getPwApiClient())

  const eelvlExportResult = getExportedToEelvlData(everyBlockWorldData)
  const eelvlImportResult = getImportedFromEelvlData(bufferToArrayBuffer(eelvlExportResult.byteBuffer))

  const success = await placeWorldDataBlocks(eelvlImportResult.blocks)
  handlePlaceBlocksResult(success)
}

function printblocksCommandReceived(_args: string[], playerId: number) {
  requireDeveloper(playerId)
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  const botData = getBotData(playerId)
  console.log(
    botData.selectedBlocks
      .filter((block) => block.block.bId !== 0)
      .map((block) => {
        let result = ''
        const pos = vec2.add(block.pos, botData.selectedFromPos)
        result += `{ pos: vec2(${pos.x}, ${pos.y})`
        result += `, layer: LayerType.${LayerType[block.layer]}`
        result += `, block: new Block(PwBlockName.${block.block.name}`
        if (block.block.hasArgs()) {
          result += `, ${JSON.stringify(block.block.args)}`
        }
        result += `) },`
        return result
      })
      .join('\n'),
  )
}

async function importCommandReceived(args: string[], playerId: number) {
  if (!isDeveloper(playerId) && !isWorldOwner(playerId)) {
    throw new GameError('Command is exclusive to world owners', playerId)
  }

  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  const ERROR_MESSAGE =
    'Correct usage is .import world_id [src_from_x src_from_y src_to_x src_to_y dest_to_x dest_to_y]'

  if (![1, 7].includes(args.length)) {
    throw new GameError(ERROR_MESSAGE, playerId)
  }

  const worldId = getWorldIdIfUrl(args[0])

  sendGlobalChatMessage(`Importing world from ${worldId}`)

  const blocksFromAnotherWorld = await getAnotherWorldBlocks(worldId, getPwApiClient())

  const partialImportUsed = args.length === 7
  let allBlocks: WorldBlock[]
  if (partialImportUsed) {
    const numberArgs = args.slice(1, 7).map(Number)
    if (numberArgs.some((n) => !isFinite(n))) {
      throw new GameError(ERROR_MESSAGE, playerId)
    }
    let [srcFromX, srcFromY, srcToX, srcToY, destToX, destToY] = numberArgs

    const mapWidth = getPwGameWorldHelper().width
    const mapHeight = getPwGameWorldHelper().height
    const pasteSizeX = srcToX - srcFromX + 1
    const pasteSizeY = srcToY - srcFromY + 1
    if (destToX < 0 || destToY < 0 || destToX + pasteSizeX > mapWidth || destToY + pasteSizeY > mapHeight) {
      throw createImportCommandDestinationAreaOutOfBoundsError(playerId, destToX, destToY, pasteSizeX, pasteSizeY)
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

    if (
      srcFromX < 0 ||
      srcFromY < 0 ||
      srcToX + 1 > blocksFromAnotherWorld.width ||
      srcToY + 1 > blocksFromAnotherWorld.height
    ) {
      throw createImportCommandSourceAreaOutOfBoundsError(
        playerId,
        srcFromX,
        srcFromY,
        srcToX,
        srcToY,
        0,
        0,
        blocksFromAnotherWorld.width - 1,
        blocksFromAnotherWorld.height - 1,
      )
    }

    const partialBlocks = getDeserialisedStructureSection(blocksFromAnotherWorld, srcFromX, srcFromY, srcToX, srcToY)
    allBlocks = convertDeserializedStructureToWorldBlocks(partialBlocks, vec2(destToX, destToY))
  } else {
    const emptyBlocks = createEmptyBlocksFullWorldSize(getPwGameWorldHelper())
    const emptyBlocksWorldBlocks = convertDeserializedStructureToWorldBlocks(emptyBlocks)
    const worldDataWorldBlocks = convertDeserializedStructureToWorldBlocks(blocksFromAnotherWorld)
    allBlocks = mergeWorldBlocks(emptyBlocksWorldBlocks, worldDataWorldBlocks)
  }

  const botData = getBotData(playerId)
  allBlocks = filterByLayerMasks(allBlocks, botData)
  allBlocks = filterBySkipAir(allBlocks, botData)
  addUndoItemWorldBlock(botData, allBlocks)

  const success = await placeMultipleBlocks(allBlocks)
  handlePlaceBlocksResult(success)
}

function helpCommandReceived(args: string[], playerId: number) {
  if (args.length == 0) {
    sendPrivateChatMessage('Gold coin - select blocks', playerId)
    sendPrivateChatMessage('Blue coin - paste blocks', playerId)
    sendPrivateChatMessage(
      'Commands: .help .ping .paste .smartpaste .undo .redo .import .edit .move .mask .flip .snake',
      playerId,
    )
    sendPrivateChatMessage('See more info about each command via .help [command]', playerId)
    sendPrivateChatMessage('You can also use the bot: piratux.github.io/PixelWalker-Copy-Bot/', playerId)
    return
  }

  let commandName = args[0]

  if (commandName.startsWith('.')) {
    commandName = commandName.slice(1)
  }

  switch (commandName as CopyBotCommandName) {
    case CopyBotCommandName.PING:
      sendPrivateChatMessage('.ping - check if bot is alive by pinging it.', playerId)
      sendPrivateChatMessage(`Example usage: .ping`, playerId)
      break
    case CopyBotCommandName.HELP:
      sendPrivateChatMessage(
        '.help [command] - get general help, or if command is specified, get help about command.',
        playerId,
      )
      sendPrivateChatMessage(`Example usage: .help paste`, playerId)
      break
    case CopyBotCommandName.EDIT:
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
    case CopyBotCommandName.FLIP:
      sendPrivateChatMessage('.flip [h | v] - flips selected blocks horizontally or vertically.', playerId)
      sendPrivateChatMessage(`Example usage: .flip v`, playerId)
      break
    case CopyBotCommandName.PASTE:
      sendPrivateChatMessage('.paste x_times y_times [x_spacing y_spacing] - repeat next paste (x/y)_times.', playerId)
      sendPrivateChatMessage('(x/y)_spacing - gap size to leave between pastes.', playerId)
      sendPrivateChatMessage(`Example usage 1: .paste 2 3`, playerId)
      sendPrivateChatMessage(`Example usage 2: .paste 2 3 4 1`, playerId)
      break
    case CopyBotCommandName.SMART_PASTE:
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
    case CopyBotCommandName.UNDO:
      sendPrivateChatMessage('.undo [count] - undoes last paste performed by bot "count" times', playerId)
      sendPrivateChatMessage(`Example usage 1: .undo`, playerId)
      sendPrivateChatMessage(`Example usage 2: .undo 3`, playerId)
      break
    case CopyBotCommandName.REDO:
      sendPrivateChatMessage('.redo [count] - redoes last paste performed by bot "count" times', playerId)
      sendPrivateChatMessage(`Example usage 1: .redo`, playerId)
      sendPrivateChatMessage(`Example usage 2: .redo 3`, playerId)
      break
    case CopyBotCommandName.MOVE:
      sendPrivateChatMessage('.move - enables move mode, which deletes blocks in last selected area', playerId)
      sendPrivateChatMessage('Use this command again to disable this mode', playerId)
      break
    case CopyBotCommandName.MASK:
      sendPrivateChatMessage(
        '.mask [default | background | foreground | overlay] - masks layers or non empty blocks when pasting',
        playerId,
      )
      sendPrivateChatMessage(
        `Example usage 1: .mask foreground background (only pastes foreground and background blocks)`,
        playerId,
      )
      sendPrivateChatMessage(
        `Example usage 2: .mask default (shorthand for .mask background foreground overlay)`,
        playerId,
      )
      break
    case CopyBotCommandName.SKIP_AIR:
      sendPrivateChatMessage(
        '.skipair - enables skip air mode, which ignores empty blocks from selection when pasting',
        playerId,
      )
      sendPrivateChatMessage('Useful for copy pasting non square areas', playerId)
      sendPrivateChatMessage('Use this command again to disable this mode', playerId)
      break
    case CopyBotCommandName.IMPORT:
      sendPrivateChatMessage('.import world_id [src_from_x src_from_y src_to_x src_to_y dest_to_x dest_to_y]', playerId)
      sendPrivateChatMessage('Copies blocks from world with "world_id" and places them into current world', playerId)
      sendPrivateChatMessage('src_from_(x/y) - top left corner position to copy from', playerId)
      sendPrivateChatMessage('src_to_(x/y) - bottom right corner position to copy to', playerId)
      sendPrivateChatMessage('dest_to_(x/y) - top left corner position to paste to', playerId)
      sendPrivateChatMessage(`Example usage 1: .import https://pixelwalker.net/world/9gf53f4qf5z1f42`, playerId)
      sendPrivateChatMessage(`Example usage 2: .import legacy:PW4gnKMssUb0I 2 4 25 16 2 4`, playerId)
      break
    case CopyBotCommandName.SNAKE:
      sendPrivateChatMessage('Correct usage is .snake [off | on time offset hideclock]', playerId)
      sendPrivateChatMessage(
        'Enables/disables snake mode - placing blue coins automatically increments time door offset',
        playerId,
      )
      sendPrivateChatMessage('on/off - enables/disables snake mode', playerId)
      sendPrivateChatMessage('time - time parameter in seconds', playerId)
      sendPrivateChatMessage('offset - offset parameter in seconds', playerId)
      sendPrivateChatMessage('hideclock - hide clock parameter. Allowed values "on" and "off"', playerId)
      sendPrivateChatMessage(`Example usage 1: .snake on 2.3 3.1 on`, playerId)
      sendPrivateChatMessage(`Example usage 2: .snake off`, playerId)
      break
    // DEV commands
    case CopyBotCommandName.PLACE_ALL:
      sendPrivateChatMessage(
        '.placeall - dev command that places all PixelWalker blocks returned from /listblocks endpoint',
        playerId,
      )
      sendPrivateChatMessage('This command is used in "Every Block" world (ewki341n7ve153l)', playerId)
      break
    case CopyBotCommandName.PLACE_EELVL_EXPORT:
      sendPrivateChatMessage(
        '.placeeelvlexport - dev command that exports "Every Block" world (ewki341n7ve153l) as eelvl and imports to this world',
        playerId,
      )
      sendPrivateChatMessage('This command is used in "Test EELVL export" world (ra9285102d4a41a)', playerId)
      break
    case CopyBotCommandName.PRINT_BLOCKS:
      sendPrivateChatMessage('.printblocks - dev command that prints selected blocks to console', playerId)
      sendPrivateChatMessage('This is useful when writing tests', playerId)
      break
    default:
      throw new GameError(`Unrecognised command ${commandName}. Type .help to see all commands`, playerId)
  }
}

function undoCommandReceived(args: string[], playerId: number) {
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  let count = 1
  if (args.length >= 1) {
    count = Number(args[0])
    if (!isFinite(count)) {
      throw new GameError(`Correct usage is .undo [count]`, playerId)
    }
  }
  const botData = getBotData(playerId)
  performUndo(botData, playerId, count)
}

function redoCommandReceived(args: string[], playerId: number) {
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  let count = 1
  if (args.length >= 1) {
    count = Number(args[0])
    if (!isFinite(count)) {
      throw new GameError(`Correct usage is .redo [count]`, playerId)
    }
  }
  const botData = getBotData(playerId)
  performRedo(botData, playerId, count)
}

async function pasteCommandReceived(args: string[], playerId: number, smartPaste: boolean) {
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  const ERROR_MESSAGE = `Correct usage is ${smartPaste ? '.smartpaste' : '.paste'} x_times y_times [x_spacing y_spacing]`
  const repeatX = Number(args[0])
  const repeatY = Number(args[1])
  if (!isFinite(repeatX) || !isFinite(repeatY)) {
    throw new GameError(ERROR_MESSAGE, playerId)
  }

  let spacingX = 0
  let spacingY = 0
  if (args.length >= 4) {
    spacingX = Number(args[2])
    spacingY = Number(args[3])
    if (!isFinite(spacingX) || !isFinite(spacingY)) {
      throw new GameError(ERROR_MESSAGE, playerId)
    }
  }

  const botData = getBotData(playerId)

  if (botData.botState !== CopyBotState.SELECTED_TO) {
    throw new GameError('You need to select area first', playerId)
  }

  botData.repeatVec = vec2(repeatX, repeatY)
  botData.spacingVec = vec2(spacingX, spacingY)
  botData.smartRepeatEnabled = smartPaste

  try {
    await pasteBlocks(botData, botData.selectedFromPos)
    sendPrivateChatMessage(
      `Selection repeated ${repeatX}x${repeatY} times` +
        (spacingX !== 0 && spacingY !== 0 ? ` with spacing ${spacingX}x${spacingY}` : ''),
      playerId,
    )
  } catch (e) {
    // pasteBlocks doesn't know about playerId, so we catch and rethrow it with playerId
    if (e instanceof GameError) {
      throw new GameError(e.message, playerId)
    }
    throw e
  }
}

function snakeCommandReceived(args: string[], playerId: number) {
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  const CORRECT_COMMAND_USAGE = `Correct usage is .snake [off | on time offset hideclock]`

  if (args.length === 1) {
    if (args[0].toLowerCase() !== 'off') {
      throw new GameError(CORRECT_COMMAND_USAGE, playerId)
    }

    const botData = getBotData(playerId)
    botData.snakeModeEnabled = false
    sendPrivateChatMessage(`Snake mode disabled`, playerId)
  }

  if (args.length === 4) {
    if (args[0].toLowerCase() !== 'on') {
      throw new GameError(CORRECT_COMMAND_USAGE, playerId)
    }

    const time = Number(args[1])
    const offset = Number(args[2])
    if (isNaN(time) || isNaN(offset)) {
      throw new GameError(CORRECT_COMMAND_USAGE, playerId)
    }

    const hideClock = args[3].toLowerCase() === 'on'

    if (offset < 0 || time * 2 < offset) {
      throw new GameError('Offset must be in range [0, 2 * time]', playerId)
    }

    if (time < 0.5) {
      throw new GameError('Time must be greater than 0', playerId)
    }

    const botData = getBotData(playerId)
    botData.snakeModeTime = time * 100
    botData.snakeModeCurrentOffset = offset * 100
    botData.snakeModeHideClock = hideClock
    botData.snakeModeEnabled = true

    sendPrivateChatMessage(`Snake mode enabled`, playerId)
  }
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

  if (getBotData(playerId).selectedBlocks.length === 0) {
    throw new GameError(`Select blocks before replacing them!`, playerId)
  }

  let editedBlocks: WorldBlock[] = []
  switch (args[0]?.toLowerCase()) {
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
  let searchFor = args[1]
  let replaceWith = args[2]
  if (searchFor === '' || replaceWith === '') {
    throw new GameError(`Correct usage is .edit name find replace`, playerId)
  }

  searchFor = searchFor.toUpperCase()
  replaceWith = replaceWith.toUpperCase()
  let counter = 0
  const copyNamesFound: Set<string> = new Set<string>()
  let warning = ''

  const editedBlocks: WorldBlock[] = []
  const botData = getBotData(playerId)
  botData.selectedBlocks = botData.selectedBlocks.map((worldBlock) => {
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
  })
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
  const searchForId = Number(args[1])
  const replaceWithId = Number(args[2])
  if (isNaN(searchForId) || isNaN(replaceWithId)) {
    throw new GameError(`Correct usage is .edit id find_id replace_id`, playerId)
  }

  if (searchForId === 0) {
    throw new GameError(`find_id=0 is not allowed`, playerId)
  }

  const blocksById = getPwBlocksByPwId()

  const searchForBlock = blocksById.get(searchForId)
  const replaceWithBlock = blocksById.get(replaceWithId)
  if (searchForBlock === undefined) {
    throw new GameError(`Invalid id specified: find_id=${searchForId}`, playerId)
  }
  if (replaceWithBlock === undefined) {
    throw new GameError(`Invalid id specified: replace_id=${replaceWithId}`, playerId)
  }

  if (replaceWithId === 0) {
    replaceWithBlock.Layer = searchForBlock.Layer
  }

  if (searchForBlock.Layer !== replaceWithBlock.Layer) {
    throw new GameError(`find and replace block layers must match`, playerId)
  }

  if (
    (searchForBlock.Fields !== undefined || replaceWithBlock.Fields !== undefined) &&
    !isEqual(searchForBlock.Fields, replaceWithBlock.Fields)
  ) {
    throw new GameError(`find and replace block arguments must match`, playerId)
  }

  const editedBlocks: WorldBlock[] = []

  let counter = 0
  const botData = getBotData(playerId)
  botData.selectedBlocks = botData.selectedBlocks.map((worldBlock) => {
    if (worldBlock.block.bId !== searchForId) {
      return worldBlock
    } else {
      const deepBlock = cloneDeep(worldBlock)
      deepBlock.block = new Block(replaceWithId, worldBlock.block.args)
      counter++
      editedBlocks.push(deepBlock)
      return deepBlock
    }
  })
  sendPrivateChatMessage(`${counter} blocks changed ${searchForId} to ${replaceWithId}`, playerId)
  return editedBlocks
}

type mathOp = (a: number, b: number) => number

function editArithmeticCommand(args: string[], playerId: number, op: mathOp, opPast: string): WorldBlock[] {
  const amount = Number(args[1])
  if (isNaN(amount)) {
    throw new GameError(`Correct usage is .edit math_op number [name_find]`, playerId)
  }

  const searchFor = args[2]?.toUpperCase() ?? ''
  let counter = 0

  const editedBlocks: WorldBlock[] = []
  const botData = getBotData(playerId)
  botData.selectedBlocks = botData.selectedBlocks.map((worldBlock) => {
    if (searchFor === '' || worldBlock.block.name.includes(searchFor)) {
      const deepBlock = cloneDeep(worldBlock)
      deepBlock.block.args = Object.fromEntries(
        Object.entries(deepBlock.block.args).map(([key, value]) => {
          if (typeof value === 'number') {
            counter++
            return [key, Math.floor(op(value, amount))]
          } else {
            return [key, value]
          }
        }),
      )
      editedBlocks.push(deepBlock)
      return deepBlock
    }
    return worldBlock
  })
  sendPrivateChatMessage(`${counter} blocks ${opPast} by ${amount}`, playerId)
  return editedBlocks
}

function editDivideCommand(args: string[], playerId: number): WorldBlock[] {
  if (Number(args[1]) <= 0) {
    throw new GameError(`Cannot divide by zero or negative numbers.`, playerId)
  }
  return editArithmeticCommand(args, playerId, (a, b) => a / b, 'divided')
}

function editMultiplyCommand(args: string[], playerId: number): WorldBlock[] {
  if (Number(args[1]) < 0) {
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

function flipCommandReceived(args: string[], playerId: number) {
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  if (args.length !== 1) {
    throw new GameError(`Correct usage is .flip [h | v]`, playerId)
  }

  const flipMode = args[0].toLowerCase()

  if (!['h', 'v'].includes(flipMode)) {
    throw new GameError(`Correct usage is .flip [h | v]`, playerId)
  }

  const editedBlocks: WorldBlock[] = []

  const botData = getBotData(playerId)

  botData.selectedBlocks = botData.selectedBlocks.map((worldBlock) => {
    if (flipMode === 'h') {
      worldBlock.pos.x = botData.selectionLocalBottomRightPos.x - worldBlock.pos.x
    } else {
      worldBlock.pos.y = botData.selectionLocalBottomRightPos.y - worldBlock.pos.y
    }
    const deepBlock = cloneDeep(worldBlock)
    editedBlocks.push(deepBlock)
    return deepBlock
  })

  placeEditedBlocks(playerId, editedBlocks)
}

function applySmartTransformForBlockWithIntArgument(
  pastePosBlock: WorldBlock,
  nextBlock: WorldBlock,
  argName: string,
  blockCopy: WorldBlock,
  repetition: number,
) {
  if (pastePosBlock.block.bId !== nextBlock.block.bId) {
    return
  }

  const diff = (nextBlock.block.args[argName] as number) - (pastePosBlock.block.args[argName] as number)
  blockCopy.block.args[argName] = (blockCopy.block.args[argName] as number) + diff * repetition
}

// Colour wise smart increment.
// Example:
// - Input: #020FB5, #041FB4
// - Output: #062FB3
function applySmartTransformForBlockWithColorArgument(
  pastePosBlock: WorldBlock,
  nextBlock: WorldBlock,
  argName: string,
  blockCopy: WorldBlock,
  repetition: number,
) {
  if (pastePosBlock.block.bId !== nextBlock.block.bId) {
    return
  }

  const nextBlockColour = uint32ToColour(nextBlock.block.args[argName] as number)
  const pastePosBlockColour = uint32ToColour(pastePosBlock.block.args[argName] as number)
  const blockCopyColour = uint32ToColour(blockCopy.block.args[argName] as number)

  const diffR = nextBlockColour.r - pastePosBlockColour.r
  const diffG = nextBlockColour.g - pastePosBlockColour.g
  const diffB = nextBlockColour.b - pastePosBlockColour.b

  const newR = blockCopyColour.r + diffR * repetition
  const newG = blockCopyColour.g + diffG * repetition
  const newB = blockCopyColour.b + diffB * repetition

  const newColour = { r: newR, g: newG, b: newB }

  try {
    blockCopy.block.args[argName] = colourToUint32(newColour)
  } catch {
    throw new GameError(createColourOutOfBoundsErrorString(newColour))
  }
}

// Smart increment for portals.
// Example:
// - Input: "5", "6"
// - Output: "7"
// Example 2:
// - Input: "a1", "a2"
// - Output: "a3"
// Example 3:
// - Input: "14a3b", "28a5b"
// - Output: "42a7b"
function applySmartTransformForPortalBlock(
  pastePosBlock: WorldBlock,
  nextBlock: WorldBlock,
  argName: string,
  blockCopy: WorldBlock,
  repetition: number,
) {
  if (pastePosBlock.block.bId !== nextBlock.block.bId) {
    return
  }

  const pastePosBlockPortalIdPartArray = portalIdToNumberAndStringArray(pastePosBlock.block.args[argName] as string)
  const nextBlockPortalIdPartArray = portalIdToNumberAndStringArray(nextBlock.block.args[argName] as string)

  if (!numberAndStringArrayTypesMatch(pastePosBlockPortalIdPartArray, nextBlockPortalIdPartArray)) {
    return
  }

  const blockCopyPortalIdPartArray = portalIdToNumberAndStringArray(blockCopy.block.args[argName] as string)

  const portalId = pastePosBlockPortalIdPartArray
    .map((pastePosBlockPortalIdPart, i) => {
      if (typeof pastePosBlockPortalIdPart === 'number') {
        const diff = (nextBlockPortalIdPartArray[i] as number) - pastePosBlockPortalIdPart
        return ((blockCopyPortalIdPartArray[i] as number) + diff * repetition).toString()
      } else {
        return pastePosBlockPortalIdPart
      }
    })
    .join('')

  if (portalId.length > 5) {
    throw new GameError(createPortalIdTooLongErrorString(portalId))
  }

  blockCopy.block.args[argName] = portalId
}

function applyWrapForTimeDoorBlockOffsetAttribute(blockCopy: WorldBlock) {
  blockCopy.block.args.offset = modulo(blockCopy.block.args.offset as number, (blockCopy.block.args.time as number) * 2)
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
      const blockArgTypes: AnyBlockField[] = Block.getFieldsByBlockId(pastePosBlock.block.bId)
      for (const blockArgType of blockArgTypes) {
        const argName = blockArgType.Name
        if (
          blockArgType.Type === 'String' &&
          ['^[a-zA-Z0-9]{0,5}$', '^[a-zA-Z0-9]{1,5}$'].includes(blockArgType.Pattern!)
        ) {
          applySmartTransformForPortalBlock(pastePosBlock, nextBlockX, argName, blockCopy, repetitionX)
          applySmartTransformForPortalBlock(pastePosBlock, nextBlockY, argName, blockCopy, repetitionY)
        } else if (blockArgType.Type === 'UInt32' && blockArgType.MaxValue === 16777215) {
          // if blockArgType.MaxValue === 16777215, then argument is color
          applySmartTransformForBlockWithColorArgument(pastePosBlock, nextBlockX, argName, blockCopy, repetitionX)
          applySmartTransformForBlockWithColorArgument(pastePosBlock, nextBlockY, argName, blockCopy, repetitionY)
        } else if (blockArgType.Type === 'Int32') {
          applySmartTransformForBlockWithIntArgument(pastePosBlock, nextBlockX, argName, blockCopy, repetitionX)
          applySmartTransformForBlockWithIntArgument(pastePosBlock, nextBlockY, argName, blockCopy, repetitionY)

          if ((pastePosBlock.block.name as PwBlockName) === PwBlockName.TIME_DOOR) {
            applyWrapForTimeDoorBlockOffsetAttribute(blockCopy)
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
  let emptyBlocks = getSelectedAreaAsEmptyBlocks(botData)
  emptyBlocks = filterByLayerMasks(emptyBlocks, botData)
  resultBlocks = mergeWorldBlocks(resultBlocks, emptyBlocks)
  resultBlocks = mergeWorldBlocks(resultBlocks, allBlocks)

  botData.moveOperationPerformedOnce = true

  botData.replacedByLastMoveOperationBlocks = replacedByLastMoveOperationBlocks
  return resultBlocks
}

function filterByLayerMasks(allBlocks: WorldBlock[], botData: CopyBotData) {
  if (botData.maskBackgroundEnabled && botData.maskForegroundEnabled && botData.maskOverlayEnabled) {
    return allBlocks
  }

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

function filterBySkipAir(allBlocks: WorldBlock[], botData: CopyBotData) {
  if (!botData.skipAirEnabled) {
    return allBlocks
  }

  return allBlocks.filter((block) => {
    if (block.block.bId === 0) {
      return !botData.skipAirEnabled
    }
    return true
  })
}

export async function pasteBlocks(botData: CopyBotData, blockPos: Point) {
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
        allBlocks.push(...finalBlocks)
      }
    }

    allBlocks = filterByLayerMasks(allBlocks, botData)
    allBlocks = filterBySkipAir(allBlocks, botData)
    allBlocks = applyMoveMode(botData, allBlocks)

    addUndoItemWorldBlock(botData, allBlocks)
    await placeMultipleBlocks(allBlocks)
  } finally {
    botData.repeatVec = vec2(1, 1)
  }
}

function resetMoveModeData(botData: CopyBotData) {
  botData.moveOperationPerformedOnce = false
  botData.replacedByLastMoveOperationBlocks = []
}

export function selectBlocks(botData: CopyBotData, blockPos: Point, playerId: number) {
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

function worldBlockPlacedPacketReceived(
  data: ProtoGen.WorldBlockPlacedPacket,
  states?: { player: IPlayer | undefined; oldBlocks: Block[]; newBlocks: Block[] },
) {
  updateAwaitedWorldBlockPlacedPackets(data)

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

export function getBotData(playerId: number): CopyBotData {
  return mapGetOrInsert(getPlayerCopyBotData(), playerId, createBotData())
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

  if (!botData.snakeModeEnabled) {
    if (botData.botState !== CopyBotState.SELECTED_TO) {
      throw new GameError('You need to select area first', playerId)
    }
  }

  if (botData.snakeModeEnabled) {
    for (const blockPos of data.positions) {
      void placeMultipleBlocks([
        {
          block: new Block(PwBlockName.TIME_DOOR, {
            time: botData.snakeModeTime,
            offset: botData.snakeModeCurrentOffset,
            hide_clock: botData.snakeModeHideClock,
          }),
          layer: LayerType.Foreground,
          pos: blockPos,
        },
      ])
      botData.snakeModeCurrentOffset = modulo(botData.snakeModeCurrentOffset - 10, botData.snakeModeTime * 2)
    }
  } else if (botData.moveEnabled) {
    const blockPos = data.positions[data.positions.length - 1]
    void pasteBlocks(botData, blockPos)
  } else {
    // We want to prevent paste happening when player accidentally uses fill or brush tool
    // But simultaneously, if player drags blue coin across the map, there could be multiple blue coins in single packet
    // This is not ideal, but good enough
    for (const blockPos of data.positions) {
      void pasteBlocks(botData, blockPos)
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
