import type { NoteDTO } from "@/modules/notes/models/DTO/NoteDto";
import type { StoredFileDTO } from "@/modules/files/models/DTO/StoredFileDto";

export type ReaderItem =
  | { type: "note", id: string, order: number, createdAt: string, note: NoteDTO }
  | { type: "file", id: string, order: number, createdAt: string, file: StoredFileDTO }
