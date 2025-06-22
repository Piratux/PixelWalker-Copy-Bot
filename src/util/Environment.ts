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
