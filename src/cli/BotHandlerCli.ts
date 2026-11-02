import { createPinia, setActivePinia } from 'pinia'
import { startBotHandler } from '@/core/service/BotHandlerService.ts'

setActivePinia(createPinia())

const email = import.meta.env.VITE_BAL_ACCOUNT_EMAIL ?? ''
const password = import.meta.env.VITE_BAL_ACCOUNT_PASSWORD ?? ''
const worldId = import.meta.env.VITE_BAL_WORLD_ID ?? ''

if (email === '' || password === '' || worldId === '') {
  console.error('Bot handler CLI — missing required environment variables.')
  console.error('')
  console.error('Required:')
  console.error('  VITE_BAL_ACCOUNT_EMAIL=<email>')
  console.error('  VITE_BAL_ACCOUNT_PASSWORD=<password>')
  console.error('  VITE_BAL_WORLD_ID=<worldId>')
  process.exit(1)
}

await startBotHandler(worldId, email, password)

console.log('Bot handler is running! Press Ctrl+C to stop.')
