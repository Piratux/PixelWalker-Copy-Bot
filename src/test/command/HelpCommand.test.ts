import { describe, test } from 'vitest'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { commandReceived } from '@/bot/copybot/service/CopyBotPacketHandlerService.ts'
import { CopyBotCommandName } from '@/bot/copybot/enum/CopyBotCommandName.ts'

describe.sequential('.help', () => {
  test('.help', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    await commandReceived(ctx.task.name, playerId)
  })

  test('All commands have help info', async () => {
    const playerId = getPwGameWorldHelper().botPlayerId
    for (const commandName of Object.values(CopyBotCommandName)) {
      await commandReceived(`.help ${commandName}`, playerId)
    }
  })
})
