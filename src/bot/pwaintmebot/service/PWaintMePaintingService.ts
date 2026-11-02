import { Block, createBlockPacket, createBlockPackets, LayerType, Point } from 'pw-js-world'
import {
  PWAINTME_ARENA,
  PWAINTME_DEBUFFS,
  PWAINTME_POWER_UPS,
  PWAINTME_PRISON,
  PWAINTME_TEAMS,
} from '@/bot/pwaintmebot/constant/General.ts'
import { PWaintMeBotState } from '@/bot/pwaintmebot/enum/PWaintMeBotState.ts'
import { usePWaintMeBotRoundStore } from '@/bot/pwaintmebot/store/PWaintMeBotRoundStore.ts'
import { usePWaintMeBotWorldStore } from '@/bot/pwaintmebot/store/PWaintMeBotWorldStore.ts'
import { PWaintMePowerUp, PWaintMeTeam } from '@/bot/pwaintmebot/type/PWaintMeBotData.ts'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { placeBlockPacket } from '@/core/service/WorldService.ts'
import { sendRawMessage, sendToastMessage } from '@/core/service/ChatMessageService.ts'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { getRandomArrayElement } from '@/core/util/Random.ts'
import { shuffle } from 'lodash-es'

export function isInsidePWaintMeArena(x: number, y: number): boolean {
  const { minX, minY, maxX, maxY } = PWAINTME_ARENA
  return Number.isInteger(x) && Number.isInteger(y) && x >= minX && x <= maxX && y >= minY && y <= maxY
}

export function paintPWaintMeArea(
  team: PWaintMeTeam,
  contains: (x: number, y: number) => boolean,
  playerId?: number,
  bounds = PWAINTME_ARENA,
): void {
  const helper = getPwGameWorldHelper()
  const palette = usePWaintMeBotWorldStore().palette
  const placements: WorldBlock[] = []
  const minX = Math.max(bounds.minX, PWAINTME_ARENA.minX)
  const minY = Math.max(bounds.minY, PWAINTME_ARENA.minY)
  const maxX = Math.min(bounds.maxX, PWAINTME_ARENA.maxX)
  const maxY = Math.min(bounds.maxY, PWAINTME_ARENA.maxY)
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      if (!contains(x, y)) {
        continue
      }
      for (const layer of [LayerType.Background, LayerType.Foreground]) {
        const block = helper.getBlockAt(x, y, layer)
        const entry = palette.get(block.bId)
        const targetId = entry?.layer === layer ? entry.variants.get(team) : undefined
        if (targetId !== undefined && targetId !== block.bId) {
          placements.push({ pos: { x, y }, layer, block: new Block(targetId, { ...block.args }) })
        }
      }
    }
  }
  for (const packet of createBlockPackets(placements)) {
    placeBlockPacket(packet)
  }
  const participant = playerId === undefined ? undefined : usePWaintMeBotRoundStore().players.get(playerId)
  if (participant !== undefined) {
    participant.blocksPainted += placements.length
  }
}

export function paintPWaintMeCircle(team: PWaintMeTeam, position: Point, radius: number, playerId?: number): void {
  paintPWaintMeArea(team, (x, y) => (x - position.x) ** 2 + (y - position.y) ** 2 <= radius ** 2, playerId, {
    minX: position.x - radius,
    minY: position.y - radius,
    maxX: position.x + radius,
    maxY: position.y + radius,
  })
}

export function canPlayerPaintPWaintMe(playerId: number): boolean {
  const round = usePWaintMeBotRoundStore()
  const player = getPwGameWorldHelper().getPlayer(playerId)
  return (
    usePWaintMeBotWorldStore().currentState === PWaintMeBotState.PLAYING &&
    round.players.has(playerId) &&
    player !== undefined &&
    !player.isMe &&
    !player.states.godmode &&
    !player.states.modmode &&
    (round.modifier === 'fly' || !player.effects.has(1))
  )
}

export function movePWaintMePlayer(playerId: number, position: Point): void {
  if (!canPlayerPaintPWaintMe(playerId)) {
    return
  }
  // Movement packets use pixels; touch-block packets already use tile coordinates.
  const tile = { x: Math.floor(position.x / 16), y: Math.floor(position.y / 16) }
  if (!isInsidePWaintMeArena(tile.x, tile.y)) {
    return
  }
  const participant = usePWaintMeBotRoundStore().players.get(playerId)!
  const radius = participant.brushUntil > Date.now() ? 3 : participant.baseRadius
  paintPWaintMeCircle(participant.team, tile, radius, playerId)
  collectPWaintMeCoins(playerId, tile)
}

export function getPWaintMeTerritory(): { counts: Map<PWaintMeTeam, number>; total: number } {
  const counts = new Map(PWAINTME_TEAMS.map((team) => [team, 0]))
  const palette = usePWaintMeBotWorldStore().palette
  const helper = getPwGameWorldHelper()
  const { minX, minY, maxX, maxY } = PWAINTME_ARENA
  let total = 0
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (const layer of [LayerType.Background, LayerType.Foreground]) {
        const entry = palette.get(helper.getBlockAt(x, y, layer).bId)
        const color = entry?.layer === layer ? entry.color : undefined
        if (color !== undefined) {
          total++
          const team = PWAINTME_TEAMS.find((candidate) => candidate === color)
          if (team !== undefined) {
            counts.set(team, counts.get(team)! + 1)
          }
        }
      }
    }
  }
  return { counts, total }
}

export function updatePWaintMeTerritoryCounters(): void {
  const { counts, total } = getPWaintMeTerritory()
  for (const playerId of usePWaintMeBotRoundStore().players.keys()) {
    for (const team of PWAINTME_TEAMS) {
      sendRawMessage(
        `/counter #${playerId} ${team} =${total === 0 ? 0 : Math.round((counts.get(team)! / total) * 100)}`,
      )
    }
  }
}

export function spawnPWaintMeCoins(): void {
  const round = usePWaintMeBotRoundStore()
  const helper = getPwGameWorldHelper()
  const candidates: Point[] = []
  const { minX, minY, maxX, maxY } = PWAINTME_ARENA
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      if (helper.getBlockAt(x, y, LayerType.Foreground).bId === 0 && !round.coins.has(`${x},${y}`)) {
        candidates.push({ x, y })
      }
    }
  }
  const count = round.mode === 'painter_party' ? 3 : round.mode === 'boom_blitz_boss' || round.players.size >= 4 ? 2 : 1
  const block = new Block(PwBlockName.COIN_GOLD)
  for (const position of shuffle(candidates).slice(0, count)) {
    round.coins.set(`${position.x},${position.y}`, position)
    placeBlockPacket(createBlockPacket(block, LayerType.Foreground, position))
  }
}

export function collectPWaintMeCoins(playerId: number, position: Point): void {
  if (!canPlayerPaintPWaintMe(playerId) || !isInsidePWaintMeArena(position.x, position.y)) {
    return
  }
  const round = usePWaintMeBotRoundStore()
  for (const [key, coin] of round.coins) {
    if (Math.abs(coin.x - position.x) <= 1 && Math.abs(coin.y - position.y) <= 1) {
      round.coins.delete(key)
      placeBlockPacket(createBlockPacket(new Block(0), LayerType.Foreground, coin))
      const buffsOnly = round.lastPowerUpWasDebuff || round.mode === 'painter_party' || round.mode === 'boom_blitz_boss'
      const pool = PWAINTME_POWER_UPS.filter((powerUp) => !buffsOnly || !PWAINTME_DEBUFFS.includes(powerUp))
      const powerUp = getRandomArrayElement(pool)
      round.lastPowerUpWasDebuff = PWAINTME_DEBUFFS.includes(powerUp)
      sendToastMessage(`${round.players.get(playerId)!.username}: ${powerUp.replaceAll('_', ' ')}!`, '@a', 'star')
      executePWaintMePowerUp(powerUp, playerId, position)
    }
  }
}

function giveTemporaryPWaintMeEffect(
  playerId: number,
  effect: string,
  value: number,
  restore: number,
  seconds: number,
): void {
  const round = usePWaintMeBotRoundStore()
  sendRawMessage(`/giveeffect #${playerId} ${effect} ${value}`)
  round.pendingEffects = round.pendingEffects.filter((entry) => entry.playerId !== playerId || entry.effect !== effect)
  round.pendingEffects.push({ playerId, effect, value: restore, expiresAt: Date.now() + seconds * 1000 })
}

export function executePWaintMePowerUp(powerUp: PWaintMePowerUp, playerId: number, position: Point): void {
  const round = usePWaintMeBotRoundStore()
  const player = round.players.get(playerId)!
  switch (powerUp) {
    case 'mega_bomb':
      paintPWaintMeCircle(player.team, position, 13, playerId)
      break
    case 'cross_strike':
      paintPWaintMeArea(player.team, (x, y) => Math.abs(x - position.x) <= 1 || Math.abs(y - position.y) <= 1, playerId)
      break
    case 'super_brush':
      for (const [id, ally] of round.players) {
        if (
          id === playerId ||
          ((round.mode === 'team_battle' || round.mode === 'boom_blitz_boss') && ally.team === player.team)
        ) {
          ally.brushUntil = Date.now() + 10_000
        }
      }
      paintPWaintMeCircle(player.team, position, 3, playerId)
      break
    case 'freezing_beam':
      for (const [id, opponent] of round.players) {
        if (opponent.team !== player.team) {
          giveTemporaryPWaintMeEffect(id, 'speed', 0, round.modifier === 'speed' ? 200 : 100, 3)
          giveTemporaryPWaintMeEffect(id, 'multijump', 0, round.modifier === 'multijump' ? 2 : 1, 3)
        }
      }
      break
    case 'dimension_flip':
      for (const [id, opponent] of round.players) {
        if (opponent.team !== player.team) {
          giveTemporaryPWaintMeEffect(id, 'gravitydirection', getRandomArrayElement([1, 2, 3]), 4, 5)
          giveTemporaryPWaintMeEffect(id, 'gravityforce', 200, 100, 5)
        }
      }
      break
    case 'prison_party':
      for (const [id, opponent] of round.players) {
        if (opponent.team !== player.team) {
          sendRawMessage(`/tp #${id} ${PWAINTME_PRISON.x} ${PWAINTME_PRISON.y}`)
        }
      }
      break
  }
}

export function advancePWaintMeEffects(): void {
  const round = usePWaintMeBotRoundStore()
  const now = Date.now()
  for (const effect of round.pendingEffects) {
    if (effect.expiresAt <= now && round.players.has(effect.playerId)) {
      sendRawMessage(`/giveeffect #${effect.playerId} ${effect.effect} ${effect.value}`)
    }
  }
  round.pendingEffects = round.pendingEffects.filter((effect) => effect.expiresAt > now)
}

export function advancePWaintMeBoss(): void {
  const round = usePWaintMeBotRoundStore()
  const bossTeam = round.bossTeam
  if (bossTeam === undefined) {
    return
  }
  const { minX, minY, maxX, maxY } = PWAINTME_ARENA
  if (round.secondsLeft <= 30 && !round.bossSupernovaUsed) {
    round.bossSupernovaUsed = true
    const cx = Math.floor((minX + maxX) / 2)
    const cy = Math.floor((minY + maxY) / 2)
    paintPWaintMeArea(
      bossTeam,
      (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= 169 || x === cx || y === cy || Math.abs(x - cx) === Math.abs(y - cy),
    )
    sendToastMessage('BOSS ULTIMATE: SUPERNOVA!', '@a', 'bomb', 5)
  }
  const participants = Array.from(round.players.keys())
  if (round.elapsedSeconds % 10 === 0 && participants.length > 0) {
    const playerId = getRandomArrayElement(participants)
    sendRawMessage(`/tp #${playerId} ${PWAINTME_PRISON.x} ${PWAINTME_PRISON.y}`)
    sendToastMessage('Boss sent a player to Prison!', '@a', 'lock')
  }
  if (round.elapsedSeconds % 15 === 0) {
    for (const playerId of participants) {
      sendRawMessage(`/giveeffect #${playerId} curse 10000`)
    }
    sendToastMessage('Boss cast CURSE! Touch the Healer within 10s!', '@a', 'skull', 5)
  }
  if (round.elapsedSeconds % (participants.length >= 4 ? 2 : 3) === 0) {
    const position = {
      x: minX + Math.floor(Math.random() * (maxX - minX + 1)),
      y: minY + Math.floor(Math.random() * (maxY - minY + 1)),
    }
    const attack = getRandomArrayElement(['bomb', 'cross', 'diagonal'])
    if (attack === 'bomb') {
      paintPWaintMeCircle(bossTeam, position, 8)
    } else {
      paintPWaintMeArea(bossTeam, (x, y) =>
        attack === 'cross'
          ? x === position.x || y === position.y
          : Math.abs(x - position.x) === Math.abs(y - position.y),
      )
    }
  }
}
