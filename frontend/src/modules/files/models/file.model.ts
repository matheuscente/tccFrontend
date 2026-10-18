export interface StoredFile {
  id: string
  originalName: string
  mimeType: string
  size: number
  courseId: string | null
  moduleId: string | null
  disciplineId: string | null
  createdAt: string
}

export interface FileAccess {
  viewUrl: string
  downloadUrl: string
  expiresInSeconds: number
}

export type FileKind = "image" | "video" | "audio" | "pdf" | "text" | "other";

export const fileKind = (mimeType: string): FileKind => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("text/")) return "text";
  return "other";
};

export const fileIcon = (mimeType: string): string => ({
  image: "mdi-file-image-outline",
  video: "mdi-file-video-outline",
  audio: "mdi-file-music-outline",
  pdf: "mdi-file-pdf-box",
  text: "mdi-file-document-outline",
  other: "mdi-file-outline",
})[fileKind(mimeType)];
