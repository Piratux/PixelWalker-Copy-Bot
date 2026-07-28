import { createPinia, setActivePinia } from 'pinia'
import { initPwClasses } from '@/core/service/PwClientService.ts'
import { BotType } from '@/core/enum/BotType.ts'

setActivePinia(createPinia())

const email = import.meta.env.VITE_BAL_ACCOUNT_EMAIL ?? ''
const password = import.meta.env.VITE_BAL_ACCOUNT_PASSWORD ?? ''
const worldId = import.meta.env.VITE_BAL_WORLD_ID ?? ''

if (email === '' || password === '' || worldId === '') {
  console.error('BomBot CLI — missing required environment variables.')
  console.error('')
  console.error('Required:')
  console.error('  VITE_BAL_ACCOUNT_EMAIL=<email>')
  console.error('  VITE_BAL_ACCOUNT_PASSWORD=<password>')
  console.error('  VITE_BAL_WORLD_ID=<worldId>')
  process.exit(1)
}

await initPwClasses(worldId, email, password, '', BotType.BOM_BOT)

console.log('BomBot is running! Press Ctrl+C to stop.')
