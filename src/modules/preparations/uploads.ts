export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const ALLOWED_UPLOAD_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/markdown",
  "image/png",
  "image/jpeg",
] as const;

export type AllowedUploadType = (typeof ALLOWED_UPLOAD_TYPES)[number];

export function uploadRejection(
  contentType: string,
  byteSize: number,
): string | null {
  if (!ALLOWED_UPLOAD_TYPES.includes(contentType as AllowedUploadType)) {
    return "This file type is not supported";
  }

  if (!Number.isInteger(byteSize) || byteSize < 1) {
    return "The file is empty";
  }

  if (byteSize > MAX_UPLOAD_BYTES) {
    return "Files must be 25 MB or smaller";
  }

  return null;
}

export function safeFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop()?.trim() || "file";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}
