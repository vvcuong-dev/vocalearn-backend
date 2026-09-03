export interface ImageUploadLimit {
  maxSize: number;
  maxFilesCount: number;
  allowedMimeTypes: readonly string[];
}
