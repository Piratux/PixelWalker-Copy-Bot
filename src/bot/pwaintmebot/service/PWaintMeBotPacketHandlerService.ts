import { ProtoGen } from 'pw-js-api'
import { PWAINTME_ARENA, PWAINTME_TEAMS } from '@/bot/pwaintmebot/constant/General.ts'
import { PWaintMeBotCommandName } from '@/bot/pwaintmebot/enum/PWaintMeBotCommandName.ts'
import { PWaintMeBotState } from '@/bot/pwaintmebot/enum/PWaintMeBotState.ts'
import { resetPWaintMeBotRoundStore, usePWaintMeBotRoundStore } from '@/bot/pwaintmebot/store/PWaintMeBotRoundStore.ts'
import { usePWaintMeBotWorldStore } from '@/bot/pwaintmebot/store/PWaintMeBotWorldStore.ts'
import {
  capturePWaintMeMap,
  createPWaintMeMap,
  getPWaintMeMapKey,
  loadPWaintMeMapWorld,
  placePWaintMeMap,
  placePWaintMeWorld,
} from '@/bot/pwaintmebot/service/PWaintMeMapService.ts'
import { initPWaintMePalette } from '@/bot/pwaintmebot/service/PWaintMePaletteService.ts'
import { collectPWaintMeCoins, movePWaintMePlayer } from '@/bot/pwaintmebot/service/PWaintMePaintingService.ts'
import {
  advancePWaintMeRound,
  applyPWaintMeRoundModifier,
  getPWaintMePlayerStats,
  queuePWaintMePlayer,
  removePWaintMePlayer,
  resetPWaintMePlayer,
  restorePWaintMeArena,
  teleportPWaintMePlayerToArena,
  updatePWaintMeLobbySigns,
  updatePWaintMePlayerCounters,
} from '@/bot/pwaintmebot/service/PWaintMeRoundService.ts'
import { BotType } from '@/core/enum/BotType.ts'
import { CallbackEntry } from '@/core/type/CallbackEntry.ts'
import { GameError } from '@/core/class/GameError.ts'
import { getPwBotType, getPwGameClient, getPwGameWorldHelper, usePwClientStore } from '@/core/store/PwClientStore.ts'
import {
  commonPlayerInitPacketReceived,
  hotReloadCallbacks,
  initPwConnection,
  requirePlayerAndBotEditPermission,
  updateAwaitedWorldBlockPlacedPackets,
} from '@/core/service/PwClientService.ts'
import { isWorldOwner, requireWorldOwner } from '@/core/util/Environment.ts'
import { handleException } from '@/core/util/Exception.ts'
import { sendGlobalChatMessage, sendPrivateChatMessage, sendRawMessage } from '@/core/service/ChatMessageService.ts'
import { isBotStarting, shouldPauseForBotRotation } from '@/core/service/BotHandlerService.ts'
import { setCustomTimeout } from '@/core/util/Sleep.ts'
import { workerWaitUntil } from '@/core/util/WorkerWaitUntil.ts'

const callbacks: CallbackEntry[] = [
  { name: 'playerChatPacket', fn: playerChatPacketReceived },
  { name: 'playerJoinedPacket', fn: playerJoinedPacketReceived },
  { name: 'playerLeftPacket', fn: playerLeftPacketReceived },
  { name: 'playerMovedPacket', fn: playerMovedPacketReceived },
  { name: 'playerTouchBlockPacket', fn: playerTouchBlockPacketReceived },
  { name: 'playerGodModePacket', fn: playerGodModePacketReceived },
  { name: 'playerResetPacket', fn: playerResetPacketReceived },
  { name: 'playerRespawnPacket', fn: playerRespawnPacketReceived },
  { name: 'worldBlockPlacedPacket', fn: updateAwaitedWorldBlockPlacedPackets },
]

export function registerPWaintMeBotCallbacks(): () => void {
  const client = getPwGameClient()
  for (const callback of callbacks) {
    client.addCallback(callback.name, callback.fn)
  }
  return () => {
    for (const callback of callbacks) {
      client.removeCallback(callback.name, callback.fn)
    }
  }
}

if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', () => {
    if (getPwBotType() === BotType.PWAINTME_BOT) {
      hotReloadCallbacks(callbacks)
    }
  })
}

function playerJoinedPacketReceived(data: ProtoGen.PlayerJoinedPacket): void {
  const playerId = data.properties?.playerId
  if (playerId === undefined || playerId === getPwGameWorldHelper().botPlayerId) {
    return
  }
  queuePWaintMePlayer(playerId)
  updatePWaintMePlayerCounters(playerId)
  sendPrivateChatMessage(
    'PWaintMe: move to paint your territory! .afk to sit out, .win for stats, .help for commands.',
    playerId,
  )
}

function playerLeftPacketReceived(data: ProtoGen.PlayerLeftPacket): void {
  removePWaintMePlayer(data.playerId)
  usePWaintMeBotWorldStore().afkPlayers.delete(data.playerId)
}

function playerMovedPacketReceived(data: ProtoGen.PlayerMovedPacket): void {
  if (data.playerId !== undefined && data.position !== undefined) {
    movePWaintMePlayer(data.playerId, data.position)
  }
}

function playerTouchBlockPacketReceived(data: ProtoGen.PlayerTouchBlockPacket): void {
  if (data.playerId !== undefined && data.position !== undefined && data.layer === 1) {
    collectPWaintMeCoins(data.playerId, data.position)
  }
}

function playerGodModePacketReceived(data: ProtoGen.PlayerGodModePacket): void {
  if (data.playerId === undefined) {
    return
  }
  if (data.enabled) {
    removePWaintMePlayer(data.playerId)
  } else {
    queuePWaintMePlayer(data.playerId)
  }
}

function playerResetPacketReceived(data: ProtoGen.PlayerResetPacket): void {
  if (data.playerId !== undefined) {
    respawnPWaintMePlayer(data.playerId)
  }
}

function playerRespawnPacketReceived(data: ProtoGen.PlayerRespawnPacket): void {
  if (data.playerId !== undefined) {
    respawnPWaintMePlayer(data.playerId)
  }
}

function respawnPWaintMePlayer(playerId: number): void {
  updatePWaintMePlayerCounters(playerId)
  const store = usePWaintMeBotWorldStore()
  const participant = usePWaintMeBotRoundStore().players.get(playerId)
  if (participant === undefined) {
    return
  }
  if (store.currentState === PWaintMeBotState.PLAYING || store.currentState === PWaintMeBotState.PREPARING) {
    sendRawMessage(`/team #${playerId} ${participant.team}`)
    teleportPWaintMePlayerToArena(playerId)
    if (store.currentState === PWaintMeBotState.PLAYING) {
      applyPWaintMeRoundModifier(playerId)
    } else {
      sendRawMessage(`/giveeffect #${playerId} speed 0`)
      sendRawMessage(`/giveeffect #${playerId} multijump 0`)
    }
  }
}

const help = new Map<string, string>([
  ['help', '.help [command]: Show PWaintMe commands or help for one command.'],
  ['ping', '.ping: Check whether PWaintMe is responding.'],
  ['play', '.play (.p, //play, //p): Toggle joining upcoming rounds. Players join automatically on arrival.'],
  ['afk', '.afk (//afk): Toggle sitting out. During a match, this takes effect next round.'],
  ['win', '.win (.w, //win, //w): Show wins, rounds played, painted blocks, and wins by color.'],
  ['start', '.start: Load the PWaintMe lobby and start automatic matches. Owner/developer only.'],
  ['quickstart', '.quickstart: Start without replacing the lobby. Arena: (75,75)-(124,124). Owner/developer only.'],
  ['stop', '.stop: Stop matches, clear player effects and teams, and restore the arena. Owner/developer only.'],
  ['map', '.map: List the available 50x50 arenas from the map world and custom saves.'],
  [
    'save',
    '.save <name> <author> <x> <y>: Save a 50x50 arena until restart. No spaces in name/author. Stop first. Owner/developer only.',
  ],
  ['load', '.load <name> [x y]: Load a saved arena; defaults to (75,75). Stop first. Owner/developer only.'],
])

function helpCommandReceived(args: string[], playerId: number): void {
  if (args.length === 0) {
    sendPrivateChatMessage(
      'PWaintMe: .help .ping .play .afk .win .map | Owner: .start .quickstart .stop .save .load',
      playerId,
    )
    sendPrivateChatMessage(
      'Use .help [command] for details. Original //play, //afk and //win commands also work.',
      playerId,
    )
    return
  }
  const name = args[0].toLowerCase().replace(/^(?:\/\/|\.)/, '')
  const text = help.get(name === 'p' ? 'play' : name === 'w' ? 'win' : name)
  if (text === undefined) {
    throw new GameError('Unknown PWaintMe command. Type .help.', playerId)
  }
  sendPrivateChatMessage(text, playerId)
}

function togglePWaintMeParticipation(playerId: number): void {
  const store = usePWaintMeBotWorldStore()
  const player = getPwGameWorldHelper().getPlayer(playerId)
  if (player === undefined || player.isMe) {
    throw new GameError('The bot cannot join PWaintMe matches.', playerId)
  }
  if (player.states.godmode || player.states.modmode) {
    throw new GameError('Leave god/mod mode before joining PWaintMe.', playerId)
  }
  if (store.queuedPlayers.has(playerId)) {
    store.queuedPlayers.delete(playerId)
    store.afkPlayers.add(playerId)
    sendPrivateChatMessage('You will sit out upcoming rounds. Use .play or .afk to rejoin.', playerId)
  } else {
    store.afkPlayers.delete(playerId)
    queuePWaintMePlayer(playerId)
    sendPrivateChatMessage('You are queued for the next PWaintMe round!', playerId)
  }
}

function winCommandReceived(playerId: number): void {
  const username = getPwGameWorldHelper().getPlayer(playerId)!.username
  const stats = getPWaintMePlayerStats(username)
  sendPrivateChatMessage(
    `Wins: ${stats.wins} | Rounds: ${stats.roundsPlayed} | Painted: ${stats.totalBlocksPainted}`,
    playerId,
  )
  sendPrivateChatMessage(
    PWAINTME_TEAMS.map((team) => `${team}: ${stats.colorWins.get(team) ?? 0}`).join(', '),
    playerId,
  )
}

function requirePWaintMeBuilder(playerId: number): void {
  requireWorldOwner(playerId)
  requirePlayerAndBotEditPermission(playerId)
  if (usePWaintMeBotWorldStore().currentState !== PWaintMeBotState.STOPPED) {
    throw new GameError('Stop PWaintMe with .stop before saving or loading maps.', playerId)
  }
}

async function playerChatPacketReceived(data: ProtoGen.PlayerChatPacket): Promise<void> {
  const [rawCommand, ...args] = data.message.trim().split(/\s+/)
  if (!rawCommand.startsWith('.') && !rawCommand.startsWith('//')) {
    return
  }
  const name = rawCommand.toLowerCase().replace(/^(?:\/\/|\.)/, '')
  const command = name === 'p' ? 'play' : name === 'w' ? 'win' : name
  const playerId = data.playerId!
  const store = usePWaintMeBotWorldStore()
  switch (command as PWaintMeBotCommandName) {
    case PWaintMeBotCommandName.HELP:
      helpCommandReceived(args, playerId)
      break
    case PWaintMeBotCommandName.PING:
      sendPrivateChatMessage('pong', playerId)
      break
    case PWaintMeBotCommandName.PLAY:
    case PWaintMeBotCommandName.AFK:
      togglePWaintMeParticipation(playerId)
      break
    case PWaintMeBotCommandName.WIN:
      winCommandReceived(playerId)
      break
    case PWaintMeBotCommandName.START:
    case PWaintMeBotCommandName.QUICK_START:
      await startManagedPWaintMeBot(args, playerId, command === 'start')
      break
    case PWaintMeBotCommandName.STOP:
      requireWorldOwner(playerId)
      requirePlayerAndBotEditPermission(playerId)
      if (store.currentState === PWaintMeBotState.LOADING && !store.everySecondUpdateIsRunning) {
        throw new GameError('Wait until PWaintMe has finished loading.', playerId)
      }
      await stopPWaintMeBot()
      break
    case PWaintMeBotCommandName.MAP:
      for (const [key, map] of store.maps) {
        sendPrivateChatMessage(`${key} by ${map.author}`, playerId)
      }
      break
    case PWaintMeBotCommandName.SAVE: {
      requirePWaintMeBuilder(playerId)
      if (args.length !== 4) {
        throw new GameError(help.get('save')!, playerId)
      }
      const map = capturePWaintMeMap(args[0], args[1], { x: Number(args[2]), y: Number(args[3]) })
      const entry = createPWaintMeMap(map)
      store.savedMaps.set(getPWaintMeMapKey(map.name), map)
      store.maps.set(getPWaintMeMapKey(map.name), entry)
      sendPrivateChatMessage(`Saved "${map.name}" by ${map.author}.`, playerId)
      break
    }
    case PWaintMeBotCommandName.LOAD: {
      requirePWaintMeBuilder(playerId)
      if (args.length !== 1 && args.length !== 3) {
        throw new GameError(help.get('load')!, playerId)
      }
      const map = store.maps.get(getPWaintMeMapKey(args[0]))
      if (map === undefined) {
        throw new GameError('Map not found. Type .map to list arenas.', playerId)
      }
      store.currentState = PWaintMeBotState.LOADING
      try {
        await placePWaintMeMap(
          map,
          args.length === 1
            ? { x: PWAINTME_ARENA.minX, y: PWAINTME_ARENA.minY }
            : { x: Number(args[1]), y: Number(args[2]) },
        )
      } finally {
        store.currentState = PWaintMeBotState.STOPPED
      }
      sendPrivateChatMessage(`Loaded "${map.name}".`, playerId)
      break
    }
    default:
      throw new GameError('Unrecognised PWaintMe command. Type .help.', playerId)
  }
}

export async function startManagedPWaintMeBot(_args: string[], playerId: number, loadWorld: boolean): Promise<void> {
  requireWorldOwner(playerId)
  requirePlayerAndBotEditPermission(playerId)
  const helper = getPwGameWorldHelper()
  const store = usePWaintMeBotWorldStore()
  if (!isWorldOwner(helper.botPlayerId)) {
    throw new GameError('The bot must own the world to run PWaintMe.', playerId)
  }
  if (helper.width < 200 || helper.height < 200) {
    throw new GameError('PWaintMe requires a world of at least 200x200.', playerId)
  }
  if (store.currentState !== PWaintMeBotState.STOPPED || store.everySecondUpdateIsRunning) {
    throw new GameError('PWaintMe is already running or stopping.', playerId)
  }
  store.currentState = PWaintMeBotState.LOADING
  try {
    resetPWaintMeBotRoundStore()
    store.queuedPlayers.clear()
    store.lastActivePlayerCount = -1
    await loadPWaintMeMapWorld()
    initPWaintMePalette()
    if (loadWorld) {
      await placePWaintMeWorld()
    }
    await updatePWaintMeLobbySigns()
    for (const id of helper.players.keys()) {
      queuePWaintMePlayer(id)
      updatePWaintMePlayerCounters(id)
    }
    store.currentState = PWaintMeBotState.AWAITING_PLAYERS
    store.everySecondUpdateIsRunning = true
    sendGlobalChatMessage(`PWaintMe started with ${store.maps.size} arenas! .help for commands.`)
    void everySecondUpdate()
  } catch (error) {
    store.currentState = PWaintMeBotState.STOPPED
    throw error
  }
}

async function everySecondUpdate(): Promise<void> {
  const store = usePWaintMeBotWorldStore()
  if (
    store.currentState === PWaintMeBotState.STOPPED ||
    store.currentState === PWaintMeBotState.STOPPING ||
    shouldPauseForBotRotation(BotType.PWAINTME_BOT)
  ) {
    store.everySecondUpdateIsRunning = false
    return
  }
  try {
    if (!isBotStarting(BotType.PWAINTME_BOT)) {
      await advancePWaintMeRound()
    }
  } catch (error) {
    store.everySecondUpdateIsRunning = false
    handleException(error)
    try {
      await stopPWaintMeBot()
    } catch (cleanupError) {
      handleException(cleanupError)
    }
    return
  }
  if ([PWaintMeBotState.STOPPED, PWaintMeBotState.STOPPING].includes(usePWaintMeBotWorldStore().currentState)) {
    store.everySecondUpdateIsRunning = false
    return
  }
  setCustomTimeout(() => {
    void everySecondUpdate()
  }, 1000)
}

export async function stopPWaintMeBot(): Promise<void> {
  const store = usePWaintMeBotWorldStore()
  if (store.currentState === PWaintMeBotState.STOPPING) {
    throw new GameError('PWaintMe is already stopping.')
  }
  store.currentState = PWaintMeBotState.STOPPING
  try {
    await workerWaitUntil(() => !store.everySecondUpdateIsRunning, { timeout: 15000, intervalBetweenAttempts: 100 })
    for (const playerId of usePWaintMeBotRoundStore().players.keys()) {
      resetPWaintMePlayer(playerId)
    }
    await restorePWaintMeArena()
    resetPWaintMeBotRoundStore()
  } finally {
    store.currentState = PWaintMeBotState.STOPPED
  }
  sendGlobalChatMessage('PWaintMe stopped.')
  shouldPauseForBotRotation(BotType.PWAINTME_BOT)
}

export async function startPWaintMeBotConnection(
  worldId: string,
  email: string,
  password: string,
  mapOnly = false,
): Promise<void> {
  await initPwConnection(worldId, email, password, '', () => {
    usePwClientStore().botType = BotType.PWAINTME_BOT
    const client = getPwGameClient()
    client.addHook(getPwGameWorldHelper().receiveHook)
    client.addCallback('error', handleException)
    client.addCallback('playerInitPacket', () => {
      commonPlayerInitPacketReceived()
      client.send('playerGodModePacket', { enabled: true })
    })
    registerPWaintMeBotCallbacks()
  })
  if (mapOnly) {
    await loadPWaintMeMapWorld()
    initPWaintMePalette()
    sendGlobalChatMessage('PWaintMe builder mode. Use .map, .save, .load, or .help.')
  } else {
    await startManagedPWaintMeBot([], getPwGameWorldHelper().botPlayerId, true)
  }
}
