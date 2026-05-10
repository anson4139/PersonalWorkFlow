/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_PRIVILEGED_EMAIL?: string;
  readonly VITE_ADMIN_EMAIL?: string;
  readonly VITE_DEV_VIEWER_EMAIL?: string;
  readonly VITE_DEV_ALLOWED_SUBJECTS?: string;
  readonly VITE_DEV_IS_ADMIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
