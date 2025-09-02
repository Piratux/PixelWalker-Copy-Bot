import { getPwBlocks, getPwBotType, getPwGameClient, getPwGameWorldHelper } from '@/store/PwClientStore.ts'
import { sendGlobalChatMessage, sendPrivateChatMessage, sendRawMessage } from '@/service/ChatMessageService.ts'
import { ProtoGen } from 'pw-js-api'
import { CallbackEntry } from '@/type/CallbackEntry.ts'
import { commonPlayerInitPacketReceived, hotReloadCallbacks, pwCheckEdit } from '@/service/PwClientService.ts'
import { isDeveloper } from '@/util/Environment.ts'
import { vec2 } from '@basementuniverse/vec'
import { cloneDeep } from 'lodash-es'
import { Block, DeserialisedStructure, LayerType } from 'pw-js-world'
import { WorldBlock } from '@/type/WorldBlock.ts'
import { PwBlockName } from '@/gen/PwBlockName.ts'
import {
  blockIsPortal,
  convertDeserializedStructureToWorldBlocks,
  getAnotherWorldBlocks,
  getDeserialisedStructureSectionVec2,
  placeMultipleBlocks,
  placeWorldDataBlocks,
} from '@/service/WorldService.ts'
import { TOTAL_PW_LAYERS } from '@/constant/General.ts'
import { getWorldIdIfUrl } from '@/service/WorldIdExtractorService.ts'
import { BotType } from '@/enum/BotType.ts'
import { useBomBotWorldStore } from '@/store/BomBotWorldStore.ts'
import { BomBotState } from '@/enum/BomBotState.ts'
import { BomBotMapEntry } from '@/type/BomBotMapEntry.ts'
import { setCustomTimeout } from '@/util/Sleep.ts'
import { BomBotBlockType } from '@/enum/BomBotBlockType.ts'
import { handleException } from '@/util/Exception.ts'
import { useBomBotRoundStore } from '@/store/BomBotRoundStore.ts'
import { getRandomInt } from '@/util/Random.ts'
import { clamp } from '@/util/Numbers.ts'
import { userBomBotAutomaticRestartCounterStore } from '@/store/BomBotAutomaticRestartCounterStore.ts'

const blockTypeDataStartPos = vec2(20, 361) // inclusive x
const blockTypeDataEndPos = vec2(389, 361) // exclusive x
const blockTypeDataSpacingY = 3
const mapSize = vec2(22, 11)
const mapTopLeftPos = vec2(39, 45)
const bomberAreaTopLeft = vec2(39, 43)

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

  sendRawMessage(`/team #${getPwGameWorldHelper().botPlayerId} 1`)
}

function removePlayerFromPlayersInGame(playerId: number) {
  useBomBotRoundStore().playersInGame = useBomBotRoundStore().playersInGame.filter((p) => p.playerId !== playerId)
}

async function handleBombotError(e: unknown) {
  handleException(e)
  await autoRestartBomBot()
}

function playerMovedPacketReceived(data: ProtoGen.PlayerMovedPacket) {
  if (
    data.spaceJustDown &&
    useBomBotWorldStore().currentState === BomBotState.PLAYING &&
    data.playerId === useBomBotRoundStore().bomberPlayerId
  ) {
    performBombAction(clamp(Math.floor(data.position!.x / 16), mapTopLeftPos.x, mapTopLeftPos.x + mapSize.x - 1))
  }

  if (getPwGameWorldHelper().getPlayer(data.playerId!)?.states?.teamId === 1) {
    sendRawMessage(`/team #${data.playerId} none`)
  }
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
  let bombWorldBlocks = useBomBotWorldStore().bombBlocks.map((wb) => ({
    block: cloneDeep(wb.block),
    layer: wb.layer,
    pos: vec2.add(vec2.add(wb.pos, bombPos), vec2(-1, -1)),
  }))
  bombWorldBlocks = filterBlocksOutsideMapArea(bombWorldBlocks)
  void placeMultipleBlocks(bombWorldBlocks)
  useBomBotRoundStore().lastBombPos = bombPos
  useBomBotRoundStore().secondsLeftBeforeBombMustBeRemoved = 2

  updateAvailablePlayerSpawnPositions()
}

function disqualifyPlayerFromRound(playerId: number) {
  if (useBomBotWorldStore().currentState === BomBotState.PLAYING) {
    if (getPlayerIdsInGame().includes(playerId)) {
      removePlayerFromPlayersInGame(playerId)
      sendRawMessage(`/team #${playerId} none`)
    }
  }
}

function playerGodModePacketReceived(data: ProtoGen.PlayerGodModePacket) {
  disqualifyPlayerFromRound(data.playerId!)
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
    sendGlobalChatMessage('ERROR! Coins should not be placed in this world!')
    throw new Error('ERROR! Coins should not be placed in this world!')
  }
  disqualifyPlayerFromRound(data.playerId!)
}

function playerTeamUpdatePacketReceived(data: ProtoGen.PlayerTeamUpdatePacket) {
  if (useBomBotWorldStore().currentState === BomBotState.WAITING_FOR_ALL_PLAYERS_TO_BE_TELEPORTED_TO_MAP) {
    const randomPos = getRandomAvailablePlayerSpawnPosition()
    sendRawMessage(`/tp #${data.playerId} ${randomPos.x} ${randomPos.y}`)
    useBomBotRoundStore().totalPlayersTeleportedToMap++
    useBomBotRoundStore().playersInGame.push(getPwGameWorldHelper().players.get(data.playerId!)!)
  }
}

function playerJoinedPacketReceived(data: ProtoGen.PlayerJoinedPacket) {
  const playerId = data.properties?.playerId
  if (!playerId) {
    return
  }
  sendPrivateChatMessage('BomBot is here! Type .start to start the round', playerId)
}

async function playerChatPacketReceived(data: ProtoGen.PlayerChatPacket) {
  const args = data.message.split(' ')
  const playerId = data.playerId!

  switch (args[0].toLowerCase()) {
    case '.start':
      await startCommandReceived(args, playerId, true)
      break
    case '.quickstart':
      await startCommandReceived(args, playerId, false)
      break
    case '.stop':
      stopCommandReceived(args, playerId)
      break
    case '.placeallbombot':
      await placeallbombotCommandReceived(args, playerId)
      break
    case '.testcommand': {
      if (!pwCheckEdit(getPwGameWorldHelper(), playerId)) {
        return
      }

      if (!isDeveloper(playerId)) {
        sendPrivateChatMessage('ERROR! Command is exclusive to bot developers', playerId)
        return
      }
      const roundStartTopLeftPos = vec2(35, 40)
      sendRawMessage(`/tp piratux ${roundStartTopLeftPos.x} ${roundStartTopLeftPos.y}`)
      break
    }
    case '.showspawnablepositions': {
      if (!pwCheckEdit(getPwGameWorldHelper(), playerId)) {
        return
      }

      if (!isDeveloper(playerId)) {
        sendPrivateChatMessage('ERROR! Command is exclusive to bot developers', playerId)
        return
      }

      if (useBomBotRoundStore().availablePlayerSpawnPositions.length === 0) {
        sendPrivateChatMessage('ERROR! No available spawn positions found', playerId)
        return
      }

      const blocks: WorldBlock[] = useBomBotRoundStore().availablePlayerSpawnPositions.map((pos) => ({
        pos: pos,
        block: new Block(PwBlockName.TOOL_CHECKPOINT),
        layer: LayerType.Foreground,
      }))
      await placeMultipleBlocks(blocks)
      break
    }
    case '.simulatecrash': {
      if (!pwCheckEdit(getPwGameWorldHelper(), playerId)) {
        return
      }

      if (!isDeveloper(playerId)) {
        sendPrivateChatMessage('ERROR! Command is exclusive to bot developers', playerId)
        return
      }
      throw new Error('error')
    }
    default:
      if (args[0].startsWith('.')) {
        sendPrivateChatMessage('ERROR! Unrecognised command', playerId)
      }
  }
}

async function placeallbombotCommandReceived(_args: string[], playerId: number) {
  if (!pwCheckEdit(getPwGameWorldHelper(), playerId)) {
    return
  }

  if (!isDeveloper(playerId)) {
    sendPrivateChatMessage('ERROR! Command is exclusive to bot developers', playerId)
    return
  }

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
  if (success) {
    sendPrivateChatMessage('Successfully placed all bombot non background blocks', playerId)
  } else {
    sendPrivateChatMessage('ERROR! Failed to place all blocks', playerId)
  }
}

async function placeBomBotWorld() {
  sendGlobalChatMessage('Loading BomBot world')
  const bomBotMapWorldId = getWorldIdIfUrl('r3796a7103bb687')
  const blocks = await getAnotherWorldBlocks(bomBotMapWorldId)
  if (!blocks) {
    sendGlobalChatMessage('ERROR! Failed to load BomBot world')
    return
  }
  await placeWorldDataBlocks(blocks)
}

async function placeBomBotMap(mapEntry: BomBotMapEntry) {
  sendGlobalChatMessage('Loading map: ' + mapEntry.mapName + ' by ' + mapEntry.authorName)

  await placeWorldDataBlocks(mapEntry.blocks, mapTopLeftPos)
}

async function loadBomBotData() {
  sendGlobalChatMessage('Loading BomBot data')
  const bomBotDataWorldId = getWorldIdIfUrl('lbsz7864s3a3yih')
  const bombotBlocks = await getAnotherWorldBlocks(bomBotDataWorldId)
  if (!bombotBlocks) {
    sendGlobalChatMessage('ERROR! Failed to load BomBot data')
    return
  }

  useBomBotWorldStore().bombTimerBgBlockTimeSpent = bombotBlocks.blocks[LayerType.Background][10][363]
  useBomBotWorldStore().bombTimerBgBlockTimeLeft = bombotBlocks.blocks[LayerType.Background][8][363]

  const bombTopLeft = vec2(3, 361)
  const bombBlocks = getDeserialisedStructureSectionVec2(bombotBlocks, bombTopLeft, vec2.add(bombTopLeft, vec2(2, 2)))
  const bombWorldBlocks = convertDeserializedStructureToWorldBlocks(bombBlocks)
  useBomBotWorldStore().bombBlocks = bombWorldBlocks.filter((wb) => wb.layer !== LayerType.Background)

  loadBlockTypes(bombotBlocks)

  const totalMapCount = vec2(15, 21)
  const mapSpacing = vec2.add(mapSize, vec2(4, 6))
  const topLeftMapOffset = vec2(3, 5)
  const mapInfoSignOffset = vec2(10, -2)
  for (let x = 0; x < totalMapCount.x; x++) {
    for (let y = 0; y < totalMapCount.y; y++) {
      const sectionTopLeft = vec2.add(topLeftMapOffset, vec2.mul(vec2(x, y), mapSpacing))
      const mapBlocks = getDeserialisedStructureSectionVec2(
        bombotBlocks,
        sectionTopLeft,
        vec2.add(vec2.add(sectionTopLeft, mapSize), vec2(-1, -1)),
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

function stopCommandReceived(_args: string[], playerId: number) {
  if (!pwCheckEdit(getPwGameWorldHelper(), playerId)) {
    return
  }

  if (!isDeveloper(playerId)) {
    sendPrivateChatMessage('ERROR! Command is exclusive to bot developers', playerId)
    return
  }

  if (useBomBotWorldStore().currentState === BomBotState.STOPPED) {
    sendPrivateChatMessage('ERROR! BomBot is already stopped', playerId)
    return
  }

  stopBomBot()
}

function stopBomBot() {
  sendGlobalChatMessage('Stopping BomBot...')
  useBomBotWorldStore().currentState = BomBotState.STOPPED
  sendGlobalChatMessage('BomBot stopped!')
}

async function startCommandReceived(_args: string[], playerId: number, loadWorld: boolean) {
  if (!pwCheckEdit(getPwGameWorldHelper(), playerId)) {
    return
  }

  if (!isDeveloper(playerId)) {
    sendPrivateChatMessage('ERROR! Command is exclusive to bot developers', playerId)
    return
  }

  if (useBomBotWorldStore().currentState !== BomBotState.STOPPED) {
    sendPrivateChatMessage('ERROR! BomBot is already running', playerId)
    return
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
  void everySecondUpdate()
}

async function everySecondUpdate(): Promise<void> {
  try {
    await everySecondBomBotUpdate()
  } catch (e) {
    handleException(e)
    await autoRestartBomBot()
    return
  }

  if (useBomBotWorldStore().currentState !== BomBotState.STOPPED) {
    // NOTE: This might be called less often than just every second, but it makes sure that `everySecondBomBotUpdate` are never executed concurrently.
    setCustomTimeout(() => {
      void everySecondUpdate()
    }, 1000)
  }
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
  sendRawMessage(`/team #${playerId} none`)
  sendGlobalChatMessage(`${getPwGameWorldHelper().getPlayer(playerId)?.username} wins!`)
  useBomBotWorldStore().currentState = BomBotState.RESET_STORE
}

function abandonRoundDueToNoPlayersLeft() {
  sendGlobalChatMessage('No players left, ending round')
  useBomBotWorldStore().currentState = BomBotState.RESET_STORE
}

function selectRandomBomber(): number {
  const playerIdsInGame = getPlayerIdsInGame()
  if (useBomBotRoundStore().previousBomberPlayerId !== 0) {
    const randomIndex = getRandomInt(0, playerIdsInGame.length - 1)
    return playerIdsInGame.filter((pId) => pId !== useBomBotRoundStore().previousBomberPlayerId)[randomIndex]
  } else {
    const randomIndex = getRandomInt(0, playerIdsInGame.length)
    return playerIdsInGame[randomIndex]
  }
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
      useBomBotWorldStore().currentState = BomBotState.AWAITING_PLAYERS
      return
    case BomBotState.AWAITING_PLAYERS: {
      const minimumPlayerCountRequiredToStartGame = 2
      const activePlayerCount = getActivePlayerCount()
      if (activePlayerCount >= minimumPlayerCountRequiredToStartGame) {
        sendGlobalChatMessage(`A total of ${activePlayerCount} active players were found. Starting round...`)
        useBomBotWorldStore().currentState = BomBotState.PREPARING_FOR_NEXT_ROUND
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
        sendRawMessage(`/tp #${activePlayer.playerId} ${roundStartTopLeftPos.x} ${roundStartTopLeftPos.y}`)
      }
      useBomBotWorldStore().currentState = BomBotState.WAITING_FOR_ALL_PLAYERS_TO_BE_TELEPORTED_TO_MAP
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

        useBomBotWorldStore().currentState = BomBotState.PLAYING
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
          let bombRemoveBlocks = useBomBotWorldStore().bombBlocks.map((wb) => ({
            block: new Block(0),
            layer: wb.layer,
            pos: vec2.add(vec2.add(wb.pos, useBomBotRoundStore().lastBombPos), vec2(-1, -1)),
          }))
          bombRemoveBlocks = filterBlocksOutsideMapArea(bombRemoveBlocks)
          void placeMultipleBlocks(bombRemoveBlocks)

          const randomPos = getRandomAvailablePlayerSpawnPosition()
          sendRawMessage(`/tp #${useBomBotRoundStore().bomberPlayerId} ${randomPos.x} ${randomPos.y}`)

          useBomBotRoundStore().previousBomberPlayerId = useBomBotRoundStore().bomberPlayerId
          useBomBotRoundStore().bomberPlayerId = 0
        }
      }

      if (
        !playerIdsInGame.includes(useBomBotRoundStore().bomberPlayerId) ||
        useBomBotRoundStore().secondsSpentByBomber >= mapSize.x
      ) {
        useBomBotRoundStore().secondsSpentByBomber = 0
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
        useBomBotRoundStore().bombAvailable = true
        useBomBotRoundStore().secondsLeftBeforeBomberCanBomb = 1
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
  const afkPos = vec2(43, 58)
  sendRawMessage(`/tp #${playerId} ${afkPos.x} ${afkPos.y}`)
  sendRawMessage(`/team #${playerId} 1`)
  sendPrivateChatMessage('You were disqualified from the round for being AFK', playerId)
  removePlayerFromPlayersInGame(playerId)
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
        console.log('useBomBotStore().blockTypes: ', useBomBotWorldStore().blockTypes)
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
  stopBomBot()

  const MAX_AUTOMATIC_RESTARTS = 3
  if (userBomBotAutomaticRestartCounterStore().totalAutomaticRestarts >= MAX_AUTOMATIC_RESTARTS) {
    sendGlobalChatMessage(
      `ERROR! Bombot has automatically restarted ${MAX_AUTOMATIC_RESTARTS} times, not restarting again`,
    )
    return
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
        `Illegal block found at local pos: ${wb.pos.x}, ${wb.pos.y}; in map pos ${sectionTopLeft.x}, ${sectionTopLeft.y}`,
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
    console.error(`No available spawn positions found in map pos ${sectionTopLeft.x}, ${sectionTopLeft.y}`)
    return false
  }

  return true
}
