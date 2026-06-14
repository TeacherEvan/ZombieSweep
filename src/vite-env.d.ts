/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ERROR_ENDPOINT: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
