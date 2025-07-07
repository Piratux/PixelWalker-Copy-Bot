/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEFAULT_WORLD_ID: string
  readonly VITE_DEV_VIEW: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
