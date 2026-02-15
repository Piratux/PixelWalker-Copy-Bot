import { getPwApiClient, getPwBotType, getPwGameClient, getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import {
  sendGlobalChatMessage,
  sendPrivateChatMessage,
  sendRawMessage,
  sendToastMessage,
} from '@/core/service/ChatMessageService.ts'
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
import { Block, KeyStates, LayerType } from 'pw-js-world'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import { getAnotherWorldBlocks, placeMultipleBlocks, placeWorldDataBlocks } from '@/core/service/WorldService.ts'
import { BotType } from '@/core/enum/BotType.ts'
import { setCustomTimeout } from '@/core/util/Sleep.ts'
import { handleException } from '@/core/util/Exception.ts'
import { GameError } from '@/core/class/GameError.ts'
import { workerWaitUntil } from '@/core/util/WorkerWaitUntil.ts'
import { mapGetOrInsert } from '@/core/util/MapGetOrInsert.ts'
import { useBArenaBotWorldStore } from '@/bot/barenabot/store/BArenaBotWorldStore.ts'
import { BArenaBotState } from '@/bot/barenabot/enum/BArenaBotState.ts'
import { useBArenaBotRoundStore } from '@/bot/barenabot/store/BArenaBotRoundStore.ts'
import { BArenaBotCommandName } from '@/bot/barenabot/enum/BArenaBotCommandName.ts'
import { userBArenaBotAutomaticRestartCounterStore } from '@/bot/barenabot/store/BArenaBotAutomaticRestartCounterStore.ts'
import { BArenaBotWorldData, createBArenaBotWorldData } from '@/bot/barenabot/type/BArenaBotPlayerWorldData.ts'
import { shuffle } from 'lodash-es'
import { BArenaTeam } from '@/bot/barenabot/enum/BArenaTeam.ts'
import { BArenaPlayerBotRoundData } from '@/bot/barenabot/type/BArenaBotPlayerRoundData.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { isPosInsideArea } from '@/core/util/Geometry.ts'
import { BlockGrid } from '@/core/class/BlockGrid.ts'

// TODO: Use UPPER_CASE for vec2 variables
const mapTopLeftPos = vec2(86, 99)
const mapSize = vec2(25, 25)
const lobbyTopLeftPos = vec2(91, 109)
const lobbySize = vec2(15, 5)
const winPos = vec2(98, 112)

const BLUE_TEAM_PLAYER_START_POSITIONS = [
  vec2(92, 110),
  vec2(94, 110),
  vec2(96, 110),
  vec2(92, 112),
  vec2(94, 112),
  vec2(96, 112),
]

const RED_TEAM_PLAYER_START_POSITIONS = [
  vec2(100, 110),
  vec2(102, 110),
  vec2(104, 110),
  vec2(100, 112),
  vec2(102, 112),
  vec2(104, 112),
]

const BLUE_TEAM_TANK_START_POSITIONS = [
  vec2(96, 100),
  vec2(98, 100),
  vec2(100, 100),
  vec2(96, 102),
  vec2(98, 102),
  vec2(100, 102),
]

const RED_TEAM_TANK_START_POSITIONS = [
  vec2(96, 122),
  vec2(98, 122),
  vec2(100, 122),
  vec2(96, 120),
  vec2(98, 120),
  vec2(100, 120),
]

const MAX_ROUND_LENGTH_MS = 180_000

// NOTE: it's not a good idea to rely on these being constant, but it will do for now
const TEAM_NONE = 0
const TEAM_RED = 1
const TEAM_GREEN = 2

const TICK_RATE = 10 // how many ticks a second
const TICK_LENGTH_MS = 1000 / TICK_RATE

const MAX_PLAYERS_PER_TEAM = 6

const PLAYER_SPEED = 5
const PROJECTILE_SPEED = 10
const PLAYER_MOVE_COOLDOWN_TICKS = TICK_RATE / PLAYER_SPEED
const PROJECTILE_MOVE_COOLDOWN_TICKS = TICK_RATE / PROJECTILE_SPEED

const GUN_RELOAD_SPEED_SECONDS = 2
const GUN_RELOAD_COOLDOWN_TICKS = TICK_RATE * GUN_RELOAD_SPEED_SECONDS

const callbacks: CallbackEntry[] = [
  { name: 'playerInitPacket', fn: playerInitPacketReceived },
  { name: 'playerJoinedPacket', fn: playerJoinedPacketReceived },
  { name: 'playerChatPacket', fn: playerChatPacketReceived },
  { name: 'playerGodModePacket', fn: playerGodModePacketReceived },
  { name: 'playerResetPacket', fn: playerResetPacketReceived },
  { name: 'playerLeftPacket', fn: playerLeftPacketReceived },
  { name: 'playerMovedPacket', fn: playerMovedPacketReceived },
  { name: 'worldBlockPlacedPacket', fn: updateAwaitedWorldBlockPlacedPackets },
]

export function registerBArenaBotCallbacks() {
  const client = getPwGameClient()
  const helper = getPwGameWorldHelper()
  client.addHook(helper.receiveHook)
  // client.addCallback('debug', console.log) // Too laggy to enable it by default
  client.addCallback('error', handleBArenaBotError)
  for (const cb of callbacks) {
    client.addCallback(cb.name, cb.fn)
  }
}

if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', ({}) => {
    if (getPwBotType() === BotType.BARENA_BOT) {
      hotReloadCallbacks(callbacks)
      if (useBArenaBotWorldStore().currentState !== BArenaBotState.STOPPED) {
        void autoRestartBArenaBot()
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
  useBArenaBotRoundStore().playerBArenaBotRoundData.delete(playerId)
}

function handleBArenaBotError(e: unknown) {
  handleException(e)
}

function disqualifyPlayerFromRound(playerId: number) {
  if (getPlayerIdsInGame().includes(playerId)) {
    const playerData = getPlayerData(playerId)
    if (playerData.playerIsAfk) {
      disqualifyPlayerFromRoundBecauseAfk(playerId)
    } else {
      removePlayerFromPlayersInGame(playerId)
      sendRawMessage(`/team #${playerId} ${TEAM_NONE}`)
    }
  }
}

function playerDiedFromProjectile(playerId: number, killingPlayerId: number) {
  const playerName = getPwGameWorldHelper().getPlayer(playerId)?.username ?? 'Unknown'
  const killingPlayerName = getPwGameWorldHelper().getPlayer(killingPlayerId)?.username ?? 'Unknown'
  sendToastMessage(`You shot ${playerName}!`, killingPlayerId, 'arrow-trend-up')
  sendToastMessage(`You were shot by ${killingPlayerName}!`, playerId, 'skull')
  sendRawMessage(`/kill #${playerId}`)
  disqualifyPlayerFromRound(playerId)
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
  const playerId = data.playerId
  disqualifyPlayerFromRound(playerId)

  useBArenaBotWorldStore().playerIdQueue = useBArenaBotWorldStore().playerIdQueue.filter((pId) => pId !== playerId)
}

function checkIfPlayerMoved(playerId: number, keyStates: KeyStates) {
  if (!getPlayerIdsInGame().includes(playerId)) {
    return
  }

  const playerData = getPlayerData(playerId)
  const newMoveDirection = vec2(0, 0)
  if (keyStates.left.held) {
    newMoveDirection.x -= 1
  }
  if (keyStates.right.held) {
    newMoveDirection.x += 1
  }
  if (keyStates.up.held) {
    newMoveDirection.y -= 1
  }
  if (keyStates.down.held) {
    newMoveDirection.y += 1
  }

  playerData.moveDirection = newMoveDirection
  if (!vec2.eq(playerData.moveDirection, vec2(0, 0))) {
    playerData.lastMoveDirection = playerData.moveDirection
  }
}

function playerTryUseGun(playerData: BArenaPlayerBotRoundData, playerId: number) {
  if (!playerData.holdingShootKey) {
    return
  }

  if (useBArenaBotWorldStore().ticksPassed - playerData.lastTickWhenUsedGun < GUN_RELOAD_COOLDOWN_TICKS) {
    return
  }

  playerData.lastTickWhenUsedGun = useBArenaBotWorldStore().ticksPassed
  useBArenaBotRoundStore().projectileBArenaBotRoundData.push({
    pos: vec2.add(playerData.pos, playerData.lastMoveDirection),
    moveDirection: playerData.lastMoveDirection,
    team: playerData.team,
    lastTickWhenMoved: useBArenaBotWorldStore().ticksPassed,
    playerId: playerId,
  })
}

function checkIfPlayerUseGun(playerId: number, keyStates: KeyStates) {
  if (!getPlayerIdsInGame().includes(playerId)) {
    return
  }

  const playerData = getPlayerData(playerId)
  playerData.holdingShootKey = keyStates.jump.held
}

function playerMovedPacketReceived(data: ProtoGen.PlayerMovedPacket, states?: { keyStates: KeyStates }) {
  const playerId = data.playerId!
  const keyStates = states!.keyStates
  const playerData = useBArenaBotRoundStore().playerBArenaBotRoundData.get(playerId)

  if (useBArenaBotWorldStore().currentState === BArenaBotState.PLAYING) {
    checkIfPlayerMoved(playerId, keyStates)
    if (playerData !== undefined) {
      playerTryMove(playerData)
    }

    checkIfPlayerUseGun(playerId, keyStates)
    if (playerData !== undefined) {
      playerTryUseGun(playerData, playerId)
    }

    if (playerData !== undefined) {
      playerData.playerIsAfk = false
    }
  }
}

function playerJoinedPacketReceived(data: ProtoGen.PlayerJoinedPacket) {
  const playerId = data.properties?.playerId
  if (playerId === undefined) {
    return
  }

  useBArenaBotWorldStore().playerIdQueue.push(playerId)

  if (isWorldOwner(playerId)) {
    sendPrivateChatMessage('BArena bot is here! Type .start to start the round. Type .help to see commands', playerId)
  } else {
    sendPrivateChatMessage('BArena bot is here! Type .help to see commands', playerId)
  }

  mergePlayerStats(playerId)
}

function mergePlayerStats(playerId: number) {
  // If player leaves and rejoins, keep their stats
  const playerName = getPwGameWorldHelper().getPlayer(playerId)!.username
  for (const [existingPlayerId, data] of useBArenaBotWorldStore().playerBArenaBotWorldData) {
    if (data.username === playerName && existingPlayerId !== playerId) {
      useBArenaBotWorldStore().playerBArenaBotWorldData.set(playerId, { ...data })
      useBArenaBotWorldStore().playerBArenaBotWorldData.delete(existingPlayerId)
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

  switch (commandName as BArenaBotCommandName) {
    case BArenaBotCommandName.HELP:
      helpCommandReceived(commandArgs, playerId)
      break
    case BArenaBotCommandName.PING:
      sendPrivateChatMessage('pong', playerId)
      break
    case BArenaBotCommandName.START:
      await startCommandReceived(commandArgs, playerId, true)
      break
    case BArenaBotCommandName.QUICK_START:
      await startCommandReceived(commandArgs, playerId, false)
      break
    case BArenaBotCommandName.STOP:
      await stopCommandReceived(commandArgs, playerId)
      break
    case BArenaBotCommandName.AFK:
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
    // sendPrivateChatMessage('You can also host BArenaBot yourself at: piratux.github.io/PixelWalker-Copy-Bot/', playerId)
    return
  }

  let commandName = args[0]

  if (commandName.startsWith('.')) {
    commandName = commandName.slice(1)
  }

  switch (commandName as BArenaBotCommandName) {
    case BArenaBotCommandName.PING:
      sendPrivateChatMessage('.ping - check if bot is alive by pinging it.', playerId)
      sendPrivateChatMessage(`Example usage: .ping`, playerId)
      break
    case BArenaBotCommandName.HELP:
      sendPrivateChatMessage(
        '.help [command] - get general help, or if command is specified, get help about command.',
        playerId,
      )
      sendPrivateChatMessage(`Example usage: .help afk`, playerId)
      break
    case BArenaBotCommandName.START:
      sendPrivateChatMessage('.start - starts BArenaBot game.', playerId)
      break
    case BArenaBotCommandName.QUICK_START:
      sendPrivateChatMessage('.start - starts BArenaBot game faster by not placing BArenaBot world', playerId)
      sendPrivateChatMessage('This can be used to customise BArenaBot world', playerId)
      break
    case BArenaBotCommandName.STOP:
      sendPrivateChatMessage('.stop - stops BArenaBot game.', playerId)
      break
    case BArenaBotCommandName.AFK:
      sendPrivateChatMessage(".afk - tells bot that you're afk or not.", playerId)
      break
    default:
      throw new GameError(`Unrecognised command ${commandName}. Type .help to see all commands`, playerId)
  }
}

async function placeBArenaBotWorld() {
  sendGlobalChatMessage('Loading BArenaBot world...')
  const bArenaBotMapWorldId = 'r5a443b1170851c'
  const blocks = await getAnotherWorldBlocks(bArenaBotMapWorldId, getPwApiClient())
  await placeWorldDataBlocks(blocks)
}

async function loadBArenaBotData() {
  sendGlobalChatMessage('Loading BArenaBot data...')
  const bArenaBotDataWorldId = 'r7ee03b256dd2ba'
  const bArenaBotBlocks = await getAnotherWorldBlocks(bArenaBotDataWorldId, getPwApiClient())

  useBArenaBotWorldStore().teamBluePlayerFgBlocks = [
    bArenaBotBlocks.blocks[LayerType.Foreground][16][80],
    bArenaBotBlocks.blocks[LayerType.Foreground][18][80],
    bArenaBotBlocks.blocks[LayerType.Foreground][20][80],
    bArenaBotBlocks.blocks[LayerType.Foreground][16][82],
    bArenaBotBlocks.blocks[LayerType.Foreground][18][82],
    bArenaBotBlocks.blocks[LayerType.Foreground][20][82],
  ]

  useBArenaBotWorldStore().teamRedPlayerFgBlocks = [
    bArenaBotBlocks.blocks[LayerType.Foreground][24][80],
    bArenaBotBlocks.blocks[LayerType.Foreground][26][80],
    bArenaBotBlocks.blocks[LayerType.Foreground][28][80],
    bArenaBotBlocks.blocks[LayerType.Foreground][24][82],
    bArenaBotBlocks.blocks[LayerType.Foreground][26][82],
    bArenaBotBlocks.blocks[LayerType.Foreground][28][82],
  ]

  useBArenaBotWorldStore().teamBlueProjectileFgBlock = bArenaBotBlocks.blocks[LayerType.Foreground][19][86]
  useBArenaBotWorldStore().teamRedProjectileFgBlock = bArenaBotBlocks.blocks[LayerType.Foreground][25][86]

  useBArenaBotWorldStore().mapEmptyFgBlock = bArenaBotBlocks.blocks[LayerType.Foreground][11][80]
}

async function stopCommandReceived(_args: string[], playerId: number) {
  requireWorldOwner(playerId)
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  if (useBArenaBotWorldStore().currentState === BArenaBotState.STOPPED) {
    throw new GameError('BArenaBot is already stopped', playerId)
  }

  await stopBArenaBot()
}

async function stopBArenaBot() {
  sendGlobalChatMessage('Stopping BArenaBot...')
  useBArenaBotWorldStore().currentState = BArenaBotState.STOPPED
  await workerWaitUntil(() => !useBArenaBotWorldStore().everyTickUpdateIsRunning, {
    timeout: 15000,
    intervalBetweenAttempts: 1000,
  })
  sendGlobalChatMessage('BArenaBot stopped!')
}

async function startCommandReceived(_args: string[], playerId: number, loadWorld: boolean) {
  requireWorldOwner(playerId)
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  if (useBArenaBotWorldStore().currentState !== BArenaBotState.STOPPED) {
    throw new GameError('BArenaBot is already running', playerId)
  }

  // Because /tp commands don't work for non world owners, even if they have edit rights
  const botPlayerId = getPwGameWorldHelper().botPlayerId
  if (!isWorldOwner(botPlayerId)) {
    throw new GameError('Bot must be world owner for BArenaBot to work', playerId)
  }

  await startBArenaBot(loadWorld)
}

async function startBArenaBot(loadWorld: boolean) {
  if (getPwGameWorldHelper().width < 200 || getPwGameWorldHelper().height < 200) {
    throw new GameError('World must be of at least 200x200 size.')
  }

  sendGlobalChatMessage('Starting BArenaBot...')

  useBArenaBotWorldStore().$reset()

  useBArenaBotWorldStore().playerIdQueue = getPwGameWorldHelper()
    .getPlayers()
    .map((player) => player.playerId)

  if (loadWorld) {
    await placeBArenaBotWorld()
  }
  await loadBArenaBotData()

  useBArenaBotWorldStore().currentState = BArenaBotState.RESET_STORE

  sendGlobalChatMessage('BArenaBot started!')

  useBArenaBotWorldStore().everyTickUpdateIsRunning = true
  void everyTickUpdate()
}

function mapRemoveLobbyAreaBlocks(mapBlocks: WorldBlock[]) {
  return mapBlocks.filter((worldBlock) => !isPosInsideArea(worldBlock.pos, lobbyTopLeftPos, lobbySize))
}

function mapAddPlayerTankBlocks(mapGrid: BlockGrid) {
  for (const playerData of useBArenaBotRoundStore().playerBArenaBotRoundData.values()) {
    const block =
      playerData.team === BArenaTeam.BLUE
        ? useBArenaBotWorldStore().teamBluePlayerFgBlocks[playerData.blockTypeId]
        : useBArenaBotWorldStore().teamRedPlayerFgBlocks[playerData.blockTypeId]
    mapGrid.setBlock(playerData.pos, block)
  }
}

function mapAddProjectileBlocks(mapGrid: BlockGrid) {
  for (const projectileData of useBArenaBotRoundStore().projectileBArenaBotRoundData) {
    const block =
      projectileData.team === BArenaTeam.BLUE
        ? useBArenaBotWorldStore().teamBlueProjectileFgBlock
        : useBArenaBotWorldStore().teamRedProjectileFgBlock
    mapGrid.setBlock(projectileData.pos, block)
  }
}

function renderMap() {
  const mapGrid = new BlockGrid(mapSize, LayerType.Foreground, mapTopLeftPos)
  mapGrid.setAllBlock(useBArenaBotWorldStore().mapEmptyFgBlock)
  mapAddProjectileBlocks(mapGrid)
  mapAddPlayerTankBlocks(mapGrid)

  let mapBlocks = mapGrid.toWorldBlocks()
  mapBlocks = mapRemoveLobbyAreaBlocks(mapBlocks)
  void placeMultipleBlocks(mapBlocks)
}

function isPosInsideMap(pos: vec2) {
  return isPosInsideArea(pos, mapTopLeftPos, mapSize) && !isPosInsideArea(pos, lobbyTopLeftPos, lobbySize)
}

function canMovePlayerToPos(pos: vec2) {
  return (
    isPosInsideMap(pos) &&
    !Array.from(useBArenaBotRoundStore().playerBArenaBotRoundData.values()).some((playerData) =>
      vec2.eq(playerData.pos, pos),
    )
  )
}

function tryToMovePlayerToNewPosition(playerData: BArenaPlayerBotRoundData, moveDirection: vec2) {
  const newPos = vec2.add(playerData.pos, moveDirection)
  if (canMovePlayerToPos(newPos)) {
    // We want to incur cooldown, only if player moved somewhere
    playerData.lastTickWhenMoved = useBArenaBotWorldStore().ticksPassed

    playerData.pos = newPos
    return true
  }
  return false
}

function playerTryMove(playerData: BArenaPlayerBotRoundData) {
  if (useBArenaBotWorldStore().ticksPassed - playerData.lastTickWhenMoved < PLAYER_MOVE_COOLDOWN_TICKS) {
    return
  }

  // We want to incur cooldown, only if player is moving
  if (vec2.eq(playerData.moveDirection, vec2(0, 0))) {
    return
  }

  if (tryToMovePlayerToNewPosition(playerData, playerData.moveDirection)) {
    return
  }

  // Logic below allows player to slide along the wall when moving diagonally.
  if (tryToMovePlayerToNewPosition(playerData, vec2(playerData.moveDirection.x, 0))) {
    return
  }
  if (tryToMovePlayerToNewPosition(playerData, vec2(0, playerData.moveDirection.y))) {
    // continue
  }
}

function updatePlayerPosition() {
  for (const playerData of useBArenaBotRoundStore().playerBArenaBotRoundData.values()) {
    playerTryMove(playerData)
  }
}

function updateProjectilePosition() {
  // Make a copy, so that it's safe to delete elements while iterating
  const projectileDataCopy = [...useBArenaBotRoundStore().projectileBArenaBotRoundData]
  for (const projectileData of projectileDataCopy) {
    if (useBArenaBotWorldStore().ticksPassed - projectileData.lastTickWhenMoved < PROJECTILE_MOVE_COOLDOWN_TICKS) {
      continue
    }

    projectileData.lastTickWhenMoved = useBArenaBotWorldStore().ticksPassed
    projectileData.pos = vec2.add(projectileData.pos, projectileData.moveDirection)

    // Makes sure that 2 projectiles moving towards each other still collide
    updateProjectileCollision()
  }
}

function updateProjectileCollision() {
  useBArenaBotRoundStore().projectileBArenaBotRoundData = useBArenaBotRoundStore().projectileBArenaBotRoundData.filter(
    (projectileData) => {
      if (!isPosInsideMap(projectileData.pos)) {
        return false
      }

      // Check if another projectile was hit (but not itself)
      const anotherProjectilesHit = useBArenaBotRoundStore().projectileBArenaBotRoundData.filter((projectileData2) =>
        vec2.eq(projectileData2.pos, projectileData.pos),
      )
      if (anotherProjectilesHit.length > 1) {
        return false
      }

      const playerId: number | undefined = Array.from(useBArenaBotRoundStore().playerBArenaBotRoundData.keys()).find(
        (playerId) => vec2.eq(getPlayerData(playerId).pos, projectileData.pos),
      )
      if (playerId !== undefined) {
        const playerData = getPlayerData(playerId)
        if (playerData.team !== projectileData.team) {
          playerDiedFromProjectile(playerId, projectileData.playerId)
        }

        // Ignore projectile collisions with the player that shot them
        if (projectileData.playerId !== playerId) {
          return false
        }
      }

      return true
    },
  )
}

function updatePlayerShootGun() {
  for (const [playerId, playerData] of useBArenaBotRoundStore().playerBArenaBotRoundData.entries()) {
    playerTryUseGun(playerData, playerId)
  }
}

function everyTickBArenaBotUpdate(): void {
  if (useBArenaBotWorldStore().ticksPassed % TICK_RATE === 0) {
    everySecondBArenaBotUpdate()
  }

  if (useBArenaBotWorldStore().currentState === BArenaBotState.PLAYING) {
    updateProjectileCollision()

    updateProjectilePosition()

    updatePlayerPosition()

    updateProjectileCollision()

    updatePlayerShootGun()

    updateProjectileCollision()

    renderMap()
  }

  if (useBArenaBotWorldStore().currentState === BArenaBotState.COUNTING_DOWN_FOR_ROUND_START) {
    renderMap()
  }

  // This must be called last in everyTickBArenaBotUpdate to avoid double move updates of players and projectiles
  useBArenaBotWorldStore().ticksPassed++
}

async function everyTickUpdate(): Promise<void> {
  if (useBArenaBotWorldStore().currentState === BArenaBotState.STOPPED) {
    useBArenaBotWorldStore().everyTickUpdateIsRunning = false
    return
  }

  try {
    everyTickBArenaBotUpdate()
  } catch (e) {
    handleException(e)
    await autoRestartBArenaBot()
    return
  }

  // NOTE: This might be called less often than just every second, but it makes sure that `everySecondBArenaBotUpdate` are never executed concurrently.
  setCustomTimeout(() => {
    void everyTickUpdate()
  }, TICK_LENGTH_MS)
}

function getActivePlayers() {
  return Array.from(getPwGameWorldHelper().players.values()).filter((player) => player.states.teamId !== TEAM_RED)
}

function getActivePlayerCount() {
  return getActivePlayers().length
}

function getPlayerIdsInGame(): number[] {
  return Array.from(useBArenaBotRoundStore().playerBArenaBotRoundData.keys())
}

function updatePlayerCounterStats(playerId: number) {
  const playerBotData = getPlayerBArenaBotWorldData(playerId)
  sendRawMessage(`/counter #${playerId} blue =${playerBotData.plays}`)
  sendRawMessage(`/counter #${playerId} white =${playerBotData.wins}`)
}

function teamWinRound(teamName: 'RED' | 'BLUE') {
  sendGlobalChatMessage(`Team ${teamName} wins!`)

  setBArenaBotState(BArenaBotState.CELEBRATING_VICTORY)
}

function giveRewardToWinningTeam() {
  for (const playerId of useBArenaBotRoundStore().playerBArenaBotRoundData.keys()) {
    sendRawMessage(`/givecrown #${playerId}`) // random player will be given crown
    sendRawMessage(`/team #${playerId} ${TEAM_NONE}`)
    sendRawMessage(`/tp #${playerId} ${winPos.x} ${winPos.y}`)
    getPlayerBArenaBotWorldData(playerId).wins++
    updatePlayerCounterStats(playerId)
  }

  updateLeaderboard()
}

function updateLeaderboard() {
  const playerDataList = Array.from(useBArenaBotWorldStore().playerBArenaBotWorldData.entries()).map(
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
      const botData = getPlayerBArenaBotWorldData(player.playerId)
      return `${index + 1}. ${botData.username}: ${getPlayerBArenaBotWorldData(player.playerId).wins}`
    })
    .join('\n')
  const leaderboardFinalText = leaderboardTopText + '\n' + leaderboardPlayerText

  const leaderboardSignPos = vec2(88, 93)
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

function resetBotState() {
  sendRawMessage(`/kill @a[team=green]`)
  sendRawMessage(`/team @a[team=green] ${TEAM_NONE}`)
  setBArenaBotState(BArenaBotState.RESET_STORE)
}

function takePlayersForRound(totalPlayersForRound: number) {
  const playerIdsAvailableForRoundStart = useBArenaBotWorldStore()
    .playerIdQueue.filter((playerId) => getPwGameWorldHelper().players.get(playerId)?.states.teamId !== TEAM_RED)
    .slice(0, totalPlayersForRound)

  for (const playerId of playerIdsAvailableForRoundStart) {
    useBArenaBotWorldStore().playerIdQueue = useBArenaBotWorldStore().playerIdQueue.filter((pId) => pId !== playerId)
    useBArenaBotWorldStore().playerIdQueue.push(playerId)
  }

  return playerIdsAvailableForRoundStart
}

function calculatePlayerIdsFor2Teams(): [number[], number[]] {
  const activePlayerCount = getActivePlayerCount()
  if (activePlayerCount === 0) {
    return [[], []]
  }

  const totalPlayersForRound = Math.min(MAX_PLAYERS_PER_TEAM * 2, activePlayerCount) - (activePlayerCount % 2)
  const playerIds = shuffle(takePlayersForRound(totalPlayersForRound))

  const halfTeamSize = playerIds.length / 2
  const redTeamPlayerIds = playerIds.slice(0, halfTeamSize)
  const blueTeamPlayerIds = playerIds.slice(halfTeamSize, playerIds.length)
  return [redTeamPlayerIds, blueTeamPlayerIds]
}

function teleportPlayersToGameStartPositions() {
  for (const [playerId, playerData] of useBArenaBotRoundStore().playerBArenaBotRoundData.entries()) {
    const startPos =
      playerData.team === BArenaTeam.RED
        ? RED_TEAM_PLAYER_START_POSITIONS[playerData.blockTypeId]
        : BLUE_TEAM_PLAYER_START_POSITIONS[playerData.blockTypeId]
    sendRawMessage(`/tp #${playerId} ${startPos.x} ${startPos.y}`)
    sendRawMessage(`/team #${playerId} ${TEAM_GREEN}`)
  }
}

function createTeamPlayerRoundData(teamPlayerIds: number[], team: BArenaTeam, teamTankStartPositions: vec2[]) {
  for (let i = 0; i < teamPlayerIds.length; i++) {
    const playerId = teamPlayerIds[i]
    const playerData: BArenaPlayerBotRoundData = {
      blockTypeId: i,
      team: team,
      pos: teamTankStartPositions[i],
      moveDirection: vec2(0, 0),
      lastTickWhenMoved: 0,
      lastTickWhenUsedGun: 0,
      lastMoveDirection: vec2(0, team === BArenaTeam.RED ? -1 : 1), // Player shoots towards lobby by default
      holdingShootKey: false,
      playerIsAfk: true,
    }
    useBArenaBotRoundStore().playerBArenaBotRoundData.set(playerId, playerData)
    useBArenaBotRoundStore().startingPlayerBArenaBotRoundData.set(playerId, playerData)

    getPlayerBArenaBotWorldData(playerId).plays++
  }
}

function createPlayerRoundData(redTeamPlayerIds: number[], blueTeamPlayerIds: number[]) {
  createTeamPlayerRoundData(redTeamPlayerIds, BArenaTeam.RED, RED_TEAM_TANK_START_POSITIONS)
  createTeamPlayerRoundData(blueTeamPlayerIds, BArenaTeam.BLUE, BLUE_TEAM_TANK_START_POSITIONS)
}

function drawOccured() {
  sendGlobalChatMessage('No players left, a draw!')
  setBArenaBotState(BArenaBotState.CELEBRATING_VICTORY)
}

function everySecondBArenaBotUpdate() {
  // sendGlobalChatMessage(`[DEBUG] Current state: ${BArenaBotState[useBArenaBotWorldStore().currentState]}`)
  switch (useBArenaBotWorldStore().currentState) {
    case BArenaBotState.STOPPED:
      return
    case BArenaBotState.RESET_STORE:
      useBArenaBotRoundStore().$reset()

      // Clear map
      renderMap()

      setBArenaBotState(BArenaBotState.AWAITING_PLAYERS)
      return
    case BArenaBotState.AWAITING_PLAYERS: {
      const MINIMUM_PLAYER_COUNT_REQUIRED_TO_START_GAME = 2
      const activePlayerCount = getActivePlayerCount()
      if (activePlayerCount >= MINIMUM_PLAYER_COUNT_REQUIRED_TO_START_GAME) {
        sendGlobalChatMessage(`A total of ${activePlayerCount} active players were found. Starting round...`)
        setBArenaBotState(BArenaBotState.PREPARING_FOR_NEXT_ROUND)
        useBArenaBotRoundStore().waitingForMorePlayersMessagePrintedOnce = false
        return
      }

      if (
        useBArenaBotWorldStore().lastActivePlayerCount < MINIMUM_PLAYER_COUNT_REQUIRED_TO_START_GAME - 1 &&
        useBArenaBotWorldStore().lastActivePlayerCount < activePlayerCount
      ) {
        sendGlobalChatMessage(
          `${activePlayerCount} active player(s) found. Minimum of ${MINIMUM_PLAYER_COUNT_REQUIRED_TO_START_GAME} active players are required to start the game`,
        )
      }

      useBArenaBotWorldStore().lastActivePlayerCount = activePlayerCount

      if (!useBArenaBotRoundStore().waitingForMorePlayersMessagePrintedOnce) {
        useBArenaBotRoundStore().waitingForMorePlayersMessagePrintedOnce = true
        sendGlobalChatMessage(
          `Waiting for more players. Minimum of ${MINIMUM_PLAYER_COUNT_REQUIRED_TO_START_GAME} active players are required to start the game`,
        )
      }
      break
    }
    case BArenaBotState.PREPARING_FOR_NEXT_ROUND: {
      const [redTeamPlayerIds, blueTeamPlayerIds] = calculatePlayerIdsFor2Teams()
      createPlayerRoundData(redTeamPlayerIds, blueTeamPlayerIds)
      teleportPlayersToGameStartPositions()

      setBArenaBotState(BArenaBotState.COUNTING_DOWN_FOR_ROUND_START)

      break
    }
    case BArenaBotState.COUNTING_DOWN_FOR_ROUND_START: {
      useBArenaBotRoundStore().secondsPassedInCountingDownForRoundStartState++
      if (useBArenaBotRoundStore().secondsPassedInCountingDownForRoundStartState > 5) {
        useBArenaBotRoundStore().timestampInMsWhenRoundStart = performance.now()
        sendToastMessage('Round started!', '@a[team=green]')
        setBArenaBotState(BArenaBotState.PLAYING)
      }

      break
    }
    case BArenaBotState.PLAYING: {
      const playerIdsInGame = getPlayerIdsInGame()

      if (playerIdsInGame.length === 0) {
        if (useBArenaBotRoundStore().startingPlayerBArenaBotRoundData.size > 0) {
          drawOccured()
        } else {
          abandonRoundDueToNoPlayersLeft()
        }
        return
      }

      const redTeamPlayerIdsInGame = playerIdsInGame.filter(
        (playerId) => getPlayerData(playerId).team === BArenaTeam.RED,
      )
      const blueTeamPlayerIdsInGame = playerIdsInGame.filter(
        (playerId) => getPlayerData(playerId).team === BArenaTeam.BLUE,
      )

      // We track projectiles to know if there might be a draw
      const redTeamProjectiles = useBArenaBotRoundStore().projectileBArenaBotRoundData.filter(
        (projectile) => projectile.team === BArenaTeam.RED,
      )
      const blueTeamProjectiles = useBArenaBotRoundStore().projectileBArenaBotRoundData.filter(
        (projectile) => projectile.team === BArenaTeam.BLUE,
      )

      if (redTeamPlayerIdsInGame.length === 0 && redTeamProjectiles.length === 0) {
        teamWinRound('BLUE')
        return
      }

      if (blueTeamPlayerIdsInGame.length === 0 && blueTeamProjectiles.length === 0) {
        teamWinRound('RED')
        return
      }

      if (performance.now() - useBArenaBotRoundStore().timestampInMsWhenRoundStart > MAX_ROUND_LENGTH_MS) {
        sendGlobalChatMessage(
          `Maximum round length of ${MAX_ROUND_LENGTH_MS / 1000} seconds reached, restarting round...`,
        )
        resetBotState()
      }

      // Fix players not getting teleported to playing position when they're off off-tab by
      // teleporting them to place every 5 seconds.
      if (useBArenaBotWorldStore().ticksPassed % (TICK_RATE * 5) === 0) {
        teleportPlayersToGameStartPositions()
      }

      break
    }
    case BArenaBotState.CELEBRATING_VICTORY: {
      useBArenaBotRoundStore().secondsPassedInCelebratingVictoryState++
      if (useBArenaBotRoundStore().secondsPassedInCelebratingVictoryState > 5) {
        resetBotState()
      }

      // Keep winning players in spot for a bit before moving them out
      if (useBArenaBotRoundStore().secondsPassedInCelebratingVictoryState === 2) {
        giveRewardToWinningTeam()
      }

      break
    }
    default:
      throw new Error('Unknown BArenaBotState: ' + useBArenaBotWorldStore().currentState)
  }
}

function disqualifyPlayerFromRoundBecauseAfk(playerId: number) {
  const afkPos = vec2(101, 97)
  sendRawMessage(`/tp #${playerId} ${afkPos.x} ${afkPos.y}`)
  makePlayerAfk(playerId)
}

function makePlayerAfk(playerId: number) {
  sendRawMessage(`/team #${playerId} ${TEAM_RED}`)
  removePlayerFromPlayersInGame(playerId)
  sendPrivateChatMessage('You are now marked as AFK. You can type .afk to unmark yourself.', playerId)
}

async function autoRestartBArenaBot() {
  if (useBArenaBotWorldStore().currentState === BArenaBotState.STOPPED) {
    return
  }

  sendGlobalChatMessage('Restarting BArenaBot...')
  await stopBArenaBot()

  const MAX_AUTOMATIC_RESTARTS = 300
  if (userBArenaBotAutomaticRestartCounterStore().totalAutomaticRestarts >= MAX_AUTOMATIC_RESTARTS) {
    sendGlobalChatMessage(`BArenaBot has automatically restarted ${MAX_AUTOMATIC_RESTARTS} times, not restarting again`)
    return
  }
  userBArenaBotAutomaticRestartCounterStore().totalAutomaticRestarts++

  await startBArenaBot(false)
}

function getPlayerBArenaBotWorldData(playerId: number): BArenaBotWorldData {
  return mapGetOrInsert(useBArenaBotWorldStore().playerBArenaBotWorldData, playerId, createBArenaBotWorldData(playerId))
}

function setBArenaBotState(newState: BArenaBotState) {
  // Prevent state from being changed if we're trying to stop the bot
  if (useBArenaBotWorldStore().currentState === BArenaBotState.STOPPED) {
    return
  }
  useBArenaBotWorldStore().currentState = newState
}

function getPlayerData(playerId: number) {
  return useBArenaBotRoundStore().playerBArenaBotRoundData.get(playerId)!
}
