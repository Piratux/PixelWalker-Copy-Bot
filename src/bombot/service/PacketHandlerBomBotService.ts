import { getPwBlocks, getPwBotType, getPwGameClient, getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { sendGlobalChatMessage, sendPrivateChatMessage, sendRawMessage } from '@/core/service/ChatMessageService.ts'
import { ProtoGen } from 'pw-js-api'
import { CallbackEntry } from '@/core/type/CallbackEntry.ts'
import {
  commonPlayerInitPacketReceived,
  handlePlaceBlocksResult,
  hotReloadCallbacks,
  requirePlayerAndBotEditPermission,
} from '@/core/service/PwClientService.ts'
import { isWorldOwner, requireDeveloper } from '@/core/util/Environment.ts'
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
  placeMultipleBlocks,
  placeWorldDataBlocks,
  placeWorldDataBlocksUsingPattern,
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
import { getRandomInt } from '@/core/util/Random.ts'
import { clamp } from '@/core/util/Numbers.ts'
import { userBomBotAutomaticRestartCounterStore } from '@/bombot/store/BomBotAutomaticRestartCounterStore.ts'
import { BomBotWorldData, createBomBotWorldData } from '@/bombot/type/BomBotPlayerWorldData.ts'
import waitUntil from 'async-wait-until'
import { BomBotPowerup } from '@/bombot/enum/BomBotPowerup.ts'
import { BomBotRoundData, createBomBotRoundData } from '@/bombot/type/BomBotPlayerRoundData.ts'
import { GameError } from '@/core/class/GameError.ts'
import { BomBotPowerupData } from '@/bombot/type/BomBotPowerupData.ts'

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
  client.addCallback('debug', console.log)
  client.addCallback('error', handleBombotError)
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

function handleBombotError(e: unknown) {
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
  checkIfPowerUpEquipped(data)
}

function checkIfBombPlaced(data: ProtoGen.PlayerMovedPacket) {
  if (
    data.spaceJustDown &&
    useBomBotWorldStore().currentState === BomBotState.PLAYING &&
    data.playerId === useBomBotRoundStore().bomberPlayerId
  ) {
    performBombAction(clamp(Math.round(data.position!.x / 16), mapTopLeftPos.x, mapTopLeftPos.x + mapSize.x - 1))
  }
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
  if (botData.powerupSelected === null) {
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
  if (botRoundData.powerupsLeft <= 0) {
    return
  }

  botRoundData.powerupsLeft--

  // Require people to press powerup even amount of times to use it.
  // That is, we want to prevent using 2 powerups when pressing up 3 times quickly.
  botData.lastTimeUpPressedMs = 0

  sendPrivateChatMessage(
    `Powerup ${BomBotPowerup[botData.powerupSelected]} used! ${botRoundData.powerupsLeft} left`,
    data.playerId!,
  )
  placeStructureInsideMap(useBomBotWorldStore().powerupData[botData.powerupSelected].blocks, playerPos)
}

function checkIfPowerUpEquipped(data: ProtoGen.PlayerMovedPacket) {
  const downPressed = data.vertical === 1 && data.horizontal === 0
  if (!downPressed) {
    return
  }

  const playerId = data.playerId!
  const playerPos = convertFromPixelPosToBlockPos(data.position!)
  const botData = getPlayerBomBotWorldData(playerId)
  for (const powerupListElement of useBomBotWorldStore().powerupData) {
    if (vec2.eq(playerPos, powerupListElement.equipPos)) {
      botData.powerupSelected = powerupListElement.type
      sendPrivateChatMessage(`Powerup selected: ${BomBotPowerup[powerupListElement.type]}`, playerId)
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

function performBombAction(posX: number) {
  if (!useBomBotRoundStore().bombAvailable) {
    return
  }

  if (useBomBotRoundStore().secondsLeftBeforeBomberCanBomb > 0) {
    return
  }

  useBomBotRoundStore().bombAvailable = false

  const bombPos = getBombSpawnPos(posX)
  placeStructureInsideMap(useBomBotWorldStore().bombBlocks, bombPos)
  useBomBotRoundStore().lastBombPos = bombPos
  useBomBotRoundStore().secondsLeftBeforeBombMustBeRemoved = 2

  updateAvailablePlayerSpawnPositions()
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
  if (!playerId) {
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
  if (!playerId) {
    return
  }
  sendPrivateChatMessage('BomBot is here! Type .start to start the round. Type .help to see commands', playerId)
}

async function playerChatPacketReceived(data: ProtoGen.PlayerChatPacket) {
  const args = data.message.split(' ')
  const playerId = data.playerId!

  switch (args[0].toLowerCase()) {
    case '.help':
      helpCommandReceived(args, playerId)
      break
    case '.ping':
      sendPrivateChatMessage('pong', playerId)
      break
    case '.start':
      await startCommandReceived(args, playerId, true)
      break
    case '.quickstart':
      await startCommandReceived(args, playerId, false)
      break
    case '.stop':
      await stopCommandReceived(args, playerId)
      break
    case '.afk':
      afkCommandReceived(args, playerId)
      break
    case '.wins':
      winsCommandReceived(args, playerId)
      break
    case '.plays':
      playsCommandReceived(args, playerId)
      break
    case '.placeallbombot':
      await placeallbombotCommandReceived(args, playerId)
      break
    default:
      if (args[0].startsWith('.')) {
        throw new GameError('Unrecognised command. Type .help to see all commands', playerId)
      }
  }
}

function winsCommandReceived(args: string[], playerId: number) {
  getPlayerStat(args, playerId, 'wins', 'won')
}

function playsCommandReceived(args: string[], playerId: number) {
  getPlayerStat(args, playerId, 'plays', 'played')
}

function getPlayerStat(args: string[], playerId: number, stat: 'wins' | 'plays', verb: 'won' | 'played') {
  if (args.length === 1) {
    const botData = getPlayerBomBotWorldData(playerId)
    sendPrivateChatMessage(`You have ${verb} ${botData[stat]} times.`, playerId)
  } else {
    const otherPlayerName = args[1].toLowerCase()
    const otherPlayer = getPwGameWorldHelper()
      .getPlayers()
      .find((p) => p.username.toLowerCase() === otherPlayerName)
    if (otherPlayer) {
      const botData = getPlayerBomBotWorldData(otherPlayer.playerId)
      sendPrivateChatMessage(`${otherPlayerName} has ${verb} ${botData[stat]} times.`, playerId)
    } else {
      throw new GameError(`Player ${otherPlayerName} not found.`, playerId)
    }
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
  if (args.length == 1) {
    sendPrivateChatMessage('Commands: .help .ping .start .quickstart .stop .wins .plays', playerId)
    sendPrivateChatMessage('See more info about each command via .help [command]', playerId)
    // TODO:
    // sendPrivateChatMessage('You can also host BomBot yourself at: piratux.github.io/PixelWalker-Copy-Bot/', playerId)
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
      sendPrivateChatMessage(`Example usage: .help wins`, playerId)
      break
    case 'start':
      sendPrivateChatMessage('.start - starts BomBot game.', playerId)
      break
    case 'quickstart':
      sendPrivateChatMessage('.start - starts BomBot game faster by not placing BomBot world', playerId)
      sendPrivateChatMessage('This can be used to customise BomBot world', playerId)
      break
    case 'stop':
      sendPrivateChatMessage('.stop - stops BomBot game.', playerId)
      break
    case 'afk':
      sendPrivateChatMessage(".afk - tells bot that you're afk or not.", playerId)
      break
    case 'wins':
      sendPrivateChatMessage('.wins [player_name] - shows how many times player won.', playerId)
      break
    case 'plays':
      sendPrivateChatMessage('.plays [player_name] - shows how many times player played.', playerId)
      break
    default:
      throw new GameError(`Unrecognised command ${args[1]}. Type .help to see all commands`, playerId)
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
  const blocks = await getAnotherWorldBlocks(bomBotMapWorldId)
  if (!blocks) {
    throw new GameError('Failed to load BomBot world')
  }
  await placeWorldDataBlocks(blocks)
}

async function placeBomBotMap(mapEntry: BomBotMapEntry) {
  sendGlobalChatMessage('Loading map: ' + mapEntry.mapName + ' by ' + mapEntry.authorName)

  await placeWorldDataBlocksUsingPattern(mapEntry.blocks, mapTopLeftPos)
}

function getBomBotStructure(bombotBlocks: DeserialisedStructure, topLeft: vec2, size: vec2, offset: vec2 = vec2(0, 0)) {
  const blocks = getDeserialisedStructureSectionVec2(bombotBlocks, topLeft, vec2.addm(topLeft, size, vec2(-1, -1)))
  let worldBlocks = convertDeserializedStructureToWorldBlocks(blocks)
  worldBlocks = worldBlocks.filter((wb) => wb.layer !== LayerType.Background)
  return worldBlocks.map((wb) => ({
    block: cloneDeep(wb.block),
    layer: wb.layer,
    pos: vec2.add(wb.pos, offset),
  }))
}

function loadPowerups(bombotBlocks: DeserialisedStructure) {
  const powerupList: BomBotPowerupData[] = [
    {
      equipPos: vec2(9, 92),
      type: BomBotPowerup.SHIELD,
      blocks: getBomBotStructure(bombotBlocks, vec2(3, 395), vec2(3, 1), vec2(-1, -2)),
    },
    {
      equipPos: vec2(15, 92),
      type: BomBotPowerup.SABOTAGE,
      blocks: getBomBotStructure(bombotBlocks, vec2(9, 395), vec2(3, 3), vec2(-1, -1)),
    },
    {
      equipPos: vec2(21, 92),
      type: BomBotPowerup.DOTS,
      blocks: getBomBotStructure(bombotBlocks, vec2(15, 395), vec2(3, 3), vec2(-1, -1)),
    },
    {
      equipPos: vec2(27, 92),
      type: BomBotPowerup.MUD_FIELD,
      blocks: getBomBotStructure(bombotBlocks, vec2(21, 395), vec2(3, 3), vec2(-1, -1)),
    },
    {
      equipPos: vec2(34, 92),
      type: BomBotPowerup.PLATFORM,
      blocks: getBomBotStructure(bombotBlocks, vec2(27, 397), vec2(5, 1), vec2(-2, 1)),
    },
  ]

  for (const powerupListElement of powerupList) {
    useBomBotWorldStore().powerupData.push(powerupListElement)
  }
}

async function loadBomBotData() {
  sendGlobalChatMessage('Loading BomBot data')
  const bomBotDataWorldId = getWorldIdIfUrl('lbsz7864s3a3yih')
  const bombotBlocks = await getAnotherWorldBlocks(bomBotDataWorldId)
  if (!bombotBlocks) {
    throw new GameError('Failed to load BomBot data')
  }

  useBomBotWorldStore().bombTimerBgBlockTimeSpent = bombotBlocks.blocks[LayerType.Background][10][363]
  useBomBotWorldStore().bombTimerBgBlockTimeLeft = bombotBlocks.blocks[LayerType.Background][8][363]

  useBomBotWorldStore().bombBlocks = getBomBotStructure(bombotBlocks, vec2(3, 361), vec2(3, 3), vec2(-1, -1))
  useBomBotWorldStore().bombRemoveBlocks = getBomBotStructure(bombotBlocks, vec2(3, 368), vec2(3, 3), vec2(-1, -1))

  loadPowerups(bombotBlocks)
  loadBlockTypes(bombotBlocks)

  const totalMapCount = vec2(15, 21)
  const mapSpacing = vec2.add(mapSize, vec2(4, 6))
  const topLeftMapOffset = vec2(3, 5)
  for (let x = 0; x < totalMapCount.x; x++) {
    for (let y = 0; y < totalMapCount.y; y++) {
      const sectionTopLeft = vec2.add(topLeftMapOffset, vec2.mul(vec2(x, y), mapSpacing))
      const mapBlocks = getDeserialisedStructureSectionVec2(
        bombotBlocks,
        sectionTopLeft,
        vec2.addm(sectionTopLeft, mapSize, vec2(-1, -1)),
      )

      if (!isBomBotMapValid(bombotBlocks, mapBlocks, sectionTopLeft)) {
        continue
      }

      const mapInfoSignPos = vec2.add(sectionTopLeft, mapInfoSignOffset)
      const mapInfoSignBlock = bombotBlocks.blocks[LayerType.Foreground][mapInfoSignPos.x][mapInfoSignPos.y]
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

  sendGlobalChatMessage(`Total of ${useBomBotWorldStore().bomBotMaps.length} maps loaded`)
}

async function stopCommandReceived(_args: string[], playerId: number) {
  requireDeveloper(playerId)
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  if (useBomBotWorldStore().currentState === BomBotState.STOPPED) {
    throw new GameError('BomBot is already stopped', playerId)
  }

  await stopBomBot()
}

async function stopBomBot() {
  sendGlobalChatMessage('Stopping BomBot...')
  useBomBotWorldStore().currentState = BomBotState.STOPPED
  await waitUntil(() => !useBomBotWorldStore().everySecondUpdateIsRunning, {
    timeout: 15000,
    intervalBetweenAttempts: 1000,
  })
  sendGlobalChatMessage('BomBot stopped!')
}

async function startCommandReceived(_args: string[], playerId: number, loadWorld: boolean) {
  requireDeveloper(playerId)
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
  sendGlobalChatMessage('Starting Bombot...')

  useBomBotWorldStore().$reset()

  if (loadWorld) {
    await placeBomBotWorld()
  }
  await loadBomBotData()

  useBomBotWorldStore().currentState = BomBotState.RESET_STORE

  sendGlobalChatMessage('Bombot started!')

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
  return Array.from(getPwGameWorldHelper().players.values()).filter((player) => player.states.teamId !== 1)
}

function getActivePlayerCount() {
  return getActivePlayers().length
}

function getPlayerIdsInGame() {
  return useBomBotRoundStore().playersInGame.map((p) => p.playerId)
}

function playerWinRound(playerId: number) {
  const winPos = vec2(55, 58)
  sendRawMessage(`/tp #${playerId} ${winPos.x} ${winPos.y}`)
  sendRawMessage(`/givecrown #${playerId}`)
  sendRawMessage(`/team #${playerId} ${TEAM_NONE}`)
  sendGlobalChatMessage(`${getPwGameWorldHelper().getPlayer(playerId)?.username} wins!`)
  getPlayerBomBotWorldData(playerId).wins++
  sendRawMessage(`/counter #${playerId} white =${getPlayerBomBotWorldData(playerId).wins}`)

  setBombState(BomBotState.RESET_STORE)
}

function abandonRoundDueToNoPlayersLeft() {
  sendGlobalChatMessage('No players left, ending round')
  setBombState(BomBotState.RESET_STORE)
}

function selectRandomBomber(): number {
  const playerIdsInGame = getPlayerIdsInGame()

  if (useBomBotRoundStore().playerIdsBomberQueueOriginal.length === 0) {
    useBomBotRoundStore().playerIdsBomberQueueOriginal = shuffle(cloneDeep(playerIdsInGame))
  }

  if (useBomBotRoundStore().playerIdsBomberQueueRemainder.length === 0) {
    useBomBotRoundStore().playerIdsBomberQueueRemainder = cloneDeep(useBomBotRoundStore().playerIdsBomberQueueOriginal)
  }

  return useBomBotRoundStore().playerIdsBomberQueueRemainder.pop()!
}

function getRandomMap() {
  const randomIndex = getRandomInt(0, useBomBotWorldStore().bomBotMaps.length)
  return useBomBotWorldStore().bomBotMaps[randomIndex]
}

async function everySecondBomBotUpdate() {
  switch (useBomBotWorldStore().currentState) {
    case BomBotState.STOPPED:
      return
    case BomBotState.RESET_STORE:
      useBomBotRoundStore().$reset()
      setBombState(BomBotState.AWAITING_PLAYERS)
      return
    case BomBotState.AWAITING_PLAYERS: {
      const minimumPlayerCountRequiredToStartGame = 2
      const activePlayerCount = getActivePlayerCount()
      if (activePlayerCount >= minimumPlayerCountRequiredToStartGame) {
        sendGlobalChatMessage(`A total of ${activePlayerCount} active players were found. Starting round...`)
        setBombState(BomBotState.PREPARING_FOR_NEXT_ROUND)
        return
      }

      if (!useBomBotRoundStore().waitingForMorePlayersMessagePrintedOnce) {
        useBomBotRoundStore().waitingForMorePlayersMessagePrintedOnce = true
        sendGlobalChatMessage(
          `Waiting for more players. Minimum of ${minimumPlayerCountRequiredToStartGame} active players are required to start the game`,
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

      updateAvailablePlayerSpawnPositions()

      const activePlayers = getActivePlayers()

      for (const activePlayer of activePlayers) {
        const roundStartTopLeftPos = vec2(35, 40)
        const playerId = activePlayer.playerId
        sendRawMessage(`/tp #${playerId} ${roundStartTopLeftPos.x} ${roundStartTopLeftPos.y}`)
      }
      setBombState(BomBotState.WAITING_FOR_ALL_PLAYERS_TO_BE_TELEPORTED_TO_MAP)
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

        setBombState(BomBotState.PLAYING)
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
          placeStructureInsideMap(useBomBotWorldStore().bombRemoveBlocks, useBomBotRoundStore().lastBombPos)

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
        sendRawMessage(
          `/tp #${useBomBotRoundStore().bomberPlayerId} ${bomberAreaTopLeft.x + getRandomInt(0, mapSize.x)} ${bomberAreaTopLeft.y}`,
        )
        prepareBomberVariables()
        informFirstTimeBomberHowToBomb()
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

function prepareBomberVariables() {
  useBomBotRoundStore().secondsSpentByBomber = 0
  useBomBotRoundStore().bombAvailable = true
  useBomBotRoundStore().secondsLeftBeforeBomberCanBomb = 1
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
  const afkPos = vec2(47, 86)
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
  const blocks = getPwGameWorldHelper().sectionBlocks(
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
  const randomIndex = getRandomInt(0, availablePlayerSpawnPositions.length)
  return vec2.add(mapTopLeftPos, availablePlayerSpawnPositions[randomIndex])
}

function loadBlockTypes(bombotBlocks: DeserialisedStructure) {
  sendGlobalChatMessage('Loading BomBot block types')
  const bomBotIndicatorBgBlockIllegal = bombotBlocks.blocks[LayerType.Background][11][360]
  const bomBotIndicatorBgBlockSolid = bombotBlocks.blocks[LayerType.Background][13][360]
  const bomBotIndicatorBgBlockSemiSolid = bombotBlocks.blocks[LayerType.Background][15][360]
  const bomBotIndicatorBgBlockNotSolid = bombotBlocks.blocks[LayerType.Background][17][360]
  useBomBotWorldStore().blockTypes.push(...Array(getPwBlocks().length).fill(BomBotBlockType.BACKGROUND))

  for (
    let y = blockTypeDataStartPos.y;
    y < blockTypeDataStartPos.y + 10 * blockTypeDataSpacingY;
    y += blockTypeDataSpacingY
  ) {
    for (let x = blockTypeDataStartPos.x; x < blockTypeDataEndPos.x; x++) {
      const blockTypeIndicatorBlock = bombotBlocks.blocks[LayerType.Background][x][y + 1]
      if (blockTypeIndicatorBlock.bId === 0) {
        return
      }

      const blockForeground = bombotBlocks.blocks[LayerType.Foreground][x][y]
      const blockOverlay = bombotBlocks.blocks[LayerType.Overlay][x][y]
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

  sendGlobalChatMessage('Restarting bombot...')
  await stopBomBot()

  const MAX_AUTOMATIC_RESTARTS = 3
  if (userBomBotAutomaticRestartCounterStore().totalAutomaticRestarts >= MAX_AUTOMATIC_RESTARTS) {
    throw new GameError(`Bombot has automatically restarted ${MAX_AUTOMATIC_RESTARTS} times, not restarting again`)
  }
  userBomBotAutomaticRestartCounterStore().totalAutomaticRestarts++

  await startBomBot(false)
}

function isBomBotMapValid(
  bombotBlocks: DeserialisedStructure,
  mapBlocks: DeserialisedStructure,
  sectionTopLeft: vec2,
): boolean {
  const mapFinishedIndicatorBlock = bombotBlocks.blocks[LayerType.Foreground][8][366]
  const checkBlock = bombotBlocks.blocks[LayerType.Foreground][sectionTopLeft.x - 1][sectionTopLeft.y - 1]
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
    bombotBlocks.blocks[LayerType.Foreground][sectionTopLeft.x + mapInfoSignOffset.x][
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
  if (!useBomBotWorldStore().playerBombotWorldData[playerId]) {
    useBomBotWorldStore().playerBombotWorldData[playerId] = createBomBotWorldData()
  }
  return useBomBotWorldStore().playerBombotWorldData[playerId]
}

function getPlayerBomBotRoundData(playerId: number): BomBotRoundData {
  if (!useBomBotRoundStore().playerBombotRoundData[playerId]) {
    useBomBotRoundStore().playerBombotRoundData[playerId] = createBomBotRoundData()
  }
  return useBomBotRoundStore().playerBombotRoundData[playerId]
}

function setBombState(newState: BomBotState) {
  // Prevent state from being changed if we're trying to stop the bot
  if (useBomBotWorldStore().currentState === BomBotState.STOPPED) {
    return
  }
  useBomBotWorldStore().currentState = newState
}
