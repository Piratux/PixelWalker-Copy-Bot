import { getPwGameWorldHelper } from '@/store/PWClientStore.ts'

export function getEnvDefaultWorldId() {
  if (!import.meta.env.VITE_DEFAULT_WORLD_ID) {
    throw new Error('VITE_DEFAULT_WORLD_ID is not defined in environment variables')
  }
  return import.meta.env.VITE_DEFAULT_WORLD_ID
}

export function isEnvDevViewEnabled() {
  if (!import.meta.env.VITE_DEV_VIEW) {
    throw new Error('VITE_DEV_VIEW is not defined in environment variables')
  }
  return (import.meta.env.VITE_DEV_VIEW === 'TRUE')
}

export function isDeveloper(playerId: number) {
  const player = getPwGameWorldHelper().getPlayer(playerId)
  if(!player) {
    return false
  }
  let dev_username = 'PIRATUX'
  if(import.meta.env.VITE_DEV_USERNAME) {
    dev_username = import.meta.env.VITE_DEV_USERNAME.toUpperCase()
  } else {
    console.log('VITE_DEV_USERNAME is not defined in environment variables, assuming "PIRATUX"')
  }
  return (player.username == dev_username)
}
