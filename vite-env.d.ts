/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEFAULT_WORLD_ID?: string
  readonly VITE_DEV_VIEW?: string
  readonly VITE_DEV_USERNAME?: string
  readonly VITE_PW_API_URL?: string
  readonly VITE_PW_GAME_HTTP_URL?: string
  readonly VITE_PW_GAME_WS_URL?: string
  readonly VITE_TEST_RUN_PW_ACCOUNT_EMAIL?: string
  readonly VITE_TEST_RUN_PW_ACCOUNT_PASSWORD?: string
  readonly VITE_TEST_RUN_PW_WORLD_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
