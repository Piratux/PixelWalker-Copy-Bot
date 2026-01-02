import {
  getPwApiClient,
  getPwBlocks,
  getPwBotType,
  getPwGameClient,
  getPwGameWorldHelper,
} from '@/core/store/PwClientStore.ts'
import { sendGlobalChatMessage, sendPrivateChatMessage, sendRawMessage } from '@/core/service/ChatMessageService.ts'
import { ProtoGen } from 'pw-js-api'
import { CallbackEntry } from '@/core/type/CallbackEntry.ts'
import {
  commonPlayerInitPacketReceived,
  handlePlaceBlocksResult,
  hotReloadCallbacks,
  requirePlayerAndBotEditPermission,
} from '@/core/service/PwClientService.ts'
import { isDeveloper, isWorldOwner, requireDeveloper, requireWorldOwner } from '@/core/util/Environment.ts'
import { vec2 } from '@basementuniverse/vec'
import { cloneDeep, shuffle } from 'lodash-es'
import { Block, DeserialisedStructure, LayerType } from 'pw-js-world'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import {
  blockIsPortal,
  convertDeserializedStructureToWorldBlocks,
  getAnotherWorldBlocks,
  getDeserialisedStructureSectionVec2,
  mergeWorldBlocks,
  placeMultipleBlocks,
  placeWorldDataBlocks,
  placeWorldDataBlocksUsingColumnsLeftToRightPattern,
} from '@/core/service/WorldService.ts'
import { TOTAL_PW_LAYERS } from '@/core/constant/General.ts'
import { getWorldIdIfUrl } from '@/core/util/WorldIdExtractor.ts'
import { BotType } from '@/core/enum/BotType.ts'
import { useBomBotWorldStore } from '@/bombot/store/BomBotWorldStore.ts'
import { BomBotState } from '@/bombot/enum/BomBotState.ts'
import { BomBotMapEntry } from '@/bombot/type/BomBotMapEntry.ts'
import { setCustomTimeout } from '@/core/util/Sleep.ts'
import { BomBotBlockType } from '@/bombot/enum/BomBotBlockType.ts'
import { handleException } from '@/core/util/Exception.ts'
import { useBomBotRoundStore } from '@/bombot/store/BomBotRoundStore.ts'
import { getRandomArrayElement, getRandomInt } from '@/core/util/Random.ts'
import { clamp } from '@/core/util/Numbers.ts'
import { userBomBotAutomaticRestartCounterStore } from '@/bombot/store/BomBotAutomaticRestartCounterStore.ts'
import { BomBotWorldData, createBomBotWorldData } from '@/bombot/type/BomBotPlayerWorldData.ts'
import { BomBotPowerUp } from '@/bombot/enum/BomBotPowerUp.ts'
import { BomBotRoundData, createBomBotRoundData } from '@/bombot/type/BomBotPlayerRoundData.ts'
import { GameError } from '@/core/class/GameError.ts'
import { BomBotPowerUpData } from '@/bombot/type/BomBotPowerUpData.ts'
import { BomBotSpecialBombData } from '@/bombot/type/BomBotSpecialBombData.ts'
import { BomBotSpecialBomb } from '@/bombot/enum/BomBotSpecialBomb.ts'
import { BomBotBombType } from '@/bombot/enum/BomBotBombType.ts'
import { SPECIAL_BOMB_COUNT } from '@/bombot/constant/General.ts'
import { BomBotCommandName } from '@/bombot/enum/BomBotCommandName.ts'
import { workerWaitUntil } from '@/core/util/WorkerWaitUntil.ts'
import { mapGetOrInsert } from '@/core/util/MapGetOrInsert.ts'
import { toRaw } from 'vue'

const blockTypeDataStartPos = vec2(20, 361) // inclusive x
const blockTypeDataEndPos = vec2(389, 361) // exclusive x
const blockTypeDataSpacingY = 3
const mapSize = vec2(22, 11)
const mapTopLeftPos = vec2(39, 45)
const bomberAreaTopLeft = vec2(39, 43)
const mapInfoSignOffset = vec2(10, -2)

// NOTE: it's not a good idea to rely on these being constant, but it will do for now
const TEAM_NONE = 0
const TEAM_RED = 1
const TEAM_GREEN = 2

const callbacks: CallbackEntry[] = [
  { name: 'playerInitPacket', fn: playerInitPacketReceived },
  { name: 'playerJoinedPacket', fn: playerJoinedPacketReceived },
  { name: 'playerChatPacket', fn: playerChatPacketReceived },
  { name: 'playerTeamUpdatePacket', fn: playerTeamUpdatePacketReceived },
  { name: 'playerGodModePacket', fn: playerGodModePacketReceived },
  { name: 'playerResetPacket', fn: playerResetPacketReceived },
  { name: 'playerCountersUpdatePacket', fn: playerCountersUpdatePacketReceived },
  { name: 'playerLeftPacket', fn: playerLeftPacketReceived },
  { name: 'playerMovedPacket', fn: playerMovedPacketReceived },
]

export function registerBomBotCallbacks() {
  const client = getPwGameClient()
  const helper = getPwGameWorldHelper()
  client.addHook(helper.receiveHook)
  // client.addCallback('debug', console.log) // Too laggy to enable it by default
  client.addCallback('error', handleBomBotError)
  for (const cb of callbacks) {
    client.addCallback(cb.name, cb.fn)
  }
}

if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', ({}) => {
    if (getPwBotType() === BotType.BOM_BOT) {
      hotReloadCallbacks(callbacks)
      if (useBomBotWorldStore().currentState !== BomBotState.STOPPED) {
        void autoRestartBomBot()
      }
    }
  })
}

function playerInitPacketReceived() {
  commonPlayerInitPacketReceived()

  getPwGameClient().send('playerGodModePacket', {
    enabled: true,
  })

  sendRawMessage(`/team #${getPwGameWorldHelper().botPlayerId} ${TEAM_RED}`)
}

function removePlayerFromPlayersInGame(playerId: number) {
  useBomBotRoundStore().playersInGame = useBomBotRoundStore().playersInGame.filter((p) => p.playerId !== playerId)
  useBomBotRoundStore().playerIdsBomberQueueOriginal = useBomBotRoundStore().playerIdsBomberQueueOriginal.filter(
    (pId) => pId !== playerId,
  )
  useBomBotRoundStore().playerIdsBomberQueueRemainder = useBomBotRoundStore().playerIdsBomberQueueRemainder.filter(
    (pId) => pId !== playerId,
  )
}

function handleBomBotError(e: unknown) {
  handleException(e)
  // await autoRestartBomBot() // TODO FIX
}

function convertFromPixelPosToBlockPos(pixelPos: vec2): vec2 {
  const blockPos = vec2.div(pixelPos, 16)
  blockPos.x = Math.round(blockPos.x)
  blockPos.y = Math.round(blockPos.y)
  return blockPos
}

function playerMovedPacketReceived(data: ProtoGen.PlayerMovedPacket) {
  checkIfBombPlaced(data)
  checkIfPowerUpUsed(data)
  checkIfBombTypeChanged(data)
  checkIfPowerUpEquipped(data)
  checkIfSpecialBombEquipped(data)
}

function checkIfBombPlaced(data: ProtoGen.PlayerMovedPacket) {
  if (
    !data.spaceJustDown ||
    useBomBotWorldStore().currentState !== BomBotState.PLAYING ||
    data.playerId !== useBomBotRoundStore().bomberPlayerId
  ) {
    return
  }

  if (!useBomBotRoundStore().bombAvailable) {
    return
  }

  if (useBomBotRoundStore().secondsLeftBeforeBomberCanBomb > 0) {
    return
  }

  const playerPos = convertFromPixelPosToBlockPos(data.position!)
  const posX = clamp(playerPos.x, mapTopLeftPos.x, mapTopLeftPos.x + mapSize.x - 1)

  useBomBotRoundStore().bombAvailable = false

  const botData = getPlayerBomBotWorldData(data.playerId)
  const bombPos = getBombSpawnPos(posX)
  if (botData.bombTypeChosen === BomBotBombType.NORMAL) {
    placeStructureInsideMap(useBomBotWorldStore().defaultBombBlocks, bombPos)
    useBomBotRoundStore().lastBombType = null
  } else {
    placeStructureInsideMap(useBomBotWorldStore().specialBombData[botData.specialBombSelected!].blocks, bombPos)
    useBomBotRoundStore().lastBombType = botData.specialBombSelected

    const botRoundData = getPlayerBomBotRoundData(data.playerId)
    botRoundData.specialBombsLeft--

    placeBombTypeIndicators()
  }

  useBomBotRoundStore().lastBombPos = bombPos
  useBomBotRoundStore().secondsLeftBeforeBombMustBeRemoved = 2

  updateAvailablePlayerSpawnPositions()
}

function checkIfPowerUpUsed(data: ProtoGen.PlayerMovedPacket) {
  if (
    useBomBotWorldStore().currentState !== BomBotState.PLAYING ||
    data.playerId === useBomBotRoundStore().bomberPlayerId ||
    !getPlayerIdsInGame().includes(data.playerId!)
  ) {
    return
  }

  const playerPos = convertFromPixelPosToBlockPos(data.position!)

  const upPressed = data.vertical === -1 && data.horizontal === 0
  if (!upPressed) {
    return
  }

  const posBelow = vec2.add(playerPos, vec2(0, 1))
  const foregroundBlockBelow = getPwGameWorldHelper().getBlockAt(posBelow, LayerType.Foreground)
  const overlayBlockBelow = getPwGameWorldHelper().getBlockAt(posBelow, LayerType.Overlay)
  const playerIsInAir =
    useBomBotWorldStore().blockTypes[foregroundBlockBelow.bId] === BomBotBlockType.NON_SOLID &&
    useBomBotWorldStore().blockTypes[overlayBlockBelow.bId] === BomBotBlockType.NON_SOLID
  if (playerIsInAir) {
    return
  }

  const botData = getPlayerBomBotWorldData(data.playerId!)
  if (botData.powerUpSelected === null) {
    return
  }

  const performanceNow = performance.now()
  const upPressedMsDifference = performanceNow - botData.lastTimeUpPressedMs
  const POWERUP_UP_PRESSED_REQUIRED_DIFFERENCE_MS = 200
  botData.lastTimeUpPressedMs = performanceNow

  if (upPressedMsDifference >= POWERUP_UP_PRESSED_REQUIRED_DIFFERENCE_MS) {
    return
  }

  const botRoundData = getPlayerBomBotRoundData(data.playerId!)
  if (botRoundData.powerUpsLeft <= 0) {
    return
  }

  botRoundData.powerUpsLeft--

  // Require people to press powerUp even amount of times to use it.
  // That is, we want to prevent using 2 powerUps when pressing up 3 times quickly.
  botData.lastTimeUpPressedMs = 0

  sendPrivateChatMessage(
    `PowerUp ${BomBotPowerUp[botData.powerUpSelected]} used! ${botRoundData.powerUpsLeft} left`,
    data.playerId!,
  )
  placeStructureInsideMap(useBomBotWorldStore().powerUpData[botData.powerUpSelected].blocks, playerPos)
}

function checkIfBombTypeChanged(data: ProtoGen.PlayerMovedPacket) {
  if (
    useBomBotWorldStore().currentState !== BomBotState.PLAYING ||
    data.playerId !== useBomBotRoundStore().bomberPlayerId
  ) {
    return
  }

  const upPressed = data.vertical === -1 && data.horizontal === 0
  if (!upPressed) {
    return
  }

  const botData = getPlayerBomBotWorldData(data.playerId)
  if (botData.specialBombSelected === null) {
    return
  }

  const botRoundData = getPlayerBomBotRoundData(data.playerId)
  if (botRoundData.specialBombsLeft <= 0) {
    return
  }

  botData.bombTypeChosen =
    botData.bombTypeChosen === BomBotBombType.NORMAL ? BomBotBombType.SPECIAL : BomBotBombType.NORMAL
  placeBombTypIndicatorArrow()

  useBomBotRoundStore().secondsLeftBeforeBomberCanBomb = 2
}

function checkIfPowerUpEquipped(data: ProtoGen.PlayerMovedPacket) {
  const downPressed = data.vertical === 1 && data.horizontal === 0
  if (!downPressed) {
    return
  }

  const playerId = data.playerId!
  const playerPos = convertFromPixelPosToBlockPos(data.position!)
  const botData = getPlayerBomBotWorldData(playerId)
  for (const powerUp of useBomBotWorldStore().powerUpData) {
    if (vec2.eq(playerPos, powerUp.equipPos)) {
      botData.powerUpSelected = powerUp.type
      sendPrivateChatMessage(`PowerUp selected: ${BomBotPowerUp[powerUp.type]}`, playerId)
    }
  }
}

function checkIfSpecialBombEquipped(data: ProtoGen.PlayerMovedPacket) {
  const downPressed = data.vertical === 1 && data.horizontal === 0
  if (!downPressed) {
    return
  }

  const playerId = data.playerId!
  const playerPos = convertFromPixelPosToBlockPos(data.position!)
  const botData = getPlayerBomBotWorldData(playerId)
  for (const specialBomb of useBomBotWorldStore().specialBombData) {
    if (vec2.eq(playerPos, specialBomb.equipPos)) {
      botData.specialBombSelected = specialBomb.type
      sendPrivateChatMessage(`Special bomb selected: ${BomBotSpecialBomb[specialBomb.type]}`, playerId)
    }
  }
}

function placeStructureInsideMap(blocks: WorldBlock[], pos: vec2) {
  let worldBlocks = blocks.map((wb) => ({
    block: cloneDeep(wb.block),
    layer: wb.layer,
    pos: vec2.add(wb.pos, pos),
  }))
  worldBlocks = filterBlocksOutsideMapArea(worldBlocks)
  void placeMultipleBlocks(worldBlocks)
}

function getBombSpawnPos(posX: number): vec2 {
  for (let y = 0; y < mapSize.y; y++) {
    const checkPos = vec2(posX, mapTopLeftPos.y + y)
    const blockForeground = getPwGameWorldHelper().getBlockAt(checkPos, LayerType.Foreground)
    const blockOverlay = getPwGameWorldHelper().getBlockAt(checkPos, LayerType.Overlay)

    const posOkayForBomb =
      [BomBotBlockType.SOLID, BomBotBlockType.SEMI_SOLID].includes(
        useBomBotWorldStore().blockTypes[blockForeground.bId],
      ) ||
      [BomBotBlockType.SOLID, BomBotBlockType.SEMI_SOLID].includes(useBomBotWorldStore().blockTypes[blockOverlay.bId])

    if (posOkayForBomb) {
      return checkPos
    }
  }
  return vec2(posX, mapTopLeftPos.y + mapSize.y - 1)
}

function filterBlocksOutsideMapArea(blocks: WorldBlock[]): WorldBlock[] {
  return blocks.filter(
    (wb) =>
      wb.pos.x >= mapTopLeftPos.x &&
      wb.pos.x < mapTopLeftPos.x + mapSize.x &&
      wb.pos.y >= mapTopLeftPos.y &&
      wb.pos.y < mapTopLeftPos.y + mapSize.y,
  )
}

function disqualifyPlayerFromRound(playerId: number) {
  if (useBomBotWorldStore().currentState === BomBotState.PLAYING) {
    if (getPlayerIdsInGame().includes(playerId)) {
      removePlayerFromPlayersInGame(playerId)
      sendRawMessage(`/team #${playerId} ${TEAM_NONE}`)
    }
  }
}

function playerGodModePacketReceived(data: ProtoGen.PlayerGodModePacket) {
  const playerId = data.playerId
  if (playerId === undefined) {
    return
  }
  disqualifyPlayerFromRound(playerId)
  if (data.enabled) {
    sendRawMessage(`/team #${playerId} ${TEAM_RED}`)
  } else {
    sendRawMessage(`/team #${playerId} ${TEAM_NONE}`)
  }
}

function playerResetPacketReceived(data: ProtoGen.PlayerResetPacket) {
  disqualifyPlayerFromRound(data.playerId!)
}

function playerLeftPacketReceived(data: ProtoGen.PlayerLeftPacket) {
  disqualifyPlayerFromRound(data.playerId)
}

function playerCountersUpdatePacketReceived(data: ProtoGen.PlayerCountersUpdatePacket) {
  // NOTE: A hack! Currently the official proper way to detect player death, is to track death counter for all players, and see if it changes with this packet
  // However that's too much work.
  // We simplify this, by knowing this packet will only get sent when player dies, because we have no coins in this world.
  if (data.coins > 0 || data.blueCoins > 0) {
    throw new GameError('Coins should not be placed in this world!')
  }
  disqualifyPlayerFromRound(data.playerId!)

  // checkIfPlayerDiedFromBomb(data.playerId!)
}

// function checkIfPlayerDiedFromBomb(playerId: number) {
//   const player = getPwGameWorldHelper().getPlayer(playerId)
//   if (!player) {
//     return
//   }
//
//   const playerDeathPos = ??? // no way to calculate this yet
//   const lastBombPos = useBomBotRoundStore().lastBombPos
//   if (lastBombPos.x === -1 && lastBombPos.y === -1) {
//     return
//   }
//
//   const bombExplosionRange = 1
//   const playerDiedFromBomb =
//     Math.abs(playerPos.y - lastBombPos.y) <= bombExplosionRange ||
//     Math.abs(playerPos.x - lastBombPos.x) <= bombExplosionRange
//
//   if (playerDiedFromBomb) {
//     useBomBotRoundStore().playerWasKilledByLastBomb = true
//   }
// }

function playerTeamUpdatePacketReceived(data: ProtoGen.PlayerTeamUpdatePacket) {
  if (
    useBomBotWorldStore().currentState === BomBotState.WAITING_FOR_ALL_PLAYERS_TO_BE_TELEPORTED_TO_MAP &&
    data.teamId === TEAM_GREEN
  ) {
    const randomPos = getRandomAvailablePlayerSpawnPosition()
    const playerId = data.playerId!

    sendRawMessage(`/tp #${playerId} ${randomPos.x} ${randomPos.y}`)
    useBomBotRoundStore().totalPlayersTeleportedToMap++
    useBomBotRoundStore().playersInGame.push(getPwGameWorldHelper().players.get(playerId)!)
    getPlayerBomBotWorldData(playerId).plays++
    sendRawMessage(`/counter #${playerId} blue =${getPlayerBomBotWorldData(playerId).plays}`)
  }
}

function playerJoinedPacketReceived(data: ProtoGen.PlayerJoinedPacket) {
  const playerId = data.properties?.playerId
  if (playerId === undefined) {
    return
  }

  if (isWorldOwner(playerId)) {
    sendPrivateChatMessage('BomBot is here! Type .start to start the round. Type .help to see commands', playerId)
  } else {
    sendPrivateChatMessage('BomBot is here! Type .help to see commands', playerId)
  }

  mergePlayerStats(playerId)
}

function mergePlayerStats(playerId: number) {
  // If player leaves and rejoins, keep their stats
  const playerName = getPwGameWorldHelper().getPlayer(playerId)!.username
  for (const [existingPlayerId, data] of useBomBotWorldStore().playerBomBotWorldData) {
    if (data.username === playerName && existingPlayerId !== playerId) {
      useBomBotWorldStore().playerBomBotWorldData.set(playerId, { ...data })
      useBomBotWorldStore().playerBomBotWorldData.delete(existingPlayerId)
      break
    }
  }
}

async function playerChatPacketReceived(data: ProtoGen.PlayerChatPacket) {
  const command = data.message.split(' ')
  if (!command[0].startsWith('.')) {
    return
  }

  const commandName = command[0].toLowerCase().slice(1)
  const commandArgs = command.slice(1)
  const playerId = data.playerId!

  switch (commandName as BomBotCommandName) {
    case BomBotCommandName.HELP:
      helpCommandReceived(commandArgs, playerId)
      break
    case BomBotCommandName.PING:
      sendPrivateChatMessage('pong', playerId)
      break
    case BomBotCommandName.START:
      await startCommandReceived(commandArgs, playerId, true)
      break
    case BomBotCommandName.QUICK_START:
      await startCommandReceived(commandArgs, playerId, false)
      break
    case BomBotCommandName.STOP:
      await stopCommandReceived(commandArgs, playerId)
      break
    case BomBotCommandName.AFK:
      afkCommandReceived(commandArgs, playerId)
      break
    case BomBotCommandName.PLACE_ALL_BOMBOT:
      await placeallbombotCommandReceived(commandArgs, playerId)
      break
    default:
      throw new GameError('Unrecognised command. Type .help to see all commands', playerId)
  }
}

function afkCommandReceived(_: string[], playerId: number) {
  const player = getPwGameWorldHelper().getPlayer(playerId)!

  const playerIdsInGame = getPlayerIdsInGame()
  if (player.states.teamId !== TEAM_RED) {
    if (playerIdsInGame.includes(playerId)) {
      disqualifyPlayerFromRoundBecauseAfk(playerId)
    } else {
      makePlayerAfk(playerId)
    }
  } else {
    sendRawMessage(`/team #${playerId} ${TEAM_NONE}`)
  }
}

function helpCommandReceived(args: string[], playerId: number) {
  if (args.length === 0) {
    if (isDeveloper(playerId) || isWorldOwner(playerId)) {
      sendPrivateChatMessage('Commands: .help .ping .afk .start .quickstart .stop', playerId)
    } else {
      sendPrivateChatMessage('Commands: .help .ping .afk', playerId)
    }
    sendPrivateChatMessage('See more info about each command via .help [command]', playerId)
    // TODO:
    // sendPrivateChatMessage('You can also host BomBot yourself at: piratux.github.io/PixelWalker-Copy-Bot/', playerId)
    return
  }

  let commandName = args[0]

  if (commandName.startsWith('.')) {
    commandName = commandName.slice(1)
  }

  switch (commandName as BomBotCommandName) {
    case BomBotCommandName.PING:
      sendPrivateChatMessage('.ping - check if bot is alive by pinging it.', playerId)
      sendPrivateChatMessage(`Example usage: .ping`, playerId)
      break
    case BomBotCommandName.HELP:
      sendPrivateChatMessage(
        '.help [command] - get general help, or if command is specified, get help about command.',
        playerId,
      )
      sendPrivateChatMessage(`Example usage: .help afk`, playerId)
      break
    case BomBotCommandName.START:
      sendPrivateChatMessage('.start - starts BomBot game.', playerId)
      break
    case BomBotCommandName.QUICK_START:
      sendPrivateChatMessage('.start - starts BomBot game faster by not placing BomBot world', playerId)
      sendPrivateChatMessage('This can be used to customise BomBot world', playerId)
      break
    case BomBotCommandName.STOP:
      sendPrivateChatMessage('.stop - stops BomBot game.', playerId)
      break
    case BomBotCommandName.AFK:
      sendPrivateChatMessage(".afk - tells bot that you're afk or not.", playerId)
      break
    default:
      throw new GameError(`Unrecognised command ${commandName}. Type .help to see all commands`, playerId)
  }
}

async function placeallbombotCommandReceived(_args: string[], playerId: number) {
  requireDeveloper(playerId)
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  const currentPos = cloneDeep(blockTypeDataStartPos)
  const sortedListBlocks = getPwBlocks()
  const worldBlocks = []
  for (const singleBlock of sortedListBlocks) {
    if ((singleBlock.Layer as LayerType) === LayerType.Background) {
      continue
    }
    if (currentPos.x >= blockTypeDataEndPos.x) {
      currentPos.x = blockTypeDataStartPos.x
      currentPos.y += blockTypeDataSpacingY
    }

    const pos = cloneDeep(currentPos)
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
    currentPos.x += 1

    for (let layer = 0; layer < TOTAL_PW_LAYERS; layer++) {
      if (layer !== singleBlock.Layer) {
        worldBlocks.push({ block: new Block(0), layer, pos })
      }
    }
  }

  const success = await placeMultipleBlocks(worldBlocks)
  handlePlaceBlocksResult(success)
}

async function placeBomBotWorld() {
  sendGlobalChatMessage('Loading BomBot world')
  const bomBotMapWorldId = 'r3796a7103bb687'
  const blocks = await getAnotherWorldBlocks(bomBotMapWorldId, getPwApiClient())
  await placeWorldDataBlocks(blocks)
}

async function placeBomBotMap(mapEntry: BomBotMapEntry) {
  sendGlobalChatMessage('Loading map: ' + mapEntry.mapName + ' by ' + mapEntry.authorName)

  await placeWorldDataBlocksUsingColumnsLeftToRightPattern(mapEntry.blocks, mapTopLeftPos)
}

function getBomBotStructure(bomBotBlocks: DeserialisedStructure, topLeft: vec2, size: vec2, offset: vec2 = vec2(0, 0)) {
  const blocks = getDeserialisedStructureSectionVec2(bomBotBlocks, topLeft, vec2.addm(topLeft, size, vec2(-1, -1)))
  let worldBlocks = convertDeserializedStructureToWorldBlocks(blocks)
  worldBlocks = worldBlocks
    .filter((wb) => wb.layer !== LayerType.Background)
    .filter(
      (wb) =>
        blocks.blocks[LayerType.Foreground][wb.pos.x][wb.pos.y].bId !== 0 ||
        blocks.blocks[LayerType.Overlay][wb.pos.x][wb.pos.y].bId !== 0,
    )
  return worldBlocks.map((wb) => ({
    block: cloneDeep(wb.block),
    layer: wb.layer,
    pos: vec2.add(wb.pos, offset),
  }))
}

function loadPowerUps(bomBotBlocks: DeserialisedStructure) {
  const powerUpList: BomBotPowerUpData[] = [
    {
      equipPos: vec2(6, 93),
      type: BomBotPowerUp.SHIELD,
      blocks: getBomBotStructure(bomBotBlocks, vec2(3, 395), vec2(3, 1), vec2(-1, -2)),
    },
    {
      equipPos: vec2(12, 93),
      type: BomBotPowerUp.SABOTAGE,
      blocks: getBomBotStructure(bomBotBlocks, vec2(9, 395), vec2(3, 3), vec2(-1, -1)),
    },
    {
      equipPos: vec2(18, 93),
      type: BomBotPowerUp.DOTS,
      blocks: getBomBotStructure(bomBotBlocks, vec2(15, 395), vec2(3, 3), vec2(-1, -1)),
    },
    {
      equipPos: vec2(24, 93),
      type: BomBotPowerUp.MUD_FIELD,
      blocks: getBomBotStructure(bomBotBlocks, vec2(21, 395), vec2(3, 3), vec2(-1, -1)),
    },
    {
      equipPos: vec2(31, 93),
      type: BomBotPowerUp.PLATFORM,
      blocks: getBomBotStructure(bomBotBlocks, vec2(27, 396), vec2(5, 1), vec2(-2, 1)),
    },
  ]

  for (const powerUp of powerUpList) {
    useBomBotWorldStore().powerUpData.push(powerUp)
  }
}

function loadSpecialBombs(bomBotBlocks: DeserialisedStructure) {
  const specialBombList: BomBotSpecialBombData[] = [
    {
      equipPos: vec2(45, 91),
      type: BomBotSpecialBomb.PLUS,
      blocks: getBomBotStructure(bomBotBlocks, vec2(17, 385), vec2(5, 5), vec2(-2, -2)),
      icon: bomBotBlocks.blocks[LayerType.Foreground][23][385],
    },
    {
      equipPos: vec2(53, 91),
      type: BomBotSpecialBomb.CROSS,
      blocks: getBomBotStructure(bomBotBlocks, vec2(27, 385), vec2(5, 5), vec2(-2, -2)),
      icon: bomBotBlocks.blocks[LayerType.Foreground][33][385],
    },
    {
      equipPos: vec2(61, 91),
      type: BomBotSpecialBomb.SHRAPNEL,
      blocks: getBomBotStructure(bomBotBlocks, vec2(37, 385), vec2(5, 5), vec2(-2, -2)),
      icon: bomBotBlocks.blocks[LayerType.Foreground][43][385],
    },
    {
      equipPos: vec2(69, 91),
      type: BomBotSpecialBomb.GRID,
      blocks: getBomBotStructure(bomBotBlocks, vec2(47, 385), vec2(5, 5), vec2(-2, -2)),
      icon: bomBotBlocks.blocks[LayerType.Foreground][53][385],
    },
    {
      equipPos: vec2(77, 91),
      type: BomBotSpecialBomb.IMPACT,
      blocks: getBomBotStructure(bomBotBlocks, vec2(57, 385), vec2(5, 5), vec2(-2, -2)),
      icon: bomBotBlocks.blocks[LayerType.Foreground][63][385],
    },
    {
      equipPos: vec2(85, 91),
      type: BomBotSpecialBomb.DIAMOND,
      blocks: getBomBotStructure(bomBotBlocks, vec2(67, 385), vec2(5, 5), vec2(-2, -2)),
      icon: bomBotBlocks.blocks[LayerType.Foreground][73][385],
    },
    {
      equipPos: vec2(94, 91),
      type: BomBotSpecialBomb.LINE,
      blocks: getBomBotStructure(bomBotBlocks, vec2(77, 387), vec2(7, 1), vec2(-3, 0)),
      icon: bomBotBlocks.blocks[LayerType.Foreground][85][385],
    },
  ].map((specialBombData) => {
    const bombDeletedBlocks = specialBombData.blocks.map((worldBlock) => ({ ...worldBlock, block: new Block(0) }))
    const bombRemoveBlocks = mergeWorldBlocks(bombDeletedBlocks, useBomBotWorldStore().specialBombRemoveBlocks)
    return { ...specialBombData, bombRemoveBlocks }
  })

  for (const specialBomb of specialBombList) {
    useBomBotWorldStore().specialBombData.push(specialBomb)
  }
}

function loadMaps(bomBotBlocks: DeserialisedStructure) {
  const totalMapCount = vec2(15, 21)
  const mapSpacing = vec2.add(mapSize, vec2(4, 6))
  const topLeftMapOffset = vec2(3, 5)
  for (let x = 0; x < totalMapCount.x; x++) {
    for (let y = 0; y < totalMapCount.y; y++) {
      const sectionTopLeft = vec2.add(topLeftMapOffset, vec2.mul(vec2(x, y), mapSpacing))
      const mapBlocks = getDeserialisedStructureSectionVec2(
        bomBotBlocks,
        sectionTopLeft,
        vec2.addm(sectionTopLeft, mapSize, vec2(-1, -1)),
      )

      if (!isBomBotMapValid(bomBotBlocks, mapBlocks, sectionTopLeft)) {
        continue
      }

      const mapInfoSignPos = vec2.add(sectionTopLeft, mapInfoSignOffset)
      const mapInfoSignBlock = bomBotBlocks.blocks[LayerType.Foreground][mapInfoSignPos.x][mapInfoSignPos.y]
      const signBlockText = mapInfoSignBlock.args[0] as string
      const signBlockTextLines = signBlockText.split('\n')
      const mapName = signBlockTextLines[0].trim()
      const authorName = signBlockTextLines[2].trim()
      useBomBotWorldStore().bomBotMaps.push({
        blocks: mapBlocks,
        mapName: mapName,
        authorName: authorName,
      })
    }
  }
}

async function loadBomBotData() {
  sendGlobalChatMessage('Loading BomBot data')
  const bomBotDataWorldId = getWorldIdIfUrl('lbsz7864s3a3yih')
  const bomBotBlocks = await getAnotherWorldBlocks(bomBotDataWorldId, getPwApiClient())

  useBomBotWorldStore().bombTimerBgBlockTimeLeft = bomBotBlocks.blocks[LayerType.Background][2][378]
  useBomBotWorldStore().bombTimerBgBlockTimeSpent = bomBotBlocks.blocks[LayerType.Background][4][378]
  useBomBotWorldStore().bombTypeFgBlockIndicator = bomBotBlocks.blocks[LayerType.Foreground][7][379]

  useBomBotWorldStore().randomEffectBlocks = [
    bomBotBlocks.blocks[LayerType.Foreground][17][379],
    bomBotBlocks.blocks[LayerType.Foreground][18][379],
    bomBotBlocks.blocks[LayerType.Foreground][19][379],
    bomBotBlocks.blocks[LayerType.Foreground][20][379],
    bomBotBlocks.blocks[LayerType.Foreground][21][379],
  ]

  useBomBotWorldStore().defaultBombBlocks = getBomBotStructure(bomBotBlocks, vec2(9, 385), vec2(3, 3), vec2(-1, -1))
  useBomBotWorldStore().bombRemoveBlocks = getBomBotStructure(bomBotBlocks, vec2(3, 385), vec2(3, 3), vec2(-1, -1))
  useBomBotWorldStore().specialBombRemoveBlocks = getBomBotStructure(bomBotBlocks, vec2(4, 386), vec2(1, 1))

  loadPowerUps(bomBotBlocks)
  loadSpecialBombs(bomBotBlocks)
  loadBlockTypes(bomBotBlocks)
  loadMaps(bomBotBlocks)

  sendGlobalChatMessage(`Total of ${useBomBotWorldStore().bomBotMaps.length} maps loaded`)
}

async function stopCommandReceived(_args: string[], playerId: number) {
  requireWorldOwner(playerId)
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  if (useBomBotWorldStore().currentState === BomBotState.STOPPED) {
    throw new GameError('BomBot is already stopped', playerId)
  }

  await stopBomBot()
}

async function stopBomBot() {
  sendGlobalChatMessage('Stopping BomBot...')
  useBomBotWorldStore().currentState = BomBotState.STOPPED
  await workerWaitUntil(() => !useBomBotWorldStore().everySecondUpdateIsRunning, {
    timeout: 15000,
    intervalBetweenAttempts: 1000,
  })
  sendGlobalChatMessage('BomBot stopped!')
}

async function startCommandReceived(_args: string[], playerId: number, loadWorld: boolean) {
  requireWorldOwner(playerId)
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  if (useBomBotWorldStore().currentState !== BomBotState.STOPPED) {
    throw new GameError('BomBot is already running', playerId)
  }

  // Because /tp commands don't work for non world owners, even if they have edit rights
  const botPlayerId = getPwGameWorldHelper().botPlayerId
  if (!isWorldOwner(botPlayerId)) {
    throw new GameError('Bot must be world owner for BomBot to work', playerId)
  }

  await startBomBot(loadWorld)
}

async function startBomBot(loadWorld: boolean) {
  if (getPwGameWorldHelper().width < 100 || getPwGameWorldHelper().height < 100) {
    throw new GameError('World must be of at least 100x100 size.')
  }

  sendGlobalChatMessage('Starting BomBot...')

  useBomBotWorldStore().$reset()

  if (loadWorld) {
    await placeBomBotWorld()
  }
  await loadBomBotData()

  useBomBotWorldStore().currentState = BomBotState.RESET_STORE

  sendGlobalChatMessage('BomBot started!')

  useBomBotWorldStore().everySecondUpdateIsRunning = true
  void everySecondUpdate()
}

async function everySecondUpdate(): Promise<void> {
  if (useBomBotWorldStore().currentState === BomBotState.STOPPED) {
    useBomBotWorldStore().everySecondUpdateIsRunning = false
    return
  }

  try {
    await everySecondBomBotUpdate()
  } catch (e) {
    handleException(e)
    await autoRestartBomBot()
    return
  }

  // NOTE: This might be called less often than just every second, but it makes sure that `everySecondBomBotUpdate` are never executed concurrently.
  setCustomTimeout(() => {
    void everySecondUpdate()
  }, 1000)
}

function getActivePlayers() {
  return Array.from(getPwGameWorldHelper().players.values()).filter((player) => player.states.teamId !== TEAM_RED)
}

function getActivePlayerCount() {
  return getActivePlayers().length
}

function getPlayerIdsInGame() {
  console.log('useBomBotRoundStore().playersInGame: ', useBomBotRoundStore().playersInGame)
  return useBomBotRoundStore().playersInGame.map((p) => p.playerId)
}

function playerWinRound(playerId: number) {
  console.log('Round finished')
  const winPos = vec2(55, 58)
  sendRawMessage(`/tp #${playerId} ${winPos.x} ${winPos.y}`)
  sendRawMessage(`/givecrown #${playerId}`)
  sendRawMessage(`/team #${playerId} ${TEAM_NONE}`)
  sendGlobalChatMessage(`${getPwGameWorldHelper().getPlayer(playerId)?.username} wins!`)
  getPlayerBomBotWorldData(playerId).wins++
  sendRawMessage(`/counter #${playerId} white =${getPlayerBomBotWorldData(playerId).wins}`)

  setBomBotState(BomBotState.RESET_STORE)

  updateLeaderboard()

  useBomBotWorldStore().totalRoundsPassed++
}

function updateLeaderboard() {
  const playerDataList = Array.from(useBomBotWorldStore().playerBomBotWorldData.entries()).map(
    ([playerId, playerData]) => ({
      playerId: Number(playerId),
      ...playerData,
    }),
  )

  const leaderboardTopText = 'Daily wins leaderboard\n================'
  const leaderboardPlayerText = playerDataList
    .filter((player) => player.wins > 0)
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 5)
    .map((player, index) => {
      const botData = getPlayerBomBotWorldData(player.playerId)
      return `${index + 1}. ${botData.username}: ${getPlayerBomBotWorldData(player.playerId).wins}`
    })
    .join('\n')
  const leaderboardFinalText = leaderboardTopText + '\n' + leaderboardPlayerText

  const leaderboardSignPos = vec2(37, 58)
  void placeMultipleBlocks([
    {
      block: new Block(PwBlockName.SIGN_GREEN, [leaderboardFinalText]),
      layer: LayerType.Foreground,
      pos: leaderboardSignPos,
    },
  ])
}

function abandonRoundDueToNoPlayersLeft() {
  sendGlobalChatMessage('No players left, ending round')
  setBomBotState(BomBotState.RESET_STORE)
}

function selectRandomBomber(): number {
  const playerIdsInGame = getPlayerIdsInGame()

  console.log(
    'useBomBotRoundStore().playerIdsBomberQueueOriginal (before): ',
    useBomBotRoundStore().playerIdsBomberQueueOriginal,
  )
  console.log(
    'useBomBotRoundStore().playerIdsBomberQueueRemainder (before): ',
    useBomBotRoundStore().playerIdsBomberQueueRemainder,
  )

  if (useBomBotRoundStore().playerIdsBomberQueueOriginal.length === 0) {
    useBomBotRoundStore().playerIdsBomberQueueOriginal = shuffle(cloneDeep(playerIdsInGame))
  }

  if (useBomBotRoundStore().playerIdsBomberQueueRemainder.length === 0) {
    useBomBotRoundStore().playerIdsBomberQueueRemainder = cloneDeep(useBomBotRoundStore().playerIdsBomberQueueOriginal)
  }

  console.log(
    'useBomBotRoundStore().playerIdsBomberQueueOriginal (after): ',
    useBomBotRoundStore().playerIdsBomberQueueOriginal,
  )
  console.log(
    'useBomBotRoundStore().playerIdsBomberQueueRemainder (after): ',
    useBomBotRoundStore().playerIdsBomberQueueRemainder,
  )

  return useBomBotRoundStore().playerIdsBomberQueueRemainder.pop()!
}

function getRandomMap() {
  return getRandomArrayElement(useBomBotWorldStore().bomBotMaps)
}

async function placeEffectBlock() {
  const effectBlockPos = vec2(35, 41)
  const EFFECT_BLOCK_EVERY_X_ROUNDS = 5
  const effectBlock =
    useBomBotWorldStore().totalRoundsPassed % EFFECT_BLOCK_EVERY_X_ROUNDS === 0 &&
    useBomBotWorldStore().totalRoundsPassed !== 0
      ? getRandomArrayElement(useBomBotWorldStore().randomEffectBlocks)
      : new Block(0)
  await placeMultipleBlocks([
    {
      pos: effectBlockPos,
      layer: LayerType.Foreground,
      block: effectBlock,
    },
  ])
}

async function everySecondBomBotUpdate() {
  switch (useBomBotWorldStore().currentState) {
    case BomBotState.STOPPED:
      return
    case BomBotState.RESET_STORE:
      useBomBotRoundStore().$reset()
      setBomBotState(BomBotState.AWAITING_PLAYERS)
      return
    case BomBotState.AWAITING_PLAYERS: {
      const MINIMUM_PLAYER_COUNT_REQUIRED_TO_START_GAME = 2
      const activePlayerCount = getActivePlayerCount()
      if (activePlayerCount >= MINIMUM_PLAYER_COUNT_REQUIRED_TO_START_GAME) {
        sendGlobalChatMessage(`A total of ${activePlayerCount} active players were found. Starting round...`)
        setBomBotState(BomBotState.PREPARING_FOR_NEXT_ROUND)
        useBomBotRoundStore().waitingForMorePlayersMessagePrintedOnce = false
        return
      }

      if (
        useBomBotWorldStore().lastActivePlayerCount < MINIMUM_PLAYER_COUNT_REQUIRED_TO_START_GAME - 1 &&
        useBomBotWorldStore().lastActivePlayerCount < activePlayerCount
      ) {
        sendGlobalChatMessage(
          `${activePlayerCount} active player(s) found. Minimum of ${MINIMUM_PLAYER_COUNT_REQUIRED_TO_START_GAME} active players are required to start the game`,
        )
      }

      useBomBotWorldStore().lastActivePlayerCount = activePlayerCount

      if (!useBomBotRoundStore().waitingForMorePlayersMessagePrintedOnce) {
        useBomBotRoundStore().waitingForMorePlayersMessagePrintedOnce = true
        sendGlobalChatMessage(
          `Waiting for more players. Minimum of ${MINIMUM_PLAYER_COUNT_REQUIRED_TO_START_GAME} active players are required to start the game`,
        )
      }
      break
    }
    case BomBotState.PREPARING_FOR_NEXT_ROUND: {
      if (!useBomBotWorldStore().playedOnce) {
        await placeBomBotMap(useBomBotWorldStore().bomBotMaps[0])
        useBomBotWorldStore().playedOnce = true
      } else {
        const map = getRandomMap()
        await placeBomBotMap(map)
      }

      await placeEffectBlock()

      updateAvailablePlayerSpawnPositions()

      const activePlayers = getActivePlayers()

      for (const activePlayer of activePlayers) {
        const roundStartTopLeftPos = vec2(35, 40)
        const playerId = activePlayer.playerId
        sendRawMessage(`/tp #${playerId} ${roundStartTopLeftPos.x} ${roundStartTopLeftPos.y}`)
      }
      setBomBotState(BomBotState.WAITING_FOR_ALL_PLAYERS_TO_BE_TELEPORTED_TO_MAP)
      useBomBotRoundStore().playersThatWereSelectedForRoundStart = activePlayers

      break
    }
    case BomBotState.WAITING_FOR_ALL_PLAYERS_TO_BE_TELEPORTED_TO_MAP: {
      if (
        useBomBotRoundStore().totalPlayersTeleportedToMapLastSeenValue !==
        useBomBotRoundStore().totalPlayersTeleportedToMap
      ) {
        useBomBotRoundStore().totalPlayersTeleportedToMapLastSeenValue =
          useBomBotRoundStore().totalPlayersTeleportedToMap
        useBomBotRoundStore().totalPlayersTeleportedToMapSecondsPassedSinceValuesMatch = 0
      } else {
        useBomBotRoundStore().totalPlayersTeleportedToMapSecondsPassedSinceValuesMatch++
      }

      const REQUIRED_SECONDS_OF_NO_CHANGE_IN_TOTAL_PLAYERS_TELEPORTED_TO_MAP = 3
      if (
        useBomBotRoundStore().totalPlayersTeleportedToMapSecondsPassedSinceValuesMatch >=
          REQUIRED_SECONDS_OF_NO_CHANGE_IN_TOTAL_PLAYERS_TELEPORTED_TO_MAP ||
        useBomBotRoundStore().playersThatWereSelectedForRoundStart.length ===
          useBomBotRoundStore().totalPlayersTeleportedToMap
      ) {
        useBomBotRoundStore().totalPlayersTeleportedToMap = 0
        useBomBotRoundStore().totalPlayersTeleportedToMapLastSeenValue = 0
        useBomBotRoundStore().totalPlayersTeleportedToMapSecondsPassedSinceValuesMatch = 0

        const playerIdsInGame = getPlayerIdsInGame()
        for (const playerThatWasSelectedForRoundStart of useBomBotRoundStore().playersThatWereSelectedForRoundStart) {
          if (!playerIdsInGame.includes(playerThatWasSelectedForRoundStart.playerId)) {
            disqualifyPlayerFromRoundBecauseAfk(playerThatWasSelectedForRoundStart.playerId)
          }
        }

        setBomBotState(BomBotState.PLAYING)
      }

      break
    }
    case BomBotState.PLAYING: {
      const playerIdsInGame = getPlayerIdsInGame()

      if (playerIdsInGame.length === 0) {
        abandonRoundDueToNoPlayersLeft()
        return
      }

      if (playerIdsInGame.length === 1) {
        playerWinRound(playerIdsInGame[0])
        return
      }

      if (useBomBotRoundStore().secondsLeftBeforeBomberCanBomb > 0) {
        useBomBotRoundStore().secondsLeftBeforeBomberCanBomb--
      }

      if (useBomBotRoundStore().secondsLeftBeforeBombMustBeRemoved > 0) {
        useBomBotRoundStore().secondsLeftBeforeBombMustBeRemoved--
        if (useBomBotRoundStore().secondsLeftBeforeBombMustBeRemoved <= 0) {
          if (useBomBotRoundStore().lastBombType === null) {
            placeStructureInsideMap(useBomBotWorldStore().bombRemoveBlocks, useBomBotRoundStore().lastBombPos)
          } else {
            placeStructureInsideMap(
              useBomBotWorldStore().specialBombData[useBomBotRoundStore().lastBombType!].bombRemoveBlocks,
              useBomBotRoundStore().lastBombPos,
            )
          }

          // const MAX_TIMES_BOMBER_CAN_CONTINUE_BOMBING_AFTER_KILLING_SOMEONE_IN_A_ROW = 2
          //
          // if (
          //   useBomBotRoundStore().playerWasKilledByLastBomb &&
          //   useBomBotRoundStore().totalTimesBomberKilledSomeoneInARow <
          //     MAX_TIMES_BOMBER_CAN_CONTINUE_BOMBING_AFTER_KILLING_SOMEONE_IN_A_ROW
          // ) {
          //   prepareBomberVariables()
          // } else {
          const randomPos = getRandomAvailablePlayerSpawnPosition()
          sendRawMessage(`/tp #${useBomBotRoundStore().bomberPlayerId} ${randomPos.x} ${randomPos.y}`)

          useBomBotRoundStore().bomberPlayerId = 0
          // }
        }
      }

      if (
        !playerIdsInGame.includes(useBomBotRoundStore().bomberPlayerId) ||
        useBomBotRoundStore().secondsSpentByBomber >= mapSize.x
      ) {
        if (useBomBotRoundStore().bomberPlayerId !== 0) {
          disqualifyPlayerFromRoundBecauseAfk(useBomBotRoundStore().bomberPlayerId)
        }

        if (playerIdsInGame.length === 0) {
          abandonRoundDueToNoPlayersLeft()
          return
        }

        if (playerIdsInGame.length === 1) {
          playerWinRound(playerIdsInGame[0])
          return
        }

        useBomBotRoundStore().bomberPlayerId = selectRandomBomber()
        console.log(
          'Selected bomber: ' +
            useBomBotRoundStore().bomberPlayerId +
            ' (' +
            getPwGameWorldHelper().getPlayer(useBomBotRoundStore().bomberPlayerId)?.username +
            ')',
        )
        sendRawMessage(
          `/tp #${useBomBotRoundStore().bomberPlayerId} ${bomberAreaTopLeft.x + getRandomInt(0, mapSize.x)} ${bomberAreaTopLeft.y}`,
        )
        prepareBomberVariables()
        informFirstTimeBomberHowToBomb()
        placeBombTypeIndicators()
      } else {
        if (useBomBotRoundStore().secondsLeftBeforeBombMustBeRemoved <= 0) {
          useBomBotRoundStore().secondsSpentByBomber++
        }
      }

      updateBomberTimeIndication()

      break
    }
    default:
      throw new Error('Unknown BomBotState: ' + useBomBotWorldStore().currentState)
  }
}

function informFirstTimeBomberHowToBomb() {
  const botData = getPlayerBomBotWorldData(useBomBotRoundStore().bomberPlayerId)
  if (!botData.informedHowToPlaceBombOnce) {
    botData.informedHowToPlaceBombOnce = true
    sendPrivateChatMessage('You are the bomber! Press space to place a bomb.', useBomBotRoundStore().bomberPlayerId)
  }
}

function placeBombTypeIndicators() {
  placeBombTypIndicatorArrow()

  const botData = getPlayerBomBotWorldData(useBomBotRoundStore().bomberPlayerId)
  const botRoundData = getPlayerBomBotRoundData(useBomBotRoundStore().bomberPlayerId)

  if (botData.specialBombSelected === null || botRoundData.specialBombsLeft <= 0) {
    botData.bombTypeChosen = BomBotBombType.NORMAL
  }

  const specialBombIconBlock =
    botData.specialBombSelected !== null
      ? useBomBotWorldStore().specialBombData[botData.specialBombSelected].icon
      : new Block(0)

  const specialBombIconBlocks = Array.from({ length: SPECIAL_BOMB_COUNT }, (_, i) => ({
    block: botRoundData.specialBombsLeft > i ? specialBombIconBlock : new Block(0),
    layer: LayerType.Foreground,
    pos: vec2(49 + i, 41),
  }))

  void placeMultipleBlocks(specialBombIconBlocks)
}

function placeBombTypIndicatorArrow() {
  const normalBombTypeIndicatorPos = vec2(47, 40)
  const specialBombTypeIndicatorPos = vec2(49, 40)
  const botData = getPlayerBomBotWorldData(useBomBotRoundStore().bomberPlayerId)
  void placeMultipleBlocks([
    {
      block:
        botData.bombTypeChosen === BomBotBombType.NORMAL
          ? useBomBotWorldStore().bombTypeFgBlockIndicator
          : new Block(0),
      layer: LayerType.Foreground,
      pos: normalBombTypeIndicatorPos,
    },
    {
      block:
        botData.bombTypeChosen === BomBotBombType.SPECIAL
          ? useBomBotWorldStore().bombTypeFgBlockIndicator
          : new Block(0),
      layer: LayerType.Foreground,
      pos: specialBombTypeIndicatorPos,
    },
  ])
}

function prepareBomberVariables() {
  useBomBotRoundStore().secondsSpentByBomber = 0
  useBomBotRoundStore().bombAvailable = true
  useBomBotRoundStore().secondsLeftBeforeBomberCanBomb = 2
  // useBomBotRoundStore().totalTimesBomberKilledSomeoneInARow = 0
  // useBomBotRoundStore().playerWasKilledByLastBomb = false
}

function updateBomberTimeIndication() {
  const bgBlocks = []
  for (let x = 0; x < mapSize.x; x++) {
    bgBlocks.push({
      pos: vec2.add(bomberAreaTopLeft, vec2(x, 0)),
      block:
        x < useBomBotRoundStore().secondsSpentByBomber
          ? useBomBotWorldStore().bombTimerBgBlockTimeSpent
          : useBomBotWorldStore().bombTimerBgBlockTimeLeft,
      layer: LayerType.Background,
    })
  }
  void placeMultipleBlocks(bgBlocks)
}

function disqualifyPlayerFromRoundBecauseAfk(playerId: number) {
  const afkPos = vec2(47, 85)
  sendRawMessage(`/tp #${playerId} ${afkPos.x} ${afkPos.y}`)
  makePlayerAfk(playerId)
}

function makePlayerAfk(playerId: number) {
  sendRawMessage(`/team #${playerId} ${TEAM_RED}`)
  removePlayerFromPlayersInGame(playerId)
  sendPrivateChatMessage(
    'You are now marked as AFK. You can move at any time to unmark yourself or type .afk again',
    playerId,
  )
}

function getAvailableSpawnPositions(blocks: DeserialisedStructure) {
  const availablePlayerSpawnPositions: vec2[] = []
  for (let x = 0; x < mapSize.x; x++) {
    for (let y = 0; y < mapSize.y - 1; y++) {
      const blockForeground = blocks.blocks[LayerType.Foreground][x][y]
      const blockOverlay = blocks.blocks[LayerType.Overlay][x][y]
      const posOkayForSpawn =
        useBomBotWorldStore().blockTypes[blockForeground.bId] === BomBotBlockType.NON_SOLID &&
        useBomBotWorldStore().blockTypes[blockOverlay.bId] === BomBotBlockType.NON_SOLID

      const blockBelowForeground = blocks.blocks[LayerType.Foreground][x][y + 1]
      const blockBelowOverlay = blocks.blocks[LayerType.Overlay][x][y + 1]
      const blockBelowIsSolid =
        useBomBotWorldStore().blockTypes[blockBelowForeground.bId] === BomBotBlockType.SOLID ||
        useBomBotWorldStore().blockTypes[blockBelowOverlay.bId] === BomBotBlockType.SOLID

      if (posOkayForSpawn && blockBelowIsSolid) {
        availablePlayerSpawnPositions.push(vec2(x, y))
      }
    }
  }
  return availablePlayerSpawnPositions
}

function updateAvailablePlayerSpawnPositions() {
  const blocks = toRaw(getPwGameWorldHelper()).sectionBlocks(
    mapTopLeftPos.x,
    mapTopLeftPos.y,
    mapTopLeftPos.x + mapSize.x - 1,
    mapTopLeftPos.y + mapSize.y - 1,
  )
  useBomBotRoundStore().availablePlayerSpawnPositions = getAvailableSpawnPositions(blocks)
}

function getRandomAvailablePlayerSpawnPosition(): vec2 {
  const availablePlayerSpawnPositions = useBomBotRoundStore().availablePlayerSpawnPositions
  if (availablePlayerSpawnPositions.length === 0) {
    return mapTopLeftPos
  }
  return vec2.add(mapTopLeftPos, getRandomArrayElement(availablePlayerSpawnPositions))
}

function loadBlockTypes(bomBotBlocks: DeserialisedStructure) {
  sendGlobalChatMessage('Loading BomBot block types')
  const bomBotIndicatorBgBlockIllegal = bomBotBlocks.blocks[LayerType.Background][11][360]
  const bomBotIndicatorBgBlockSolid = bomBotBlocks.blocks[LayerType.Background][13][360]
  const bomBotIndicatorBgBlockSemiSolid = bomBotBlocks.blocks[LayerType.Background][15][360]
  const bomBotIndicatorBgBlockNotSolid = bomBotBlocks.blocks[LayerType.Background][17][360]
  useBomBotWorldStore().blockTypes.push(...Array(getPwBlocks().length).fill(BomBotBlockType.BACKGROUND))

  for (
    let y = blockTypeDataStartPos.y;
    y < blockTypeDataStartPos.y + 10 * blockTypeDataSpacingY;
    y += blockTypeDataSpacingY
  ) {
    for (let x = blockTypeDataStartPos.x; x < blockTypeDataEndPos.x; x++) {
      const blockTypeIndicatorBlock = bomBotBlocks.blocks[LayerType.Background][x][y + 1]
      if (blockTypeIndicatorBlock.bId === 0) {
        return
      }

      const blockForeground = bomBotBlocks.blocks[LayerType.Foreground][x][y]
      const blockOverlay = bomBotBlocks.blocks[LayerType.Overlay][x][y]
      const blockId = blockForeground.bId !== 0 ? blockForeground.bId : blockOverlay.bId

      if (blockTypeIndicatorBlock.bId === bomBotIndicatorBgBlockIllegal.bId) {
        useBomBotWorldStore().blockTypes[blockId] = BomBotBlockType.ILLEGAL
      } else if (blockTypeIndicatorBlock.bId === bomBotIndicatorBgBlockSolid.bId) {
        useBomBotWorldStore().blockTypes[blockId] = BomBotBlockType.SOLID
      } else if (blockTypeIndicatorBlock.bId === bomBotIndicatorBgBlockSemiSolid.bId) {
        useBomBotWorldStore().blockTypes[blockId] = BomBotBlockType.SEMI_SOLID
      } else if (blockTypeIndicatorBlock.bId === bomBotIndicatorBgBlockNotSolid.bId) {
        useBomBotWorldStore().blockTypes[blockId] = BomBotBlockType.NON_SOLID
      } else {
        throw new Error(`Unknown block type indicator block id: ${blockTypeIndicatorBlock.bId} at pos ${x},${y + 1}`)
      }
    }
  }
}

async function autoRestartBomBot() {
  if (useBomBotWorldStore().currentState === BomBotState.STOPPED) {
    return
  }

  sendGlobalChatMessage('Restarting BomBot...')
  await stopBomBot()

  const MAX_AUTOMATIC_RESTARTS = 3
  if (userBomBotAutomaticRestartCounterStore().totalAutomaticRestarts >= MAX_AUTOMATIC_RESTARTS) {
    sendGlobalChatMessage(`BomBot has automatically restarted ${MAX_AUTOMATIC_RESTARTS} times, not restarting again`)
    return
  }
  userBomBotAutomaticRestartCounterStore().totalAutomaticRestarts++

  await startBomBot(false)
}

function isBomBotMapValid(
  bomBotBlocks: DeserialisedStructure,
  mapBlocks: DeserialisedStructure,
  sectionTopLeft: vec2,
): boolean {
  const mapFinishedIndicatorBlock = bomBotBlocks.blocks[LayerType.Foreground][2][360]
  const checkBlock = bomBotBlocks.blocks[LayerType.Foreground][sectionTopLeft.x - 1][sectionTopLeft.y - 1]
  const mapIndicatedWithFinishedBlock = checkBlock.bId === mapFinishedIndicatorBlock.bId
  if (!mapIndicatedWithFinishedBlock) {
    return false
  }

  const worldBlocks = convertDeserializedStructureToWorldBlocks(mapBlocks)
  const hasIllegalBlocks = worldBlocks.some((wb) => {
    if (useBomBotWorldStore().blockTypes[wb.block.bId] === BomBotBlockType.ILLEGAL) {
      console.error(
        `Illegal block found. Local pos: ${wb.pos.x}, ${wb.pos.y}. Map pos ${sectionTopLeft.x}, ${sectionTopLeft.y}`,
      )
      return true
    } else {
      return false
    }
  })
  if (hasIllegalBlocks) {
    return false
  }

  const hasAvailableSpawnPositions = getAvailableSpawnPositions(mapBlocks).length > 0
  if (!hasAvailableSpawnPositions) {
    console.error(`No available spawn positions. Map pos ${sectionTopLeft.x}, ${sectionTopLeft.y}`)
    return false
  }

  const mapInfoSignBlock =
    bomBotBlocks.blocks[LayerType.Foreground][sectionTopLeft.x + mapInfoSignOffset.x][
      sectionTopLeft.y + mapInfoSignOffset.y
    ]
  const signBlockText = mapInfoSignBlock.args[0] as string
  const signBlockTextLines = signBlockText.split('\n')
  const mapInfoSignHasAllInfo = signBlockTextLines.length == 3
  if (!mapInfoSignHasAllInfo) {
    console.error(
      `Expected 3 lines in sign describing map name and author. Map pos ${sectionTopLeft.x}, ${sectionTopLeft.y}`,
    )
    return false
  }

  return true
}

function getPlayerBomBotWorldData(playerId: number): BomBotWorldData {
  return mapGetOrInsert(useBomBotWorldStore().playerBomBotWorldData, playerId, createBomBotWorldData(playerId))
}

function getPlayerBomBotRoundData(playerId: number): BomBotRoundData {
  return mapGetOrInsert(useBomBotRoundStore().playerBomBotRoundData, playerId, createBomBotRoundData())
}

function setBomBotState(newState: BomBotState) {
  // Prevent state from being changed if we're trying to stop the bot
  if (useBomBotWorldStore().currentState === BomBotState.STOPPED) {
    return
  }
  useBomBotWorldStore().currentState = newState
}
