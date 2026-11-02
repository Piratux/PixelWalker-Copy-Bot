import { getRandomArrayElement } from '@/core/util/Random.ts'
import { shuffle } from 'lodash-es'
import {
  PWAINTME_ARENA,
  PWAINTME_ROUND_SECONDS,
  PWAINTME_SPAWN,
  PWAINTME_TEAMS,
} from '@/bot/pwaintmebot/constant/General.ts'
import { PWaintMeBotState } from '@/bot/pwaintmebot/enum/PWaintMeBotState.ts'
import { resetPWaintMeBotRoundStore, usePWaintMeBotRoundStore } from '@/bot/pwaintmebot/store/PWaintMeBotRoundStore.ts'
import { usePWaintMeBotWorldStore } from '@/bot/pwaintmebot/store/PWaintMeBotWorldStore.ts'
import {
  PWaintMeMode,
  PWaintMeModifier,
  PWaintMePlayerStats,
  PWaintMeTeam,
} from '@/bot/pwaintmebot/type/PWaintMeBotData.ts'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { sendGlobalChatMessage, sendRawMessage, sendToastMessage } from '@/core/service/ChatMessageService.ts'
import { placeMultipleBlocks } from '@/core/service/WorldService.ts'
import { placePWaintMeMap } from '@/bot/pwaintmebot/service/PWaintMeMapService.ts'
import {
  advancePWaintMeBoss,
  advancePWaintMeEffects,
  getPWaintMeTerritory,
  spawnPWaintMeCoins,
  updatePWaintMeTerritoryCounters,
} from '@/bot/pwaintmebot/service/PWaintMePaintingService.ts'
import { GameError } from '@/core/class/GameError.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { Block, LayerType } from 'pw-js-world'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'

export function getPWaintMePlayerStats(username: string): PWaintMePlayerStats {
  const stats = usePWaintMeBotWorldStore().playerStats
  const key = username.toLowerCase()
  let entry = stats.get(key)
  if (entry === undefined) {
    entry = {
      wins: 0,
      dailyWins: 0,
      dailyWinsDate: '',
      roundsPlayed: 0,
      totalBlocksPainted: 0,
      lastPlayed: '',
      colorWins: new Map(),
    }
    stats.set(key, entry)
  }
  return entry
}

export function updatePWaintMePlayerCounters(playerId: number): void {
  const player = getPwGameWorldHelper().getPlayer(playerId)
  if (player === undefined || player.isMe) {
    return
  }
  const stats = getPWaintMePlayerStats(player.username)
  sendRawMessage(`/counter #${playerId} white =${stats.wins}`)
  // Team-colored counters are reserved for territory percentages.
  sendRawMessage(`/counter #${playerId} gray =${stats.roundsPlayed}`)
}

export function queuePWaintMePlayer(playerId: number): void {
  const store = usePWaintMeBotWorldStore()
  const player = getPwGameWorldHelper().getPlayer(playerId)
  if (
    player !== undefined &&
    !player.isMe &&
    !player.states.godmode &&
    !player.states.modmode &&
    !store.afkPlayers.has(playerId)
  ) {
    store.queuedPlayers.add(playerId)
  }
}

export function removePWaintMePlayer(playerId: number): void {
  const store = usePWaintMeBotWorldStore()
  store.queuedPlayers.delete(playerId)
  const round = usePWaintMeBotRoundStore()
  if (round.players.delete(playerId)) {
    round.pendingEffects = round.pendingEffects.filter((entry) => entry.playerId !== playerId)
    if (getPwGameWorldHelper().getPlayer(playerId) !== undefined) {
      resetPWaintMePlayer(playerId)
    }
  }
}

export function resetPWaintMePlayer(playerId: number): void {
  sendRawMessage(`/reseteffects #${playerId}`)
  sendRawMessage(`/team #${playerId} none`)
}

function freezePWaintMePlayers(): void {
  for (const playerId of usePWaintMeBotRoundStore().players.keys()) {
    sendRawMessage(`/reseteffects #${playerId}`)
    sendRawMessage(`/giveeffect #${playerId} speed 0`)
    sendRawMessage(`/giveeffect #${playerId} multijump 0`)
  }
}

export function teleportPWaintMePlayerToArena(playerId: number): void {
  const round = usePWaintMeBotRoundStore()
  if (round.map === undefined || !round.players.has(playerId)) {
    return
  }
  const index = Array.from(round.players.keys()).indexOf(playerId)
  const spawn = round.map.spawnPoints[index % round.map.spawnPoints.length]
  sendRawMessage(`/tp #${playerId} ${spawn.x} ${spawn.y}`)
}

function setPWaintMeCountdown(seconds: number): void {
  usePWaintMeBotWorldStore().currentState = PWaintMeBotState.COUNTING_DOWN
  usePWaintMeBotRoundStore().secondsLeft = seconds
  sendToastMessage(`PWaintMe starting in ${seconds}s!`, '@a', 'clock', seconds)
}

async function preparePWaintMeRound(): Promise<void> {
  const store = usePWaintMeBotWorldStore()
  store.currentState = PWaintMeBotState.LOADING
  resetPWaintMeBotRoundStore()
  const round = usePWaintMeBotRoundStore()
  const players = shuffle(Array.from(store.queuedPlayers))
  const colors = shuffle(PWAINTME_TEAMS)
  if (players.length >= 4 && players.length % 2 === 0 && Math.random() < 0.33) {
    round.mode = 'team_battle'
  } else if (players.length >= 3) {
    round.mode = getRandomArrayElement<PWaintMeMode>(['normal', 'egg_hunt', 'painter_party', 'boom_blitz_boss'])
  }
  const solo = players.reduce((best, id) => {
    const wins = getPWaintMePlayerStats(getPwGameWorldHelper().getPlayer(id)!.username).wins
    const bestWins = getPWaintMePlayerStats(getPwGameWorldHelper().getPlayer(best)!.username).wins
    return wins > bestWins ? id : best
  }, players[0])
  if (round.mode === 'boom_blitz_boss') {
    round.bossTeam = colors[1]
  }
  for (const [index, playerId] of players.entries()) {
    const username = getPwGameWorldHelper().getPlayer(playerId)!.username
    const team =
      round.mode === 'team_battle'
        ? colors[index % 2]
        : round.mode === 'egg_hunt'
          ? colors[playerId === solo ? 0 : 1]
          : round.mode === 'boom_blitz_boss'
            ? colors[0]
            : colors[index % colors.length]
    round.players.set(playerId, {
      username,
      team,
      blocksPainted: 0,
      baseRadius: round.mode === 'egg_hunt' && playerId === solo ? 2 : 1,
      brushUntil: 0,
    })
    sendRawMessage(`/team #${playerId} ${team}`)
  }
  freezePWaintMePlayers()
  round.map = getRandomArrayElement(Array.from(store.maps.values()))
  sendGlobalChatMessage(`PWaintMe: ${round.mode.replaceAll('_', ' ')}!`)
  sendGlobalChatMessage(`Map: ${round.map.name} by ${round.map.author}`)
  await placePWaintMeMap(round.map)
  if (usePWaintMeBotWorldStore().currentState !== PWaintMeBotState.LOADING) {
    return
  }
  const helper = getPwGameWorldHelper()
  const { minX, minY, maxX, maxY } = PWAINTME_ARENA
  for (let layer = 0; layer < 3; layer++) {
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        round.snapshot.push({ x, y, layer, block: helper.getBlockAt(x, y, layer).clone() })
      }
    }
  }
  for (const playerId of round.players.keys()) {
    teleportPWaintMePlayerToArena(playerId)
  }
  round.secondsLeft = 5
  store.currentState = PWaintMeBotState.PREPARING
  sendToastMessage('Get ready to paint!', '@a', 'paintbrush', 5)
}

function startPWaintMeRound(): void {
  const store = usePWaintMeBotWorldStore()
  const round = usePWaintMeBotRoundStore()
  store.currentState = PWaintMeBotState.PLAYING
  round.secondsLeft = PWAINTME_ROUND_SECONDS
  round.modifier = getRandomArrayElement<PWaintMeModifier>(['none', 'fly', 'speed', 'multijump'])
  for (const playerId of round.players.keys()) {
    sendRawMessage(`/reseteffects #${playerId}`)
    applyPWaintMeRoundModifier(playerId)
  }
  if (round.mode === 'boom_blitz_boss' && round.players.size > 0) {
    const healer = getRandomArrayElement(Array.from(round.players.keys()))
    sendRawMessage(`/giveeffect #${healer} invulnerability`)
    sendGlobalChatMessage(`${round.players.get(healer)!.username} is the Healer! Touch them to cleanse curses.`)
  }
  sendGlobalChatMessage(`PAINT! You have ${PWAINTME_ROUND_SECONDS} seconds. Round power: ${round.modifier}.`)
}

export function applyPWaintMeRoundModifier(playerId: number): void {
  const modifier = usePWaintMeBotRoundStore().modifier
  if (modifier !== 'none') {
    const value = modifier === 'fly' ? 'true' : modifier === 'speed' ? '200' : '2'
    sendRawMessage(`/giveeffect #${playerId} ${modifier} ${value}`)
  }
}

function endPWaintMeRound(): void {
  const store = usePWaintMeBotWorldStore()
  const round = usePWaintMeBotRoundStore()
  store.currentState = PWaintMeBotState.CELEBRATING
  round.secondsLeft = 3
  round.pendingEffects = []
  freezePWaintMePlayers()
  const { counts, total } = getPWaintMeTerritory()
  const teams = new Set(Array.from(round.players.values(), (player) => player.team))
  if (round.bossTeam !== undefined) {
    teams.add(round.bossTeam)
  }
  const ranked = Array.from(teams).sort((a, b) => counts.get(b)! - counts.get(a)!)
  const top = ranked[0]
  const winner: PWaintMeTeam | undefined =
    top !== undefined && counts.get(top)! > 0 && (ranked.length === 1 || counts.get(top)! > counts.get(ranked[1])!)
      ? top
      : undefined
  if (round.players.size === 0) {
    sendGlobalChatMessage('PWaintMe round cancelled: all players left.')
  } else {
    const result =
      winner === undefined
        ? 'Draw!'
        : winner === round.bossTeam
          ? 'The Boss wins!'
          : `Team ${winner.toUpperCase()} wins!`
    sendToastMessage(result, '@a', 'trophy', 5)
    sendGlobalChatMessage(result)
    for (const team of ranked) {
      const percent = total === 0 ? 0 : (counts.get(team)! / total) * 100
      sendGlobalChatMessage(`${team.toUpperCase()}: ${percent.toFixed(1)}% territory`)
    }
    const now = new Date().toISOString()
    const today = new Date().toDateString()
    for (const [playerId, player] of round.players) {
      const stats = getPWaintMePlayerStats(player.username)
      if (stats.dailyWinsDate !== today) {
        stats.dailyWins = 0
        stats.dailyWinsDate = today
      }
      stats.roundsPlayed++
      stats.totalBlocksPainted += player.blocksPainted
      stats.lastPlayed = now
      if (player.team === winner) {
        stats.wins++
        stats.dailyWins++
        stats.colorWins.set(player.team, (stats.colorWins.get(player.team) ?? 0) + 1)
        sendRawMessage(`/givecrown #${playerId}`)
      }
      updatePWaintMePlayerCounters(playerId)
    }
  }
}

export async function restorePWaintMeArena(): Promise<void> {
  const snapshot = usePWaintMeBotRoundStore().snapshot
  const helper = getPwGameWorldHelper()
  const placements: WorldBlock[] = snapshot
    .filter((entry) => !entry.block.compareTo(helper.getBlockAt(entry.x, entry.y, entry.layer)))
    .map((entry) => ({ pos: { x: entry.x, y: entry.y }, layer: entry.layer, block: entry.block.clone() }))
  if (!(await placeMultipleBlocks(placements))) {
    throw new GameError('Failed to restore the PWaintMe arena.')
  }
}

async function finishPWaintMeRound(): Promise<void> {
  const store = usePWaintMeBotWorldStore()
  store.currentState = PWaintMeBotState.LOADING
  for (const playerId of usePWaintMeBotRoundStore().players.keys()) {
    resetPWaintMePlayer(playerId)
    sendRawMessage(`/tp #${playerId} ${PWAINTME_SPAWN.x} ${PWAINTME_SPAWN.y}`)
  }
  // Restore locally rather than reloading the saved world, which belongs to the rotating bot host.
  await restorePWaintMeArena()
  resetPWaintMeBotRoundStore()
  if (usePWaintMeBotWorldStore().currentState === PWaintMeBotState.LOADING) {
    store.currentState = PWaintMeBotState.AWAITING_PLAYERS
    store.lastActivePlayerCount = -1
  }
}

export async function advancePWaintMeRound(): Promise<void> {
  const store = usePWaintMeBotWorldStore()
  const round = usePWaintMeBotRoundStore()
  await updatePWaintMeLobbySigns()
  for (const playerId of store.queuedPlayers) {
    const player = getPwGameWorldHelper().getPlayer(playerId)
    if (
      player === undefined ||
      player.isMe ||
      player.states.godmode ||
      player.states.modmode ||
      store.afkPlayers.has(playerId)
    ) {
      store.queuedPlayers.delete(playerId)
    }
  }
  switch (store.currentState) {
    case PWaintMeBotState.AWAITING_PLAYERS:
      if (store.queuedPlayers.size >= 2) {
        setPWaintMeCountdown(10)
      } else if (store.lastActivePlayerCount !== store.queuedPlayers.size) {
        store.lastActivePlayerCount = store.queuedPlayers.size
        const playerId = store.queuedPlayers.values().next().value
        const username = playerId === undefined ? undefined : getPwGameWorldHelper().getPlayer(playerId)?.username
        sendGlobalChatMessage(
          username === undefined
            ? 'PWaintMe: waiting for 2 players. Type .play to join!'
            : `Hey ${username}! Waiting for one more painter.`,
        )
      }
      break
    case PWaintMeBotState.COUNTING_DOWN:
      if (store.queuedPlayers.size < 2) {
        store.currentState = PWaintMeBotState.AWAITING_PLAYERS
        store.lastActivePlayerCount = -1
        sendGlobalChatMessage('PWaintMe countdown cancelled: at least 2 players are needed.')
      } else if (--round.secondsLeft <= 0) {
        await preparePWaintMeRound()
      }
      break
    case PWaintMeBotState.PREPARING:
      if (round.players.size === 0) {
        endPWaintMeRound()
      } else if (--round.secondsLeft <= 0) {
        startPWaintMeRound()
      }
      break
    case PWaintMeBotState.PLAYING:
      round.secondsLeft--
      round.elapsedSeconds++
      if (round.secondsLeft <= 0 || round.players.size === 0) {
        endPWaintMeRound()
        break
      }
      advancePWaintMeEffects()
      if (round.elapsedSeconds % 10 === 0) {
        spawnPWaintMeCoins()
      }
      if (round.elapsedSeconds % 3 === 0) {
        updatePWaintMeTerritoryCounters()
      }
      advancePWaintMeBoss()
      if (round.secondsLeft === 10) {
        sendToastMessage('10 seconds remaining!', '@a', 'clock', 4)
      }
      break
    case PWaintMeBotState.CELEBRATING:
      if (--round.secondsLeft <= 0) {
        await finishPWaintMeRound()
      }
      break
  }
}

export async function updatePWaintMeLobbySigns(): Promise<void> {
  const today = new Date().toDateString()
  const leaders = Array.from(usePWaintMeBotWorldStore().playerStats)
    .filter(([, stats]) => stats.dailyWinsDate === today && stats.dailyWins > 0)
    .sort((a, b) => {
      const difference = b[1].dailyWins - a[1].dailyWins
      return difference !== 0 ? difference : a[0].localeCompare(b[0])
    })
    .slice(0, 5)
    .map(([name, stats], index) => `${index + 1}. ${name}: ${stats.dailyWins}`)
  const signs: WorldBlock[] = [
    {
      pos: { x: 116, y: 67 },
      layer: LayerType.Foreground,
      block: new Block(PwBlockName.SIGN_GREEN, ['Daily wins leaderboard\n================\n' + leaders.join('\n')]),
    },
    {
      pos: { x: 118, y: 67 },
      layer: LayerType.Foreground,
      block: new Block(PwBlockName.SIGN_GREEN, ['Your stats\n=======\nWins: %white-counter%\nPlays: %gray-counter%']),
    },
  ]
  const changes = signs.filter(
    ({ pos, layer, block }) => !block.compareTo(getPwGameWorldHelper().getBlockAt(pos.x, pos.y, layer)),
  )
  if (changes.length > 0 && !(await placeMultipleBlocks(changes))) {
    throw new GameError('Failed to update the PWaintMe lobby signs.')
  }
}
