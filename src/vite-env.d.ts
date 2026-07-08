/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ERROR_ENDPOINT: string | undefined;
  readonly VITE_RENDER3D?: string;
  readonly VITE_ONLINE_COOP?: string;
  readonly VITE_ONLINE_VERSUS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
