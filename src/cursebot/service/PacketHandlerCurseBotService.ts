import { getPwApiClient, getPwBotType, getPwGameClient, getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { sendGlobalChatMessage, sendPrivateChatMessage, sendRawMessage } from '@/core/service/ChatMessageService.ts'
import { ProtoGen } from 'pw-js-api'
import { CallbackEntry } from '@/core/type/CallbackEntry.ts'
import {
  commonPlayerInitPacketReceived,
  hotReloadCallbacks,
  requirePlayerAndBotEditPermission,
} from '@/core/service/PwClientService.ts'
import { isDeveloper, isWorldOwner, requireDeveloper } from '@/core/util/Environment.ts'
import { vec2 } from '@basementuniverse/vec'
import { Block, DeserialisedStructure, LayerType } from 'pw-js-world'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import {
  getAnotherWorldBlocks,
  getDeserialisedStructureSectionVec2,
  placeMultipleBlocks,
  placeWorldDataBlocks,
} from '@/core/service/WorldService.ts'
import { BotType } from '@/core/enum/BotType.ts'
import { setCustomTimeout } from '@/core/util/Sleep.ts'
import { handleException } from '@/core/util/Exception.ts'
import { getRandomArrayElement } from '@/core/util/Random.ts'
import { GameError } from '@/core/class/GameError.ts'
import { workerWaitUntil } from '@/core/util/WorkerWaitUntil.ts'
import { mapGetOrInsert } from '@/core/util/MapGetOrInsert.ts'
import { getWorldIdIfUrl } from '@/core/util/WorldIdExtractor.ts'
import { useCurseBotWorldStore } from '@/cursebot/store/CurseBotWorldStore.ts'
import { CurseBotState } from '@/cursebot/enum/CurseBotState.ts'
import { useCurseBotRoundStore } from '@/cursebot/store/CurseBotRoundStore.ts'
import { CurseBotCommandName } from '@/cursebot/enum/CurseBotCommandName.ts'
import { CurseBotMapEntry } from '@/cursebot/type/CurseBotMapEntry.ts'
import { userCurseBotAutomaticRestartCounterStore } from '@/cursebot/store/CurseBotAutomaticRestartCounterStore.ts'
import { createCurseBotWorldData, CurseBotWorldData } from '@/cursebot/type/CurseBotPlayerWorldData.ts'
import { useBomBotRoundStore } from '@/bombot/store/BomBotRoundStore.ts'

const mapSize = vec2(50, 50)
const mapTopLeftPos = vec2(0, 0)

// NOTE: it's not a good idea to rely on these being constant, but it will do for now
const TEAM_NONE = 0
const TEAM_RED = 1
const TEAM_GREEN = 2
const TEAM_YELLOW = 6

const EFFECT_CURSE = 4

const CURSE_LENGTH_MS = 60_000

const callbacks: CallbackEntry[] = [
  { name: 'playerInitPacket', fn: playerInitPacketReceived },
  { name: 'playerJoinedPacket', fn: playerJoinedPacketReceived },
  { name: 'playerChatPacket', fn: playerChatPacketReceived },
  { name: 'playerTeamUpdatePacket', fn: playerTeamUpdatePacketReceived },
  { name: 'playerGodModePacket', fn: playerGodModePacketReceived },
  { name: 'playerResetPacket', fn: playerResetPacketReceived },
  { name: 'playerLeftPacket', fn: playerLeftPacketReceived },
  { name: 'playerAddEffectPacket', fn: playerAddEffectPacketReceived },
  { name: 'playerCountersUpdatePacket', fn: playerCountersUpdatePacketReceived },
]

export function registerCurseBotCallbacks() {
  const client = getPwGameClient()
  const helper = getPwGameWorldHelper()
  client.addHook(helper.receiveHook)
  // client.addCallback('debug', console.log) // Too laggy to enable it by default
  client.addCallback('error', handleCurseBotError)
  for (const cb of callbacks) {
    client.addCallback(cb.name, cb.fn)
  }
}

if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', ({}) => {
    if (getPwBotType() === BotType.CURSE_BOT) {
      hotReloadCallbacks(callbacks)
      if (useCurseBotWorldStore().currentState !== CurseBotState.STOPPED) {
        void autoRestartCurseBot()
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
  useCurseBotRoundStore().playersInGame = useCurseBotRoundStore().playersInGame.filter((p) => p.playerId !== playerId)
}

function handleCurseBotError(e: unknown) {
  handleException(e)
}

function disqualifyPlayerFromRound(playerId: number) {
  if (getPlayerIdsInGame().includes(playerId)) {
    removePlayerFromPlayersInGame(playerId)
    sendRawMessage(`/team #${playerId} ${TEAM_NONE}`)

    if (
      (useCurseBotWorldStore().currentState === CurseBotState.PLAYING ||
        useCurseBotWorldStore().currentState === CurseBotState.COUNTING_DOWN_TO_REMOVE_NO_SPEED) &&
      playerId === useCurseBotRoundStore().lastPlayerIdWithCurseEffect
    ) {
      const curseLength = CURSE_LENGTH_MS - (performance.now() - useCurseBotRoundStore().timestampInMsWhenCursePickedUp)
      givePlayerCurse(getRandomPlayerInGame().playerId, curseLength)
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

function playerAddEffectPacketReceived(data: ProtoGen.PlayerAddEffectPacket) {
  trackLastPlayerWithCurseEffect(data)
}

function trackLastPlayerWithCurseEffect(data: ProtoGen.PlayerAddEffectPacket) {
  if (data.effectId === EFFECT_CURSE) {
    useCurseBotRoundStore().lastPlayerIdWithCurseEffect = data.playerId!
  }
}

function checkIfPlayerTeleportedToStartPos(data: ProtoGen.PlayerTeamUpdatePacket) {
  if (
    useCurseBotWorldStore().currentState === CurseBotState.WAITING_FOR_ALL_PLAYERS_TO_BE_TELEPORTED_TO_MAP &&
    data.teamId === TEAM_YELLOW
  ) {
    const playerId = data.playerId!

    useCurseBotRoundStore().playersInGame.push(getPwGameWorldHelper().players.get(playerId)!)
    getPlayerCurseBotWorldData(playerId).plays++
    sendRawMessage(`/counter #${playerId} blue =${getPlayerCurseBotWorldData(playerId).plays}`)
  }
}

function checkIfPlayerTeleportedToMap(data: ProtoGen.PlayerTeamUpdatePacket) {
  if (
    useCurseBotWorldStore().currentState === CurseBotState.WAITING_FOR_ALL_PLAYERS_TO_BE_TELEPORTED_TO_MAP &&
    data.teamId === TEAM_GREEN
  ) {
    setCurseBotState(CurseBotState.COUNTING_DOWN_TO_REMOVE_NO_SPEED)

    const playerIdsInGame = getPlayerIdsInGame()
    for (const playerThatWasSelectedForRoundStart of useBomBotRoundStore().playersThatWereSelectedForRoundStart) {
      if (!playerIdsInGame.includes(playerThatWasSelectedForRoundStart.playerId)) {
        disqualifyPlayerFromRoundBecauseAfk(playerThatWasSelectedForRoundStart.playerId)
      }
    }
  }
}

function checkIfPlayerJustWon(data: ProtoGen.PlayerCountersUpdatePacket) {
  const playerId = data.playerId!
  if (useCurseBotRoundStore().lastPlayerIdWithCurseEffect === playerId) {
    playerWinRound(playerId)
  }
}

function playerCountersUpdatePacketReceived(data: ProtoGen.PlayerCountersUpdatePacket) {
  // NOTE: A hack! Currently the official proper way to detect player death, is to track death counter for all players, and see if it changes with this packet
  // However that's too much work.
  // We simplify this, by knowing this packet will only get sent when player dies, because we have no coins in this world.
  if (data.coins > 0 || data.blueCoins > 0) {
    throw new GameError('Coins should not be placed in this world!')
  }
  checkIfPlayerJustWon(data)
  disqualifyPlayerFromRound(data.playerId!)
}

function playerTeamUpdatePacketReceived(data: ProtoGen.PlayerTeamUpdatePacket) {
  checkIfPlayerTeleportedToStartPos(data)
  checkIfPlayerTeleportedToMap(data)
}

function playerJoinedPacketReceived(data: ProtoGen.PlayerJoinedPacket) {
  const playerId = data.properties?.playerId
  if (playerId === undefined) {
    return
  }

  if (isWorldOwner(playerId)) {
    sendPrivateChatMessage('CurseBot is here! Type .start to start the round. Type .help to see commands', playerId)
  } else {
    sendPrivateChatMessage('CurseBot is here! Type .help to see commands', playerId)
  }

  mergePlayerStats(playerId)
}

function mergePlayerStats(playerId: number) {
  // If player leaves and rejoins, keep their stats
  const playerName = getPwGameWorldHelper().getPlayer(playerId)!.username
  for (const [existingPlayerId, data] of useCurseBotWorldStore().playerCurseBotWorldData) {
    if (data.username === playerName && existingPlayerId !== playerId) {
      useCurseBotWorldStore().playerCurseBotWorldData.set(playerId, { ...data })
      useCurseBotWorldStore().playerCurseBotWorldData.delete(existingPlayerId)
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

  switch (commandName as CurseBotCommandName) {
    case CurseBotCommandName.HELP:
      helpCommandReceived(commandArgs, playerId)
      break
    case CurseBotCommandName.PING:
      sendPrivateChatMessage('pong', playerId)
      break
    case CurseBotCommandName.START:
      await startCommandReceived(commandArgs, playerId, true)
      break
    case CurseBotCommandName.QUICK_START:
      await startCommandReceived(commandArgs, playerId, false)
      break
    case CurseBotCommandName.STOP:
      await stopCommandReceived(commandArgs, playerId)
      break
    case CurseBotCommandName.AFK:
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
    // sendPrivateChatMessage('You can also host CurseBot yourself at: piratux.github.io/PixelWalker-Copy-Bot/', playerId)
    return
  }

  let commandName = args[0]

  if (commandName.startsWith('.')) {
    commandName = commandName.slice(1)
  }

  switch (commandName as CurseBotCommandName) {
    case CurseBotCommandName.PING:
      sendPrivateChatMessage('.ping - check if bot is alive by pinging it.', playerId)
      sendPrivateChatMessage(`Example usage: .ping`, playerId)
      break
    case CurseBotCommandName.HELP:
      sendPrivateChatMessage(
        '.help [command] - get general help, or if command is specified, get help about command.',
        playerId,
      )
      sendPrivateChatMessage(`Example usage: .help afk`, playerId)
      break
    case CurseBotCommandName.START:
      sendPrivateChatMessage('.start - starts CurseBot game.', playerId)
      break
    case CurseBotCommandName.QUICK_START:
      sendPrivateChatMessage('.start - starts CurseBot game faster by not placing CurseBot world', playerId)
      sendPrivateChatMessage('This can be used to customise CurseBot world', playerId)
      break
    case CurseBotCommandName.STOP:
      sendPrivateChatMessage('.stop - stops CurseBot game.', playerId)
      break
    case CurseBotCommandName.AFK:
      sendPrivateChatMessage(".afk - tells bot that you're afk or not.", playerId)
      break
    default:
      throw new GameError(`Unrecognised command ${commandName}. Type .help to see all commands`, playerId)
  }
}

async function placeCurseBotWorld() {
  sendGlobalChatMessage('Loading CurseBot world...')
  const curseBotMapWorldId = 'ra252b9f970bc53'
  const blocks = await getAnotherWorldBlocks(curseBotMapWorldId, getPwApiClient())
  await placeWorldDataBlocks(blocks)
}

async function placeCurseBotMap(mapEntry: CurseBotMapEntry) {
  sendGlobalChatMessage('Loading map...')

  await placeWorldDataBlocks(mapEntry.blocks, mapTopLeftPos)
}

function loadMaps(curseBotBlocks: DeserialisedStructure) {
  const totalMapCount = vec2(3, 6)
  const mapSpacing = vec2.add(mapSize, vec2(22, 3))
  const topLeftMapOffset = vec2(3, 3)
  for (let x = 0; x < totalMapCount.x; x++) {
    for (let y = 0; y < totalMapCount.y; y++) {
      const sectionTopLeft = vec2.add(topLeftMapOffset, vec2.mul(vec2(x, y), mapSpacing))
      const mapBlocks = getDeserialisedStructureSectionVec2(
        curseBotBlocks,
        sectionTopLeft,
        vec2.addm(sectionTopLeft, mapSize, vec2(-1, -1)),
      )

      // TODO: validate map

      useCurseBotWorldStore().curseBotMaps.push({
        blocks: mapBlocks,
      })
    }
  }
}

async function loadCurseBotData() {
  sendGlobalChatMessage('Loading CurseBot data...')
  const curseBotDataWorldId = getWorldIdIfUrl('r0499638a6d91ec')
  const curseBotBlocks = await getAnotherWorldBlocks(curseBotDataWorldId, getPwApiClient())

  loadMaps(curseBotBlocks)

  sendGlobalChatMessage(`Total of ${useCurseBotWorldStore().curseBotMaps.length} maps loaded`)
}

async function stopCommandReceived(_args: string[], playerId: number) {
  requireDeveloper(playerId)
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  if (useCurseBotWorldStore().currentState === CurseBotState.STOPPED) {
    throw new GameError('CurseBot is already stopped', playerId)
  }

  await stopCurseBot()
}

async function stopCurseBot() {
  sendGlobalChatMessage('Stopping CurseBot...')
  useCurseBotWorldStore().currentState = CurseBotState.STOPPED
  await workerWaitUntil(() => !useCurseBotWorldStore().everySecondUpdateIsRunning, {
    timeout: 15000,
    intervalBetweenAttempts: 1000,
  })
  sendGlobalChatMessage('CurseBot stopped!')
}

async function startCommandReceived(_args: string[], playerId: number, loadWorld: boolean) {
  requireDeveloper(playerId)
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  if (useCurseBotWorldStore().currentState !== CurseBotState.STOPPED) {
    throw new GameError('CurseBot is already running', playerId)
  }

  // Because /tp commands don't work for non world owners, even if they have edit rights
  const botPlayerId = getPwGameWorldHelper().botPlayerId
  if (!isWorldOwner(botPlayerId)) {
    throw new GameError('Bot must be world owner for CurseBot to work', playerId)
  }

  await startCurseBot(loadWorld)
}

async function startCurseBot(loadWorld: boolean) {
  sendGlobalChatMessage('Starting CurseBot...')

  useCurseBotWorldStore().$reset()

  if (loadWorld) {
    await placeCurseBotWorld()
  }
  await loadCurseBotData()

  useCurseBotWorldStore().currentState = CurseBotState.RESET_STORE

  sendGlobalChatMessage('CurseBot started!')

  useCurseBotWorldStore().everySecondUpdateIsRunning = true
  void everySecondUpdate()
}

async function everySecondUpdate(): Promise<void> {
  if (useCurseBotWorldStore().currentState === CurseBotState.STOPPED) {
    useCurseBotWorldStore().everySecondUpdateIsRunning = false
    return
  }

  try {
    await everySecondCurseBotUpdate()
  } catch (e) {
    handleException(e)
    await autoRestartCurseBot()
    return
  }

  // NOTE: This might be called less often than just every second, but it makes sure that `everySecondCurseBotUpdate` are never executed concurrently.
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
  return useCurseBotRoundStore().playersInGame.map((p) => p.playerId)
}

function playerWinRound(playerId: number) {
  sendRawMessage(`/givecrown #${playerId}`)
  sendRawMessage(`/team #${playerId} ${TEAM_NONE}`)
  sendGlobalChatMessage(`${getPwGameWorldHelper().getPlayer(playerId)?.username} wins!`)
  getPlayerCurseBotWorldData(playerId).wins++
  sendRawMessage(`/counter #${playerId} white =${getPlayerCurseBotWorldData(playerId).wins}`)
  sendRawMessage(`/cleareffects #${playerId}`) // remove potential curse

  setCurseBotState(CurseBotState.CELEBRATING_VICTORY)

  updateLeaderboard()

  useCurseBotRoundStore().winnerPlayerId = playerId
}

function updateLeaderboard() {
  const playerDataList = Array.from(useCurseBotWorldStore().playerCurseBotWorldData.entries()).map(
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
      const botData = getPlayerCurseBotWorldData(player.playerId)
      return `${index + 1}. ${botData.username}: ${getPlayerCurseBotWorldData(player.playerId).wins}`
    })
    .join('\n')
  const leaderboardFinalText = leaderboardTopText + '\n' + leaderboardPlayerText

  const leaderboardSignPos = vec2(5, 191)
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
  return getRandomArrayElement(useCurseBotWorldStore().curseBotMaps)
}

function getRandomPlayerInGame() {
  return getRandomArrayElement(useCurseBotRoundStore().playersInGame)
}

function givePlayerCurse(playerId: number, curseLengthMs: number) {
  curseLengthMs = Math.floor(curseLengthMs)
  curseLengthMs = Math.max(1000, curseLengthMs)

  sendRawMessage(`/giveeffect #${playerId} curse ${curseLengthMs}`)
  sendGlobalChatMessage(`${getPwGameWorldHelper().getPlayer(playerId)?.username} has been cursed! Steal their curse!`)
}

function resetBotState() {
  sendRawMessage(`/kill @a[team=green]`)
  sendRawMessage(`/team @a[team=green] ${TEAM_NONE}`)
  setCurseBotState(CurseBotState.RESET_STORE)
}

async function everySecondCurseBotUpdate() {
  // sendGlobalChatMessage(`[DEBUG] Current state: ${CurseBotState[useCurseBotWorldStore().currentState]}`)
  switch (useCurseBotWorldStore().currentState) {
    case CurseBotState.STOPPED:
      return
    case CurseBotState.RESET_STORE:
      useCurseBotRoundStore().$reset()
      setCurseBotState(CurseBotState.AWAITING_PLAYERS)
      return
    case CurseBotState.AWAITING_PLAYERS: {
      const minimumPlayerCountRequiredToStartGame = 2
      const activePlayerCount = getActivePlayerCount()
      if (activePlayerCount >= minimumPlayerCountRequiredToStartGame) {
        sendGlobalChatMessage(`A total of ${activePlayerCount} active players were found. Starting round...`)
        setCurseBotState(CurseBotState.PREPARING_FOR_NEXT_ROUND)
        return
      }

      if (!useCurseBotRoundStore().waitingForMorePlayersMessagePrintedOnce) {
        useCurseBotRoundStore().waitingForMorePlayersMessagePrintedOnce = true
        sendGlobalChatMessage(
          `Waiting for more players. Minimum of ${minimumPlayerCountRequiredToStartGame} active players are required to start the game`,
        )
      }
      break
    }
    case CurseBotState.PREPARING_FOR_NEXT_ROUND: {
      const map = getRandomMap()
      await placeCurseBotMap(map)

      const activePlayers = getActivePlayers()

      const startPos = vec2(10, 167)
      for (const activePlayer of activePlayers) {
        const playerId = activePlayer.playerId
        sendRawMessage(`/tp #${playerId} ${startPos.x} ${startPos.y}`)
      }

      setCurseBotState(CurseBotState.WAITING_FOR_ALL_PLAYERS_TO_BE_TELEPORTED_TO_MAP)
      useCurseBotRoundStore().playersThatWereSelectedForRoundStart = activePlayers

      break
    }
    case CurseBotState.WAITING_FOR_ALL_PLAYERS_TO_BE_TELEPORTED_TO_MAP: {
      useCurseBotRoundStore().secondsPassedInWaitingForAllPlayersToBeTeleportedToMapState++
      if (useCurseBotRoundStore().secondsPassedInWaitingForAllPlayersToBeTeleportedToMapState > 10) {
        sendGlobalChatMessage('Not all players teleported to map in time, restarting round')
        resetBotState()
      }
      break
    }
    case CurseBotState.COUNTING_DOWN_TO_REMOVE_NO_SPEED: {
      useCurseBotRoundStore().secondsPassedInCountingDownToRemoveNoSpeedState++
      if (useCurseBotRoundStore().secondsPassedInCountingDownToRemoveNoSpeedState > 5) {
        sendGlobalChatMessage('Round started!')
        setCurseBotState(CurseBotState.PLAYING)
        sendRawMessage(`/giveeffect @a[team=green] speed 100`)
      }

      if (useCurseBotRoundStore().secondsPassedInCountingDownToRemoveNoSpeedState === 2) {
        const randomPlayerId = getRandomPlayerInGame().playerId
        const curseStartPos = vec2(6, 176)
        sendRawMessage(`/tp #${randomPlayerId} ${curseStartPos.x} ${curseStartPos.y}`)
        useCurseBotRoundStore().lastPlayerIdWithCurseEffect = randomPlayerId
      }

      // We need to give player curse after a short delay after teleporting, otherwise they may transfer it to other starting players
      if (useCurseBotRoundStore().secondsPassedInCountingDownToRemoveNoSpeedState === 3) {
        givePlayerCurse(useCurseBotRoundStore().lastPlayerIdWithCurseEffect, CURSE_LENGTH_MS)
        useCurseBotRoundStore().timestampInMsWhenCursePickedUp = performance.now()
      }
      break
    }
    case CurseBotState.PLAYING: {
      const playerIdsInGame = getPlayerIdsInGame()

      if (playerIdsInGame.length === 0) {
        abandonRoundDueToNoPlayersLeft()
        return
      }

      if (playerIdsInGame.length === 1) {
        playerWinRound(playerIdsInGame[0])
        return
      }

      if (performance.now() - useCurseBotRoundStore().timestampInMsWhenCursePickedUp > CURSE_LENGTH_MS + 20_000) {
        sendGlobalChatMessage(
          `For some reason player with curse did not die within ${(CURSE_LENGTH_MS + 20_000) / 1000} seconds, restarting round...`,
        )
        resetBotState()
      }

      break
    }
    case CurseBotState.CELEBRATING_VICTORY: {
      useCurseBotRoundStore().secondsPassedInCelebratingVictoryState++
      if (useCurseBotRoundStore().secondsPassedInCelebratingVictoryState === 2) {
        const winPos = vec2(4, 184)
        const playerId = useCurseBotRoundStore().winnerPlayerId
        sendRawMessage(`/tp #${playerId} ${winPos.x} ${winPos.y}`)
      }

      if (useCurseBotRoundStore().secondsPassedInCelebratingVictoryState > 5) {
        resetBotState()
      }
      break
    }
    default:
      throw new Error('Unknown CurseBotState: ' + useCurseBotWorldStore().currentState)
  }
}

function disqualifyPlayerFromRoundBecauseAfk(playerId: number) {
  const afkPos = vec2(7, 195)
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

async function autoRestartCurseBot() {
  if (useCurseBotWorldStore().currentState === CurseBotState.STOPPED) {
    return
  }

  sendGlobalChatMessage('Restarting CurseBot...')
  await stopCurseBot()

  const MAX_AUTOMATIC_RESTARTS = 3
  if (userCurseBotAutomaticRestartCounterStore().totalAutomaticRestarts >= MAX_AUTOMATIC_RESTARTS) {
    sendGlobalChatMessage(`CurseBot has automatically restarted ${MAX_AUTOMATIC_RESTARTS} times, not restarting again`)
    return
  }
  userCurseBotAutomaticRestartCounterStore().totalAutomaticRestarts++

  await startCurseBot(false)
}

function getPlayerCurseBotWorldData(playerId: number): CurseBotWorldData {
  return mapGetOrInsert(useCurseBotWorldStore().playerCurseBotWorldData, playerId, createCurseBotWorldData(playerId))
}

function setCurseBotState(newState: CurseBotState) {
  // Prevent state from being changed if we're trying to stop the bot
  if (useCurseBotWorldStore().currentState === CurseBotState.STOPPED) {
    return
  }
  useCurseBotWorldStore().currentState = newState
}
