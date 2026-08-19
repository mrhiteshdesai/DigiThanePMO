/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PM_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
