/**
 * Demo 3 验证模块：ImageBitmap 解码与格式校验
 * 未来演进为 Sprint 1 的 image/import/imageLoader.ts 正式实现
 */
export const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number]

export interface DecodedImage {
  bitmap: ImageBitmap
  width: number
  height: number
  mimeType: string
  fileSize: number
}

const MAX_FILE_SIZE = 50 * 1024 * 1024

export async function decodeImageBlob(blob: Blob): Promise<DecodedImage> {
  if (!SUPPORTED_MIME_TYPES.includes(blob.type as SupportedMimeType)) {
    throw new Error(`不支持的格式: ${blob.type || '未知'}`)
  }
  if (blob.size > MAX_FILE_SIZE) {
    throw new Error(`文件过大: ${(blob.size / 1024 / 1024).toFixed(1)} MB`)
  }
  const bitmap = await createImageBitmap(blob)
  return {
    bitmap,
    width: bitmap.width,
    height: bitmap.height,
    mimeType: blob.type,
    fileSize: blob.size,
  }
}
