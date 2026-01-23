import { getPwApiClient, getPwBotType, getPwGameClient, getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { sendGlobalChatMessage, sendPrivateChatMessage, sendRawMessage } from '@/core/service/ChatMessageService.ts'
import { ProtoGen } from 'pw-js-api'
import { CallbackEntry } from '@/core/type/CallbackEntry.ts'
import {
  commonPlayerInitPacketReceived,
  hotReloadCallbacks,
  requirePlayerAndBotEditPermission,
  updateAwaitedWorldBlockPlacedPackets,
} from '@/core/service/PwClientService.ts'
import { isDeveloper, isWorldOwner, requireWorldOwner } from '@/core/util/Environment.ts'
import { vec2 } from '@basementuniverse/vec'
import { Block, DeserialisedStructure, LayerType } from 'pw-js-world'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import {
  convertDeserializedStructureToWorldBlocks,
  getAnotherWorldBlocks,
  getDeserialisedStructureSectionVec2,
  placeMultipleBlocks,
  placeWorldDataBlocks,
  placeWorldDataBlocksUsingRandomPositionsPattern,
} from '@/core/service/WorldService.ts'
import { BotType } from '@/core/enum/BotType.ts'
import { setCustomTimeout } from '@/core/util/Sleep.ts'
import { handleException } from '@/core/util/Exception.ts'
import { GameError } from '@/core/class/GameError.ts'
import { workerWaitUntil } from '@/core/util/WorkerWaitUntil.ts'
import { mapGetOrInsert } from '@/core/util/MapGetOrInsert.ts'
import { useShiftBotWorldStore } from '@/shiftbot/store/ShiftBotWorldStore.ts'
import { ShiftBotState } from '@/shiftbot/enum/ShiftBotState.ts'
import { useShiftBotRoundStore } from '@/shiftbot/store/ShiftBotRoundStore.ts'
import { ShiftBotCommandName } from '@/shiftbot/enum/ShiftBotCommandName.ts'
import { ShiftBotMapEntry } from '@/shiftbot/type/ShiftBotMapEntry.ts'
import { userShiftBotAutomaticRestartCounterStore } from '@/shiftbot/store/ShiftBotAutomaticRestartCounterStore.ts'
import { createShiftBotWorldData, ShiftBotWorldData } from '@/shiftbot/type/ShiftBotPlayerWorldData.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { cloneDeep, inRange } from 'lodash-es'
import { ShiftBotLevelDifficulty } from '@/shiftbot/enum/ShiftBotLevelDifficulty.ts'
import { getRandomArrayElement } from '@/core/util/Random.ts'

const arenaTopLeftPos = vec2(35, 47)
const mapTopLeftPos = vec2(36, 48)
const arenaStartAreaTopLeftPos = vec2(49, 75)

const mapSize = vec2(32, 27)

const afkPos = vec2(69, 77)

const WAIT_TIME_BEFORE_ROUND_ENDS_AFTER_FIRST_WINNER_MS = 30_000
// const WAIT_TIME_BEFORE_ROUND_ENDS_AFTER_FIRST_WINNER_MS = 10_000
const MAX_ROUND_LENGTH_MS = 120_000
// const MAX_ROUND_LENGTH_MS = 12_000

const FRACTION_OF_PLAYERS_REQUIRED_TO_FINISH_LEVEL_TO_END_ROUND = 0.9
// const FRACTION_OF_PLAYERS_REQUIRED_TO_FINISH_LEVEL_TO_END_ROUND = 1

// NOTE: it's not a good idea to rely on these being constant, but it will do for now
const TEAM_NONE = 0
const TEAM_RED = 1
const TEAM_GREEN = 2
const TEAM_YELLOW = 6

const callbacks: CallbackEntry[] = [
  { name: 'playerInitPacket', fn: playerInitPacketReceived },
  { name: 'playerJoinedPacket', fn: playerJoinedPacketReceived },
  { name: 'playerChatPacket', fn: playerChatPacketReceived },
  { name: 'playerTeamUpdatePacket', fn: playerTeamUpdatePacketReceived },
  { name: 'playerGodModePacket', fn: playerGodModePacketReceived },
  { name: 'playerResetPacket', fn: playerResetPacketReceived },
  { name: 'playerLeftPacket', fn: playerLeftPacketReceived },
  { name: 'worldBlockPlacedPacket', fn: updateAwaitedWorldBlockPlacedPackets },
]

export function registerShiftBotCallbacks() {
  const client = getPwGameClient()
  const helper = getPwGameWorldHelper()
  client.addHook(helper.receiveHook)
  // client.addCallback('debug', console.log) // Too laggy to enable it by default
  client.addCallback('error', handleShiftBotError)
  for (const cb of callbacks) {
    client.addCallback(cb.name, cb.fn)
  }
}

if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', ({}) => {
    if (getPwBotType() === BotType.SHIFT_BOT) {
      hotReloadCallbacks(callbacks)
      if (useShiftBotWorldStore().currentState !== ShiftBotState.STOPPED) {
        void autoRestartShiftBot()
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
  useShiftBotRoundStore().playersInGame = useShiftBotRoundStore().playersInGame.filter((p) => p.playerId !== playerId)
}

function handleShiftBotError(e: unknown) {
  handleException(e)
}

function disqualifyPlayerFromRound(playerId: number) {
  if (getPlayerIdsInGame().includes(playerId)) {
    removePlayerFromPlayersInGame(playerId)
    sendRawMessage(`/team #${playerId} ${TEAM_NONE}`)
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

function checkIfPlayerTeleportedToMap(data: ProtoGen.PlayerTeamUpdatePacket) {
  if (
    [ShiftBotState.PREPARING_FOR_FIRST_ROUND, ShiftBotState.ROUND_START].includes(
      useShiftBotWorldStore().currentState,
    ) &&
    data.teamId === TEAM_GREEN
  ) {
    const playerId = data.playerId!
    useShiftBotRoundStore().playersInGame.push(getPwGameWorldHelper().players.get(playerId)!)
    getPlayerShiftBotWorldData(playerId).plays++
    updatePlayerCounterStats(playerId)
  }
}

function getPlayerIdsWhoCompletedLevel() {
  const allPlayerIdsInGame = getPlayerIdsInGame()

  return allPlayerIdsInGame.filter((playerId) => {
    const player = getPwGameWorldHelper().getPlayer(playerId)!
    return player.states.teamId === TEAM_YELLOW
  })
}

function checkIfPlayerTouchedRedTeamToDisqualify(data: ProtoGen.PlayerTeamUpdatePacket) {
  if (
    ![ShiftBotState.PREPARING_FOR_FIRST_ROUND, ShiftBotState.ROUND_START].includes(
      useShiftBotWorldStore().currentState,
    ) &&
    data.teamId === TEAM_RED
  ) {
    const playerId = data.playerId!
    disqualifyPlayerFromRound(playerId)
  }
}

function checkIfPlayerCompletedLevel(data: ProtoGen.PlayerTeamUpdatePacket) {
  if (useShiftBotWorldStore().currentState === ShiftBotState.PLAYING && data.teamId === TEAM_YELLOW) {
    const playerId = data.playerId!
    const player = getPwGameWorldHelper().getPlayer(playerId)!

    if (player.states.coins.gold !== useShiftBotRoundStore().currentMapEntry!.coinCount) {
      sendPrivateChatMessage("You have not collected all coins. Either you're cheating or an error occured.", playerId)
      disqualifyPlayerFromRound(playerId)
      sendRawMessage(`/tp #${playerId} ${afkPos.x} ${afkPos.y}`)

      return
    }

    const totalCompleted = getPlayerIdsWhoCompletedLevel()
    const totalCompletedCount = totalCompleted.length

    const lastPlayerCompletedLevel = totalCompletedCount >= getRequiredPlayersCountToFinishLevelEarlyToEndRound()

    if (!useShiftBotRoundStore().atLeastOnePlayerCompletedLevel) {
      useShiftBotRoundStore().timestampInMsWhenFirstPlayerCompletedLevel = performance.now()
      useShiftBotRoundStore().atLeastOnePlayerCompletedLevel = true
      if (lastPlayerCompletedLevel) {
        sendGlobalChatMessage(`${player.username.toUpperCase()} finished.`)
      } else {
        sendGlobalChatMessage(
          `${player.username.toUpperCase()} finished. ${WAIT_TIME_BEFORE_ROUND_ENDS_AFTER_FIRST_WINNER_MS / 1000} seconds left!`,
        )
      }
    }

    if (lastPlayerCompletedLevel) {
      sendGlobalChatMessage(`Round over! Players not finished are eliminated.`)
      setShiftBotState(ShiftBotState.ROUND_FINISHED)
    }
  }
}

function playerTeamUpdatePacketReceived(data: ProtoGen.PlayerTeamUpdatePacket) {
  checkIfPlayerTeleportedToMap(data)
  checkIfPlayerCompletedLevel(data)
  checkIfPlayerTouchedRedTeamToDisqualify(data)
}

function playerJoinedPacketReceived(data: ProtoGen.PlayerJoinedPacket) {
  const playerId = data.properties?.playerId
  if (playerId === undefined) {
    return
  }

  if (isWorldOwner(playerId)) {
    sendPrivateChatMessage('ShiftBot is here! Type .start to start the round. Type .help to see commands', playerId)
  } else {
    sendPrivateChatMessage('ShiftBot is here! Type .help to see commands', playerId)
  }

  mergePlayerStats(playerId)
}

function mergePlayerStats(playerId: number) {
  // If player leaves and rejoins, keep their stats
  const playerName = getPwGameWorldHelper().getPlayer(playerId)!.username
  for (const [existingPlayerId, data] of useShiftBotWorldStore().playerShiftBotWorldData) {
    if (data.username === playerName && existingPlayerId !== playerId) {
      useShiftBotWorldStore().playerShiftBotWorldData.set(playerId, { ...data })
      useShiftBotWorldStore().playerShiftBotWorldData.delete(existingPlayerId)
      updatePlayerCounterStats(playerId)
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

  switch (commandName as ShiftBotCommandName) {
    case ShiftBotCommandName.HELP:
      helpCommandReceived(commandArgs, playerId)
      break
    case ShiftBotCommandName.PING:
      sendPrivateChatMessage('pong', playerId)
      break
    case ShiftBotCommandName.START:
      await startCommandReceived(commandArgs, playerId, true)
      break
    case ShiftBotCommandName.QUICK_START:
      await startCommandReceived(commandArgs, playerId, false)
      break
    case ShiftBotCommandName.STOP:
      await stopCommandReceived(commandArgs, playerId)
      break
    case ShiftBotCommandName.AFK:
      afkCommandReceived(commandArgs, playerId)
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
    // sendPrivateChatMessage('You can also host ShiftBot yourself at: piratux.github.io/PixelWalker-Copy-Bot/', playerId)
    return
  }

  let commandName = args[0]

  if (commandName.startsWith('.')) {
    commandName = commandName.slice(1)
  }

  switch (commandName as ShiftBotCommandName) {
    case ShiftBotCommandName.PING:
      sendPrivateChatMessage('.ping - check if bot is alive by pinging it.', playerId)
      sendPrivateChatMessage(`Example usage: .ping`, playerId)
      break
    case ShiftBotCommandName.HELP:
      sendPrivateChatMessage(
        '.help [command] - get general help, or if command is specified, get help about command.',
        playerId,
      )
      sendPrivateChatMessage(`Example usage: .help afk`, playerId)
      break
    case ShiftBotCommandName.START:
      sendPrivateChatMessage('.start - starts ShiftBot game.', playerId)
      break
    case ShiftBotCommandName.QUICK_START:
      sendPrivateChatMessage('.start - starts ShiftBot game faster by not placing ShiftBot world', playerId)
      sendPrivateChatMessage('This can be used to customise ShiftBot world', playerId)
      break
    case ShiftBotCommandName.STOP:
      sendPrivateChatMessage('.stop - stops ShiftBot game.', playerId)
      break
    case ShiftBotCommandName.AFK:
      sendPrivateChatMessage(".afk - tells bot that you're afk or not.", playerId)
      break
    default:
      throw new GameError(`Unrecognised command ${commandName}. Type .help to see all commands`, playerId)
  }
}

async function placeShiftBotWorld() {
  sendGlobalChatMessage('Loading ShiftBot world...')
  const shiftBotMapWorldId = 'ra8b2aaeafc28c0'
  const blocks = await getAnotherWorldBlocks(shiftBotMapWorldId, getPwApiClient())
  await placeWorldDataBlocks(blocks)
}

async function placeShiftBotMap(mapEntry: ShiftBotMapEntry) {
  sendGlobalChatMessage('Loading map...')

  const worldBlocks = [
    ...convertDeserializedStructureToWorldBlocks(mapEntry.blocks, mapTopLeftPos),
    ...useShiftBotWorldStore().mapSurroundingBlocks,
  ]
  await placeWorldDataBlocksUsingRandomPositionsPattern(worldBlocks)
}

function mapIsValid(mapBlocks: DeserialisedStructure) {
  const coinBlocks = getReplacedExitWithCoinBlocks(mapBlocks, 1)
  const { entranceBlocks } = getReplacedEntryWithEntranceBlocks(mapBlocks)

  // TODO: validate if there are no unallowed blocks

  return entranceBlocks.length > 0 && coinBlocks.length > 0
}

function loadMaps(
  shiftBotBlocks: DeserialisedStructure,
  difficulty: ShiftBotLevelDifficulty,
  totalMapCount: vec2,
  mapSize: vec2,
  mapSpacing: vec2,
  topLeftMapOffset: vec2,
) {
  for (let x = 0; x < totalMapCount.x; x++) {
    for (let y = 0; y < totalMapCount.y; y++) {
      const sectionTopLeft = vec2.add(topLeftMapOffset, vec2.mul(vec2(x, y), mapSpacing))
      const mapBlocks = getDeserialisedStructureSectionVec2(
        shiftBotBlocks,
        sectionTopLeft,
        vec2.addm(sectionTopLeft, mapSize, vec2(-1, -1)),
      )

      if (!mapIsValid(mapBlocks)) {
        continue
      }

      const coinCount = countCoinsInMap(mapBlocks)

      useShiftBotWorldStore().shiftBotMaps[difficulty].push({
        blocks: mapBlocks,
        coinCount: coinCount,
      })
    }
  }
}

async function loadShiftBotData() {
  sendGlobalChatMessage('Loading ShiftBot data...')
  const shiftBotDataWorldId = 'lha96i2d435o05i'
  const shiftBotBlocks = await getAnotherWorldBlocks(shiftBotDataWorldId, getPwApiClient())

  useShiftBotWorldStore().mapRoundClearBlocks = getShiftBotWorldBlockStructure(
    shiftBotBlocks,
    vec2(3, 467),
    vec2(34, 30),
    arenaTopLeftPos,
  )
  useShiftBotWorldStore().mapFirstRoundPrepareBlocks = getShiftBotWorldBlockStructure(
    shiftBotBlocks,
    vec2(41, 467),
    vec2(34, 30),
    arenaTopLeftPos,
  )
  useShiftBotWorldStore().mapSurroundingBlocks = getShiftBotWorldBlockStructureWithoutAirBlocks(
    shiftBotBlocks,
    vec2(79, 467),
    vec2(34, 30),
    arenaTopLeftPos,
  )
  useShiftBotWorldStore().mapRoundStartBlocks = getShiftBotWorldBlockStructure(
    shiftBotBlocks,
    vec2(117, 467),
    vec2(6, 1),
    arenaStartAreaTopLeftPos,
  )
  useShiftBotWorldStore().map5SecondsAfterRoundStartBlocks = getShiftBotWorldBlockStructure(
    shiftBotBlocks,
    vec2(117, 472),
    vec2(6, 1),
    arenaStartAreaTopLeftPos,
  )

  useShiftBotWorldStore().mapEntranceBlock = shiftBotBlocks.blocks[LayerType.Foreground][117][477]
  useShiftBotWorldStore().mapExitBlock = shiftBotBlocks.blocks[LayerType.Foreground][122][477]
  useShiftBotWorldStore().arrowUpBlock = shiftBotBlocks.blocks[LayerType.Foreground][117][482]
  useShiftBotWorldStore().arrowRightBlock = shiftBotBlocks.blocks[LayerType.Foreground][122][482]
  useShiftBotWorldStore().mapEntranceCloseBlock = shiftBotBlocks.blocks[LayerType.Foreground][117][487]
  useShiftBotWorldStore().arrowLeftBlock = shiftBotBlocks.blocks[LayerType.Foreground][122][487]
  useShiftBotWorldStore().coinBlock = shiftBotBlocks.blocks[LayerType.Foreground][117][492]
  useShiftBotWorldStore().mapExitCloseBlock = shiftBotBlocks.blocks[LayerType.Foreground][122][492]

  {
    const totalMapCount = vec2(24, 5)
    const mapSpacing = vec2.add(mapSize, vec2(1, 1))
    const topLeftMapOffset = vec2(1, 1)

    loadMaps(shiftBotBlocks, ShiftBotLevelDifficulty.EASY, totalMapCount, mapSize, mapSpacing, topLeftMapOffset)
  }
  {
    const totalMapCount = vec2(24, 5)
    const mapSpacing = vec2.add(mapSize, vec2(1, 1))
    const topLeftMapOffset = vec2(1, 141)

    loadMaps(shiftBotBlocks, ShiftBotLevelDifficulty.MEDIUM, totalMapCount, mapSize, mapSpacing, topLeftMapOffset)
  }
  {
    const totalMapCount = vec2(24, 5)
    const mapSpacing = vec2.add(mapSize, vec2(1, 1))
    const topLeftMapOffset = vec2(1, 281)

    loadMaps(shiftBotBlocks, ShiftBotLevelDifficulty.HARD, totalMapCount, mapSize, mapSpacing, topLeftMapOffset)
  }

  const totalMapsLoaded =
    useShiftBotWorldStore().shiftBotMaps[ShiftBotLevelDifficulty.EASY].length +
    useShiftBotWorldStore().shiftBotMaps[ShiftBotLevelDifficulty.MEDIUM].length +
    useShiftBotWorldStore().shiftBotMaps[ShiftBotLevelDifficulty.HARD].length
  sendGlobalChatMessage(`Total of ${totalMapsLoaded} maps loaded`)
}

async function stopCommandReceived(_args: string[], playerId: number) {
  requireWorldOwner(playerId)
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  if (useShiftBotWorldStore().currentState === ShiftBotState.STOPPED) {
    throw new GameError('ShiftBot is already stopped', playerId)
  }

  await stopShiftBot()
}

async function stopShiftBot() {
  sendGlobalChatMessage('Stopping ShiftBot...')
  useShiftBotWorldStore().currentState = ShiftBotState.STOPPED
  await workerWaitUntil(() => !useShiftBotWorldStore().everySecondUpdateIsRunning, {
    timeout: 15000,
    intervalBetweenAttempts: 1000,
  })
  sendGlobalChatMessage('ShiftBot stopped!')
}

async function startCommandReceived(_args: string[], playerId: number, loadWorld: boolean) {
  requireWorldOwner(playerId)
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  if (useShiftBotWorldStore().currentState !== ShiftBotState.STOPPED) {
    throw new GameError('ShiftBot is already running', playerId)
  }

  // Because /tp commands don't work for non world owners, even if they have edit rights
  const botPlayerId = getPwGameWorldHelper().botPlayerId
  if (!isWorldOwner(botPlayerId)) {
    throw new GameError('Bot must be world owner for ShiftBot to work', playerId)
  }

  await startShiftBot(loadWorld)
}

async function startShiftBot(loadWorld: boolean) {
  if (getPwGameWorldHelper().width < 100 || getPwGameWorldHelper().height < 100) {
    throw new GameError('World must be of at least 100x100 size.')
  }

  sendGlobalChatMessage('Starting ShiftBot...')

  useShiftBotWorldStore().$reset()

  if (loadWorld) {
    await placeShiftBotWorld()
  }
  await loadShiftBotData()

  useShiftBotWorldStore().currentState = ShiftBotState.RESET_STORE

  sendGlobalChatMessage('ShiftBot started!')

  useShiftBotWorldStore().everySecondUpdateIsRunning = true
  void everySecondUpdate()
}

async function everySecondUpdate(): Promise<void> {
  if (useShiftBotWorldStore().currentState === ShiftBotState.STOPPED) {
    useShiftBotWorldStore().everySecondUpdateIsRunning = false
    return
  }

  try {
    await everySecondShiftBotUpdate()
  } catch (e) {
    handleException(e)
    await autoRestartShiftBot()
    return
  }

  // NOTE: This might be called less often than just every second, but it makes sure that `everySecondShiftBotUpdate` are never executed concurrently.
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
  return useShiftBotRoundStore().playersInGame.map((p) => p.playerId)
}

function getPlayersInGameCount() {
  return getPlayerIdsInGame().length
}

function updatePlayerCounterStats(playerId: number) {
  const playerBotData = getPlayerShiftBotWorldData(playerId)
  sendRawMessage(`/counter #${playerId} blue =${playerBotData.plays}`)
  sendRawMessage(`/counter #${playerId} white =${playerBotData.wins}`)
}

function playerWinRound(playerId: number) {
  sendRawMessage(`/givecrown #${playerId}`)
  sendRawMessage(`/team #${playerId} ${TEAM_NONE}`)
  sendGlobalChatMessage(`${getPwGameWorldHelper().getPlayer(playerId)?.username} wins!`)
  getPlayerShiftBotWorldData(playerId).wins++
  updatePlayerCounterStats(playerId)

  setShiftBotState(ShiftBotState.PAUSE_AFTER_ROUND)

  updateLeaderboard()

  useShiftBotRoundStore().winnerPlayerId = playerId
}

function updateLeaderboard() {
  const playerDataList = Array.from(useShiftBotWorldStore().playerShiftBotWorldData.entries()).map(
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
      const botData = getPlayerShiftBotWorldData(player.playerId)
      return `${index + 1}. ${botData.username}: ${getPlayerShiftBotWorldData(player.playerId).wins}`
    })
    .join('\n')
  const leaderboardFinalText = leaderboardTopText + '\n' + leaderboardPlayerText

  const leaderboardSignPos = vec2(74, 73)
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
  resetBotState()
}

function getRandomMap() {
  return getRandomArrayElement(useShiftBotWorldStore().shiftBotMaps[useShiftBotRoundStore().currentLevelDifficulty])
}

function resetBotState() {
  setShiftBotState(ShiftBotState.RESET_STORE)
}

async function clearMapAreaAfterRound() {
  await placeWorldDataBlocksUsingRandomPositionsPattern(useShiftBotWorldStore().mapRoundClearBlocks, 8)
}

function getLevelDifficultyForNextRound() {
  if (inRange(useShiftBotRoundStore().currentLevel, 1, 3)) {
    return ShiftBotLevelDifficulty.EASY
  } else if (inRange(useShiftBotRoundStore().currentLevel, 3, 5)) {
    return ShiftBotLevelDifficulty.MEDIUM
  } else {
    return ShiftBotLevelDifficulty.HARD
  }
}

function countCoinsInMap(mapBlocks: DeserialisedStructure) {
  let coinCount = 0
  for (let x = 0; x < mapBlocks.width; x++) {
    for (let y = 0; y < mapBlocks.height; y++) {
      const block = mapBlocks.blocks[LayerType.Foreground][x][y]
      if (block.bId === useShiftBotWorldStore().coinBlock.bId) {
        coinCount++
      }
    }
  }
  return coinCount
}

function getReplacedExitWithCoinBlocks(mapBlocks: DeserialisedStructure, coinCount: number): WorldBlock[] {
  const coinBlocks: WorldBlock[] = []
  for (let x = 0; x < mapBlocks.width; x++) {
    for (let y = 0; y < mapBlocks.height; y++) {
      if (x !== 0 && y !== 0 && x !== mapBlocks.width - 1 && y !== mapBlocks.height - 1) {
        continue
      }
      const block = mapBlocks.blocks[LayerType.Foreground][x][y]
      if (block.bId !== useShiftBotWorldStore().mapExitBlock.bId) {
        continue
      }

      coinBlocks.push({
        block: new Block(useShiftBotWorldStore().mapExitCloseBlock.bId, { coins: coinCount }),
        layer: LayerType.Foreground,
        pos: vec2.add(mapTopLeftPos, vec2(x, y)),
      })
    }
  }
  return coinBlocks
}

function getEntranceCloseBlocks(entranceBlocks: WorldBlock[], entrancePositions: vec2[]): WorldBlock[] {
  return entranceBlocks.map((wb) => {
    const block = entrancePositions.some((pos) => vec2.eq(vec2.add(pos, mapTopLeftPos), wb.pos))
      ? useShiftBotWorldStore().mapEntranceCloseBlock
      : getPwGameWorldHelper().getBlockAt(wb.pos, wb.layer)
    return {
      block: block,
      layer: wb.layer,
      pos: wb.pos,
    }
  })
}

function getReplacedEntryWithEntranceBlocks(mapBlocks: DeserialisedStructure): {
  entranceBlocks: WorldBlock[]
  entrancePositions: vec2[]
} {
  const entranceBlocks: WorldBlock[] = []
  const entrancePositions: vec2[] = []
  const mapEntranceBlockId = useShiftBotWorldStore().mapEntranceBlock.bId

  // Top entrance
  for (let x = 1; x < mapSize.x; x++) {
    if (mapBlocks.blocks[LayerType.Foreground][x][0].bId === mapEntranceBlockId) {
      entrancePositions.push(vec2(x, 0))
      for (let i = -1; i <= 1; i++) {
        entranceBlocks.push({
          block: new Block(0),
          layer: LayerType.Foreground,
          pos: vec2.add(mapTopLeftPos, vec2(x, i)),
        })
      }

      if (mapBlocks.blocks[LayerType.Foreground][x - 1][0].bId !== mapEntranceBlockId) {
        entranceBlocks.push({
          block: cloneDeep(useShiftBotWorldStore().mapEntranceCloseBlock),
          layer: LayerType.Foreground,
          pos: vec2.add(mapTopLeftPos, vec2(x - 1, -1)),
        })
      }
    }
  }

  // Left entrance
  for (let y = 1; y < mapSize.y; y++) {
    if (mapBlocks.blocks[LayerType.Foreground][0][y].bId === mapEntranceBlockId) {
      entrancePositions.push(vec2(0, y))
      for (let i = -1; i <= 1; i++) {
        entranceBlocks.push({
          block: useShiftBotWorldStore().arrowRightBlock,
          layer: LayerType.Foreground,
          pos: vec2.add(mapTopLeftPos, vec2(i, y)),
        })
      }

      if (mapBlocks.blocks[LayerType.Foreground][0][y + 1].bId !== mapEntranceBlockId) {
        entranceBlocks.push({
          block: cloneDeep(useShiftBotWorldStore().mapEntranceCloseBlock),
          layer: LayerType.Foreground,
          pos: vec2.add(mapTopLeftPos, vec2(-1, y + 1)),
        })
      }
    }
  }

  // Bottom entrance
  const maxY = mapSize.y - 1
  for (let x = mapSize.x - 2; x >= 0; x--) {
    if (mapBlocks.blocks[LayerType.Foreground][x][maxY].bId === mapEntranceBlockId) {
      entrancePositions.push(vec2(x, maxY))
      for (let i = -1; i <= 1; i++) {
        entranceBlocks.push({
          block: useShiftBotWorldStore().arrowUpBlock,
          layer: LayerType.Foreground,
          pos: vec2.add(mapTopLeftPos, vec2(x, maxY + i)),
        })
      }

      if (mapBlocks.blocks[LayerType.Foreground][x + 1][maxY].bId !== mapEntranceBlockId) {
        entranceBlocks.push({
          block: cloneDeep(useShiftBotWorldStore().mapEntranceCloseBlock),
          layer: LayerType.Foreground,
          pos: vec2.add(mapTopLeftPos, vec2(x + 1, maxY + 1)),
        })
      }
    }
  }

  // Right entrance
  const maxX = mapSize.x - 1
  for (let y = mapSize.y - 2; y >= 0; y--) {
    if (mapBlocks.blocks[LayerType.Foreground][maxX][y].bId === mapEntranceBlockId) {
      entrancePositions.push(vec2(maxX, y))
      for (let i = -1; i <= 1; i++) {
        entranceBlocks.push({
          block: useShiftBotWorldStore().arrowLeftBlock,
          layer: LayerType.Foreground,
          pos: vec2.add(mapTopLeftPos, vec2(maxX + i, y)),
        })
      }

      if (mapBlocks.blocks[LayerType.Foreground][maxX][y - 1].bId !== mapEntranceBlockId) {
        entranceBlocks.push({
          block: cloneDeep(useShiftBotWorldStore().mapEntranceCloseBlock),
          layer: LayerType.Foreground,
          pos: vec2.add(mapTopLeftPos, vec2(maxX + 1, y - 1)),
        })
      }
    }
  }
  return { entranceBlocks, entrancePositions }
}

async function adjustMapForRoundStart() {
  const coinBlocks = getReplacedExitWithCoinBlocks(
    useShiftBotRoundStore().currentMapEntry!.blocks,
    useShiftBotRoundStore().currentMapEntry!.coinCount,
  )
  await placeMultipleBlocks(coinBlocks)

  const { entranceBlocks, entrancePositions } = getReplacedEntryWithEntranceBlocks(
    useShiftBotRoundStore().currentMapEntry!.blocks,
  )
  useShiftBotRoundStore().entranceCloseBlocks = getEntranceCloseBlocks(entranceBlocks, entrancePositions)
  await placeMultipleBlocks(entranceBlocks)
}

function getRequiredPlayersCountToFinishLevelEarlyToEndRound() {
  return Math.floor(getPlayersInGameCount() * FRACTION_OF_PLAYERS_REQUIRED_TO_FINISH_LEVEL_TO_END_ROUND)
}

async function everySecondShiftBotUpdate() {
  switch (useShiftBotWorldStore().currentState) {
    case ShiftBotState.STOPPED:
      return
    case ShiftBotState.RESET_STORE:
      useShiftBotRoundStore().$reset()
      setShiftBotState(ShiftBotState.AWAITING_PLAYERS)
      return
    case ShiftBotState.AWAITING_PLAYERS: {
      const MINIMUM_PLAYER_COUNT_REQUIRED_TO_START_GAME = 2
      const activePlayerCount = getActivePlayerCount()
      if (activePlayerCount >= MINIMUM_PLAYER_COUNT_REQUIRED_TO_START_GAME) {
        sendGlobalChatMessage(`A total of ${activePlayerCount} active players were found. Starting round...`)
        setShiftBotState(ShiftBotState.PREPARING_FOR_FIRST_ROUND)
        useShiftBotRoundStore().waitingForMorePlayersMessagePrintedOnce = false
        return
      }

      if (
        useShiftBotWorldStore().lastActivePlayerCount < MINIMUM_PLAYER_COUNT_REQUIRED_TO_START_GAME - 1 &&
        useShiftBotWorldStore().lastActivePlayerCount < activePlayerCount
      ) {
        sendGlobalChatMessage(
          `${activePlayerCount} active player(s) found. Minimum of ${MINIMUM_PLAYER_COUNT_REQUIRED_TO_START_GAME} active players are required to start the game`,
        )
      }

      useShiftBotWorldStore().lastActivePlayerCount = activePlayerCount

      if (!useShiftBotRoundStore().waitingForMorePlayersMessagePrintedOnce) {
        useShiftBotRoundStore().waitingForMorePlayersMessagePrintedOnce = true
        sendGlobalChatMessage(
          `Waiting for more players. Minimum of ${MINIMUM_PLAYER_COUNT_REQUIRED_TO_START_GAME} active players are required to start the game`,
        )
      }
      break
    }
    case ShiftBotState.PREPARING_FOR_FIRST_ROUND: {
      await placeMultipleBlocks(useShiftBotWorldStore().mapFirstRoundPrepareBlocks)

      const activePlayers = getActivePlayers()

      const startPos = vec2(77, 49)
      for (const activePlayer of activePlayers) {
        const playerId = activePlayer.playerId
        sendRawMessage(`/tp #${playerId} ${startPos.x} ${startPos.y}`)
      }

      setShiftBotState(ShiftBotState.ROUND_START)

      break
    }
    case ShiftBotState.ROUND_START: {
      useShiftBotRoundStore().atLeastOnePlayerCompletedLevel = false
      useShiftBotRoundStore().currentLevel++
      useShiftBotRoundStore().secondsPassedInPlayingState = 0
      useShiftBotRoundStore().playersInformedOnceThatMinuteLeftBeforeMaxRoundLength = false
      useShiftBotRoundStore().playersInformedOnceThatFiveSecondsLeftBeforeRoundEndsBecausePlayerWon = false
      useShiftBotRoundStore().playersInformedOnceThatFiveSecondsLeftBeforeRoundEndsBecauseMaxRoundLengthReached = false

      useShiftBotRoundStore().currentLevelDifficulty = getLevelDifficultyForNextRound()

      sendGlobalChatMessage(
        `Level ${useShiftBotRoundStore().currentLevel}. Difficulty: ${ShiftBotLevelDifficulty[useShiftBotRoundStore().currentLevelDifficulty]}. ${getPlayersInGameCount()} players remaining. First ${getRequiredPlayersCountToFinishLevelEarlyToEndRound()} to finish survive`,
      )

      const map = getRandomMap()
      useShiftBotRoundStore().currentMapEntry = map

      await placeShiftBotMap(map)
      await adjustMapForRoundStart()
      await placeMultipleBlocks(useShiftBotWorldStore().mapRoundStartBlocks)

      useShiftBotRoundStore().timestampInMsWhenRoundStarted = performance.now()

      sendRawMessage(`/team @a[team=yellow] ${TEAM_GREEN}`)

      setShiftBotState(ShiftBotState.PLAYING)
      break
    }
    case ShiftBotState.PLAYING: {
      const playerIdsInGame = getPlayerIdsInGame()

      if (playerIdsInGame.length === 0) {
        abandonRoundDueToNoPlayersLeft()
        return
      }

      if (playerIdsInGame.length === 1) {
        playerWinRound(playerIdsInGame[0])
        return
      }

      useShiftBotRoundStore().secondsPassedInPlayingState++
      if (useShiftBotRoundStore().secondsPassedInPlayingState === 5) {
        await placeMultipleBlocks(useShiftBotRoundStore().entranceCloseBlocks)
        await placeMultipleBlocks(useShiftBotWorldStore().map5SecondsAfterRoundStartBlocks)
      }

      if (useShiftBotRoundStore().atLeastOnePlayerCompletedLevel) {
        if (
          !useShiftBotRoundStore().playersInformedOnceThatFiveSecondsLeftBeforeRoundEndsBecausePlayerWon &&
          performance.now() - useShiftBotRoundStore().timestampInMsWhenFirstPlayerCompletedLevel >
            WAIT_TIME_BEFORE_ROUND_ENDS_AFTER_FIRST_WINNER_MS - 5_000
        ) {
          useShiftBotRoundStore().playersInformedOnceThatFiveSecondsLeftBeforeRoundEndsBecausePlayerWon = true
          sendGlobalChatMessage(`5 seconds left!`)
        }
        if (
          performance.now() - useShiftBotRoundStore().timestampInMsWhenFirstPlayerCompletedLevel >
          WAIT_TIME_BEFORE_ROUND_ENDS_AFTER_FIRST_WINNER_MS
        ) {
          sendGlobalChatMessage(`Round over! Time is up.`)
          setShiftBotState(ShiftBotState.ROUND_FINISHED)
        }
      } else {
        if (
          !useShiftBotRoundStore().playersInformedOnceThatMinuteLeftBeforeMaxRoundLength &&
          performance.now() - useShiftBotRoundStore().timestampInMsWhenRoundStarted > MAX_ROUND_LENGTH_MS - 60_000
        ) {
          useShiftBotRoundStore().playersInformedOnceThatMinuteLeftBeforeMaxRoundLength = true
          sendGlobalChatMessage(
            `1 minute left, before the round automatically ends if no one has completed the level yet.`,
          )
        }
        if (
          !useShiftBotRoundStore().playersInformedOnceThatFiveSecondsLeftBeforeRoundEndsBecauseMaxRoundLengthReached &&
          performance.now() - useShiftBotRoundStore().timestampInMsWhenRoundStarted > MAX_ROUND_LENGTH_MS - 5_000
        ) {
          useShiftBotRoundStore().playersInformedOnceThatFiveSecondsLeftBeforeRoundEndsBecauseMaxRoundLengthReached = true
          sendGlobalChatMessage(
            `5 seconds left, before the round automatically ends if no one has completed the level yet.`,
          )
        }

        if (performance.now() - useShiftBotRoundStore().timestampInMsWhenRoundStarted > MAX_ROUND_LENGTH_MS) {
          sendGlobalChatMessage(`No winners after ${MAX_ROUND_LENGTH_MS / 1000} seconds, restarting round.`)
          setShiftBotState(ShiftBotState.ROUND_FINISHED)
        }
      }

      break
    }
    case ShiftBotState.ROUND_FINISHED: {
      // Immediately close the entrance
      await placeMultipleBlocks([
        {
          block: cloneDeep(useShiftBotWorldStore().mapEntranceCloseBlock),
          layer: LayerType.Foreground,
          pos: vec2(49, 75),
        },
      ])

      await clearMapAreaAfterRound()

      for (const playerId of getPlayerIdsInGame()) {
        const player = getPwGameWorldHelper().getPlayer(playerId)!
        if (player.states.teamId !== TEAM_YELLOW) {
          removePlayerFromPlayersInGame(playerId)
          if (player.states.teamId === TEAM_GREEN) {
            sendRawMessage(`/team #${playerId} ${TEAM_NONE}`)
          }
        }
      }

      const totalCompleted = getPlayerIdsWhoCompletedLevel()
      const totalCompletedCount = totalCompleted.length

      if (totalCompletedCount === 0) {
        setShiftBotState(ShiftBotState.PAUSE_AFTER_ROUND)
        return
      } else if (totalCompletedCount === 1) {
        playerWinRound(totalCompleted[0])
      } else {
        setShiftBotState(ShiftBotState.ROUND_START)
      }

      break
    }
    case ShiftBotState.PAUSE_AFTER_ROUND: {
      useShiftBotRoundStore().secondsPassedInPauseAfterRoundState++
      if (
        useShiftBotRoundStore().secondsPassedInPauseAfterRoundState === 2 &&
        useShiftBotRoundStore().winnerPlayerId !== null
      ) {
        const winPos = vec2(59, 79)
        const playerId = useShiftBotRoundStore().winnerPlayerId
        sendRawMessage(`/tp #${playerId} ${winPos.x} ${winPos.y}`)
      }

      if (useShiftBotRoundStore().secondsPassedInPauseAfterRoundState > 5) {
        resetBotState()
      }
      break
    }
    default:
      throw new Error('Unknown ShiftBotState: ' + useShiftBotWorldStore().currentState)
  }
}

function disqualifyPlayerFromRoundBecauseAfk(playerId: number) {
  sendRawMessage(`/tp #${playerId} ${afkPos.x} ${afkPos.y}`)
  makePlayerAfk(playerId)
}

function makePlayerAfk(playerId: number) {
  sendRawMessage(`/team #${playerId} ${TEAM_RED}`)
  removePlayerFromPlayersInGame(playerId)
  sendPrivateChatMessage('You are now marked as AFK. You can type .afk to unmark yourself.', playerId)
}

async function autoRestartShiftBot() {
  if (useShiftBotWorldStore().currentState === ShiftBotState.STOPPED) {
    return
  }

  sendGlobalChatMessage('Restarting ShiftBot...')
  await stopShiftBot()

  const MAX_AUTOMATIC_RESTARTS = 3
  if (userShiftBotAutomaticRestartCounterStore().totalAutomaticRestarts >= MAX_AUTOMATIC_RESTARTS) {
    sendGlobalChatMessage(`ShiftBot has automatically restarted ${MAX_AUTOMATIC_RESTARTS} times, not restarting again`)
    return
  }
  userShiftBotAutomaticRestartCounterStore().totalAutomaticRestarts++

  await startShiftBot(false)
}

function getPlayerShiftBotWorldData(playerId: number): ShiftBotWorldData {
  return mapGetOrInsert(useShiftBotWorldStore().playerShiftBotWorldData, playerId, createShiftBotWorldData(playerId))
}

function setShiftBotState(newState: ShiftBotState) {
  // Prevent state from being changed if we're trying to stop the bot
  if (useShiftBotWorldStore().currentState === ShiftBotState.STOPPED) {
    return
  }
  useShiftBotWorldStore().currentState = newState
}

function getShiftBotWorldBlockStructureWithoutAirBlocks(
  shiftBotBlocks: DeserialisedStructure,
  topLeft: vec2,
  size: vec2,
  offset: vec2 = vec2(0, 0),
): WorldBlock[] {
  const blocks = getDeserialisedStructureSectionVec2(shiftBotBlocks, topLeft, vec2.addm(topLeft, size, vec2(-1, -1)))
  const worldBlocks = convertDeserializedStructureToWorldBlocks(blocks)
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

function getShiftBotWorldBlockStructure(
  shiftBotBlocks: DeserialisedStructure,
  topLeft: vec2,
  size: vec2,
  offset: vec2 = vec2(0, 0),
): WorldBlock[] {
  const blocks = getDeserialisedStructureSectionVec2(shiftBotBlocks, topLeft, vec2.addm(topLeft, size, vec2(-1, -1)))
  const worldBlocks = convertDeserializedStructureToWorldBlocks(blocks)
  return worldBlocks.map((wb) => ({
    block: cloneDeep(wb.block),
    layer: wb.layer,
    pos: vec2.add(wb.pos, offset),
  }))
}
