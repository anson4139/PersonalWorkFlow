/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  // 未來可加入環境變數
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
