import { createPinia, getActivePinia, setActivePinia } from 'pinia'
import { initPwClasses } from '@/core/service/PwClientService.ts'
import { BotType } from '@/core/enum/BotType.ts'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { afterEach } from 'vitest'
import { getPlayerCopyBotData } from '@/copybot/store/CopyBotStore.ts'

if (getActivePinia() === undefined) {
  console.log('No active Pinia found, creating a new one.')
  setActivePinia(createPinia())

  await initPwClasses(
    import.meta.env.VITE_TEST_RUN_PW_WORLD_ID!,
    import.meta.env.VITE_TEST_RUN_PW_ACCOUNT_EMAIL!,
    import.meta.env.VITE_TEST_RUN_PW_ACCOUNT_PASSWORD!,
    '',
    BotType.COPY_BOT,
  )

  if (getPwGameWorldHelper().width < 200 || getPwGameWorldHelper().height < 200) {
    throw new Error('To perform tests, world must be at least 200x200 size.')
  }
}

afterEach(() => {
  const playerId = getPwGameWorldHelper().botPlayerId
  delete getPlayerCopyBotData()[playerId]
})
