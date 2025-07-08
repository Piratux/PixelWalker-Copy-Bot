interface ImportMetaEnv {
  readonly VITE_DEFAULT_WORLD_ID: string
  readonly VITE_DEV_VIEW: string
  readonly VITE_DEV_USERNAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
