/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_KEYCLOAK_CLIENT_ID: string
  readonly VITE_APP_KEYCLOAK_URL: string
  readonly VITE_ENVIRONMENT_NAME: string
  readonly NODE_ENV: string
  readonly PORT: number
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
