import { fileKindIcons } from "../models/constants/file.constants";
import type { FileKind } from "../models/Types/FileKind";

export const fileKind = (mimeType: string): FileKind => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("text/")) return "text";
  return "other";
};

export const fileIcon = (mimeType: string): string => fileKindIcons[fileKind(mimeType)];
