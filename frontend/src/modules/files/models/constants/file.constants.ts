import type { FileKind } from "../Types/FileKind";

// mesmo limite da API (MAX_FILE_SIZE_MB=95): o proxy do Cloudflare recusa requisições acima de 100 MB
export const MAX_UPLOAD_SIZE_MB = 95;
export const MAX_UPLOAD_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export const TEXT_PREVIEW_LIMIT = 2 * 1024 * 1024;

export const fileKindIcons: Record<FileKind, string> = {
  image: "mdi-file-image-outline",
  video: "mdi-file-video-outline",
  audio: "mdi-file-music-outline",
  pdf: "mdi-file-pdf-box",
  text: "mdi-file-document-outline",
  other: "mdi-file-outline",
};
