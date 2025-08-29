import { getPwBlocks, getPwBotType, getPwGameClient, getPwGameWorldHelper } from '@/store/PwClientStore.ts'
import { sendGlobalChatMessage, sendPrivateChatMessage } from '@/service/ChatMessageService.ts'
import { ProtoGen } from 'pw-js-api'
import { CallbackEntry } from '@/type/CallbackEntry.ts'
import { hotReloadCallbacks, playerInitPacketReceived, pwCheckEdit } from '@/service/PwClientService.ts'
import { isDeveloper } from '@/util/Environment.ts'
import { vec2 } from '@basementuniverse/vec'
import { cloneDeep } from 'lodash-es'
import { Block, LayerType } from 'pw-js-world'
import { WorldBlock } from '@/type/WorldBlock.ts'
import { PwBlockName } from '@/gen/PwBlockName.ts'
import {
  blockIsPortal,
  getAnotherWorldBlocks,
  placeMultipleBlocks,
  placeWorldDataBlocks,
} from '@/service/WorldService.ts'
import { TOTAL_PW_LAYERS } from '@/constant/General.ts'
import { getWorldIdIfUrl } from '@/service/WorldIdExtractorService.ts'
import { BotType } from '@/enum/BotType.ts'

const callbacks: CallbackEntry[] = [
  { name: 'playerInitPacket', fn: playerInitPacketReceived },
  { name: 'playerJoinedPacket', fn: playerJoinedPacketReceived },
  { name: 'playerChatPacket', fn: playerChatPacketReceived },
]

export function registerBomBotCallbacks() {
  const client = getPwGameClient()
  const helper = getPwGameWorldHelper()
  client.addHook(helper.receiveHook)
  client.addCallback('debug', console.log)
  for (const cb of callbacks) {
    client.addCallback(cb.name, cb.fn)
  }
}

if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', ({}) => {
    if (getPwBotType() === BotType.BOM_BOT) {
      hotReloadCallbacks(callbacks)
    }
    // TODO: add hot reload for every second callback
  })
}

function playerJoinedPacketReceived(data: ProtoGen.PlayerJoinedPacket) {
  const playerId = data.properties?.playerId
  if (!playerId) {
    return
  }
  sendPrivateChatMessage('BomBot is here! Type .help to show usage!', playerId)
}

async function playerChatPacketReceived(data: ProtoGen.PlayerChatPacket) {
  const args = data.message.split(' ')
  const playerId = data.playerId!

  switch (args[0].toLowerCase()) {
    case '.start':
      await startCommandReceived(args, playerId)
      break
    case '.placeallbombot':
      await placeallbombotCommandReceived(args, playerId)
      break
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

  const startPos = vec2(20, 361)
  const endPos = vec2(389, 361)
  const currentPos = cloneDeep(startPos)
  const sortedListBlocks = getPwBlocks()
  const worldBlocks = []
  for (const singleBlock of sortedListBlocks) {
    if ((singleBlock.Layer as LayerType) === LayerType.Background) {
      continue
    }
    if (currentPos.x >= endPos.x) {
      currentPos.x = startPos.x
      currentPos.y += 3
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

async function placeBomBotMap() {
  const bomBotMapWorldId = getWorldIdIfUrl('r3796a7103bb687')
  const blocks = await getAnotherWorldBlocks(bomBotMapWorldId)
  if (!blocks) {
    sendGlobalChatMessage('ERROR! Failed to load BomBot map')
    return
  }
  await placeWorldDataBlocks(blocks)
}

async function startCommandReceived(_args: string[], playerId: number) {
  if (!pwCheckEdit(getPwGameWorldHelper(), playerId)) {
    return
  }

  if (!isDeveloper(playerId)) {
    sendPrivateChatMessage('ERROR! Command is exclusive to bot developers', playerId)
    return
  }

  await placeBomBotMap()
}
