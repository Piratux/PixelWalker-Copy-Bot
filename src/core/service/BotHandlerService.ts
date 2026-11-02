import { ProtoGen } from 'pw-js-api'
import { BotType } from '@/core/enum/BotType.ts'
import {
  registerBomBotCallbacks,
  startManagedBomBot,
  stopBomBot,
} from '@/bot/bombot/service/BomBotPacketHandlerService.ts'
import {
  registerCurseBotCallbacks,
  startManagedCurseBot,
  stopCurseBot,
} from '@/bot/cursebot/service/CurseBotPacketHandlerService.ts'
import {
  registerShiftBotCallbacks,
  startManagedShiftBot,
  stopShiftBot,
} from '@/bot/shiftbot/service/ShiftBotPacketHandlerService.ts'
import {
  registerBArenaBotCallbacks,
  startManagedBArenaBot,
  stopBArenaBot,
} from '@/bot/barenabot/service/BArenaBotPacketHandlerService.ts'
import { BomBotState } from '@/bot/bombot/enum/BomBotState.ts'
import { CurseBotState } from '@/bot/cursebot/enum/CurseBotState.ts'
import { ShiftBotState } from '@/bot/shiftbot/enum/ShiftBotState.ts'
import { BArenaBotState } from '@/bot/barenabot/enum/BArenaBotState.ts'
import { useBomBotWorldStore } from '@/bot/bombot/store/BomBotWorldStore.ts'
import { useCurseBotWorldStore } from '@/bot/cursebot/store/CurseBotWorldStore.ts'
import { useShiftBotWorldStore } from '@/bot/shiftbot/store/ShiftBotWorldStore.ts'
import { useBArenaBotWorldStore } from '@/bot/barenabot/store/BArenaBotWorldStore.ts'
import { resetBomBotRoundStore } from '@/bot/bombot/store/BomBotRoundStore.ts'
import { resetCurseBotRoundStore } from '@/bot/cursebot/store/CurseBotRoundStore.ts'
import { resetShiftBotRoundStore } from '@/bot/shiftbot/store/ShiftBotRoundStore.ts'
import { resetBArenaBotRoundStore } from '@/bot/barenabot/store/BArenaBotRoundStore.ts'
import { getPwGameClient, getPwGameWorldHelper, usePwClientStore } from '@/core/store/PwClientStore.ts'
import {
  clearPendingPlacements,
  commonPlayerInitPacketReceived,
  initPwConnection,
  requirePlayerAndBotEditPermission,
} from '@/core/service/PwClientService.ts'
import { sendGlobalChatMessage, sendPrivateChatMessage, sendRawMessage } from '@/core/service/ChatMessageService.ts'
import { requireWorldOwner, isWorldOwner } from '@/core/util/Environment.ts'
import { GameError } from '@/core/class/GameError.ts'
import { handleException } from '@/core/util/Exception.ts'
import { workerWaitUntil } from '@/core/util/WorkerWaitUntil.ts'
import { resetLabelStore } from '@/core/store/LabelStore.ts'
import { resetZoneStore } from '@/core/store/ZoneStore.ts'

interface ScheduledBot {
  type: BotType
  name: string
  register: () => () => void
  start: (args: string[], playerId: number, loadWorld: boolean) => Promise<void>
  stop: () => Promise<void>
  isRunning: () => boolean
  canSwitch: () => boolean
}

export const DEFAULT_BOT_ORDER = [BotType.BOM_BOT, BotType.CURSE_BOT, BotType.SHIFT_BOT, BotType.BARENA_BOT]

let enabled = false
let rotationRequested = false
let switching = false
let currentIndex = 0
let unregisterBot: (() => void) | undefined
let midnightTimer: ReturnType<typeof setTimeout> | undefined

function getScheduledBot(): ScheduledBot {
  const bots: ScheduledBot[] = [
    {
      type: BotType.BOM_BOT,
      name: 'BomBot',
      register: registerBomBotCallbacks,
      start: startManagedBomBot,
      stop: stopBomBot,
      isRunning: () => useBomBotWorldStore().everySecondUpdateIsRunning,
      canSwitch: () =>
        [
          BomBotState.STOPPED,
          BomBotState.RESET_STORE,
          BomBotState.AWAITING_PLAYERS,
          BomBotState.PREPARING_FOR_NEXT_ROUND,
          BomBotState.WAITING_FOR_ALL_PLAYERS_TO_BE_TELEPORTED_TO_MAP,
        ].includes(useBomBotWorldStore().currentState),
    },
    {
      type: BotType.CURSE_BOT,
      name: 'CurseBot',
      register: registerCurseBotCallbacks,
      start: startManagedCurseBot,
      stop: stopCurseBot,
      isRunning: () => useCurseBotWorldStore().everySecondUpdateIsRunning,
      canSwitch: () =>
        [
          CurseBotState.STOPPED,
          CurseBotState.RESET_STORE,
          CurseBotState.AWAITING_PLAYERS,
          CurseBotState.PREPARING_FOR_NEXT_ROUND,
          CurseBotState.WAITING_FOR_ALL_PLAYERS_TO_BE_TELEPORTED_TO_MAP,
          CurseBotState.COUNTING_DOWN_TO_REMOVE_NO_SPEED,
          CurseBotState.CELEBRATING_VICTORY,
        ].includes(useCurseBotWorldStore().currentState),
    },
    {
      type: BotType.SHIFT_BOT,
      name: 'ShiftBot',
      register: registerShiftBotCallbacks,
      start: startManagedShiftBot,
      stop: stopShiftBot,
      isRunning: () => useShiftBotWorldStore().everySecondUpdateIsRunning,
      canSwitch: () =>
        [
          ShiftBotState.STOPPED,
          ShiftBotState.RESET_STORE,
          ShiftBotState.AWAITING_PLAYERS,
          ShiftBotState.PREPARING_FOR_FIRST_ROUND,
          ShiftBotState.ROUND_START,
          ShiftBotState.PAUSE_AFTER_ROUND,
        ].includes(useShiftBotWorldStore().currentState),
    },
    {
      type: BotType.BARENA_BOT,
      name: 'BArenaBot',
      register: registerBArenaBotCallbacks,
      start: startManagedBArenaBot,
      stop: stopBArenaBot,
      isRunning: () => useBArenaBotWorldStore().everyTickUpdateIsRunning,
      canSwitch: () =>
        [
          BArenaBotState.STOPPED,
          BArenaBotState.RESET_STORE,
          BArenaBotState.AWAITING_PLAYERS,
          BArenaBotState.PREPARING_FOR_NEXT_ROUND,
          BArenaBotState.COUNTING_DOWN_FOR_ROUND_START,
          BArenaBotState.CELEBRATING_VICTORY,
        ].includes(useBArenaBotWorldStore().currentState),
    },
  ]
  const bot = bots.find((entry) => entry.type === DEFAULT_BOT_ORDER[currentIndex])
  if (bot === undefined) {
    throw new Error('No bot configured for the current schedule position.')
  }
  return bot
}

function registerBotHandlerCallbacks(): void {
  enabled = true
  switching = true
  usePwClientStore().botType = getScheduledBot().type
  const client = getPwGameClient()
  client.addHook(getPwGameWorldHelper().receiveHook)
  client.addCallback('error', handleException)
  client.addCallback('playerInitPacket', () => {
    commonPlayerInitPacketReceived()
    client.send('playerGodModePacket', { enabled: true })
    sendRawMessage(`/team #${getPwGameWorldHelper().botPlayerId} 1`)
  })
  client.addCallback('playerChatPacket', handleRotationCommand)
  unregisterBot = getScheduledBot().register()
}

function handleRotationCommand(data: ProtoGen.PlayerChatPacket): 'STOP' | undefined {
  const [command, argument] = data.message.trim().toLowerCase().split(/\s+/)
  const playerId = data.playerId!
  if (command === '.help' && argument === 'nextbot') {
    sendPrivateChatMessage(
      '.nextbot: Switch to the next bot when the current round ends. Owner/developer only.',
      playerId,
    )
    return 'STOP'
  }
  if (command === '.nextbot') {
    // Consume permission errors too, so another bot cannot treat .nextbot as an unknown command.
    try {
      requireWorldOwner(playerId)
      if (switching) {
        sendPrivateChatMessage('A bot is already starting or switching.', playerId)
      } else {
        requestRotation()
      }
    } catch (error) {
      handleException(error)
    }
    return 'STOP'
  }
  if (switching && command.startsWith('.')) {
    sendPrivateChatMessage('Please wait until the bot has finished starting or switching.', playerId)
    return 'STOP'
  }
  if (command === '.help' && argument === undefined) {
    sendPrivateChatMessage(
      'Rotation: .nextbot (owner/developer), .help nextbot. Bots rotate daily at server-local midnight.',
      playerId,
    )
  }
  return undefined
}

function requestRotation(): void {
  if (rotationRequested) {
    sendGlobalChatMessage('A bot switch is already queued for the end of this round.')
    return
  }
  rotationRequested = true
  sendGlobalChatMessage('Switching to the next bot as soon as the current round has finished.')
  const bot = getScheduledBot()
  if (!bot.isRunning()) {
    shouldPauseForBotRotation(bot.type)
  }
}

export function shouldPauseForBotRotation(botType: BotType): boolean {
  if (!enabled || !rotationRequested || switching) {
    return false
  }
  const bot = getScheduledBot()
  if (bot.type !== botType || !bot.canSwitch()) {
    return false
  }
  switching = true
  // Let the old update loop return and mark itself stopped before replacing its callbacks and stores.
  queueMicrotask(() => {
    void switchToNextBot().catch(failRotation)
  })
  return true
}

export function isBotStarting(botType: BotType): boolean {
  return enabled && switching && usePwClientStore().botType === botType
}

async function switchToNextBot(): Promise<void> {
  await getScheduledBot().stop()
  await workerWaitUntil(() => usePwClientStore().totalBlocksLeftToReceiveFromWorldBlockPlacedPacket === 0, {
    timeout: 15000,
    intervalBetweenAttempts: 100,
  })
  unregisterBot?.()
  unregisterBot = undefined
  currentIndex = (currentIndex + 1) % DEFAULT_BOT_ORDER.length
  await startCurrentBot()
}

export async function startBotHandler(worldId: string, email: string, password: string): Promise<void> {
  await initPwConnection(worldId, email, password, '', registerBotHandlerCallbacks)
  await startCurrentBot()
}

async function startCurrentBot(): Promise<void> {
  const helper = getPwGameWorldHelper()
  const playerId = helper.botPlayerId
  if (!isWorldOwner(playerId)) {
    throw new GameError('The rotating bot must be the world owner.')
  }
  requirePlayerAndBotEditPermission(playerId)
  if (helper.width < 200 || helper.height < 200) {
    throw new GameError('Bot rotation requires a world of at least 200x200.')
  }

  await clearWorldForNextBot()
  clearPendingPlacements()
  resetLabelStore()
  resetZoneStore()
  helper.labels.clear()
  helper.zones.clear()
  resetBomBotRoundStore()
  resetCurseBotRoundStore()
  resetShiftBotRoundStore()
  resetBArenaBotRoundStore()

  const bot = getScheduledBot()
  usePwClientStore().botType = bot.type
  unregisterBot?.()
  unregisterBot = bot.register()

  // Keep the game loop paused until startup finishes and the player resets have been queued.
  await bot.start([], playerId, true)
  useBomBotWorldStore().playerBomBotWorldData.clear()
  useCurseBotWorldStore().playerCurseBotWorldData.clear()
  useShiftBotWorldStore().playerShiftBotWorldData.clear()
  useBArenaBotWorldStore().playerBArenaBotWorldData.clear()
  sendRawMessage('/reset @all')
  sendRawMessage(`/team #${playerId} 1`)
  rotationRequested = false
  switching = false
  scheduleMidnight()
  sendGlobalChatMessage(`${bot.name} is active. The next bot switch is at server-local midnight, after the round ends.`)
}

async function clearWorldForNextBot(): Promise<void> {
  const client = getPwGameClient()
  let cleared = false
  const onCleared = () => {
    cleared = true
  }
  client.addCallback('worldClearedPacket', onCleared)
  try {
    client.send('worldActionUpdatePacket', { action: ProtoGen.WorldActionUpdatePacket_Action.CLEAR_WORLD })
    await workerWaitUntil(() => cleared, { timeout: 15000, intervalBetweenAttempts: 100 })
  } finally {
    client.removeCallback('worldClearedPacket', onCleared)
  }
}

function scheduleMidnight(): void {
  if (midnightTimer !== undefined) {
    clearTimeout(midnightTimer)
  }
  const now = new Date()
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  midnightTimer = setTimeout(requestRotation, midnight.getTime() - now.getTime())
}

function failRotation(error: unknown): void {
  console.error('Bot rotation failed:', error)
  sendGlobalChatMessage('ERROR! Bot rotation failed. The bot handler is stopping; check the server logs.')
  process.exit(1)
}
