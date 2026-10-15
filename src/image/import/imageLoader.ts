/**
 * 图片导入与解码（Sprint 1 正式实现）
 *
 * 职责：校验格式/尺寸/大小 → createImageBitmap 解码 → 返回 LoadedImage
 * 依赖：共享类型从 domain/models/types.ts 导入（全局唯一契约）
 */
import type { LoadedImage, SupportedMimeType } from '../../domain/models/types'
import { SUPPORTED_MIME_TYPES } from '../../domain/models/types'

const MAX_FILE_SIZE = 50 * 1024 * 1024
const MAX_IMAGE_SIDE = 8192

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageValidationError'
  }
}

/** 校验格式 / 大小，不做解码 */
export function validateBlob(blob: Blob): void {
  if (!SUPPORTED_MIME_TYPES.includes(blob.type as SupportedMimeType)) {
    throw new ImageValidationError(
      `不支持的格式: ${blob.type || '未知'}，支持 JPG/PNG/WebP`,
    )
  }
  if (blob.size > MAX_FILE_SIZE) {
    throw new ImageValidationError(
      `文件过大: ${(blob.size / 1024 / 1024).toFixed(1)} MB，上限 ${MAX_FILE_SIZE / 1024 / 1024} MB`,
    )
  }
}

/**
 * 从 Blob 解码得到 LoadedImage
 * @throws ImageValidationError 参数校验失败
 * @throws Error 解码失败（浏览器不支持或文件损坏）
 */
export async function loadFromBlob(blob: Blob, filename = 'image'): Promise<LoadedImage> {
  validateBlob(blob)
  const bitmap = await createImageBitmap(blob)
  if (Math.max(bitmap.width, bitmap.height) > MAX_IMAGE_SIDE) {
    bitmap.close()
    throw new ImageValidationError(
      `图片尺寸过大: ${bitmap.width}×${bitmap.height}，上限 ${MAX_IMAGE_SIDE}px`,
    )
  }
  const id = crypto.randomUUID()
  const loaded: LoadedImage = {
    imageId: id,
    filename,
    mimeType: blob.type as SupportedMimeType,
    fileSize: blob.size,
    width: bitmap.width,
    height: bitmap.height,
    crop: { x: 0, y: 0, width: bitmap.width, height: bitmap.height },
    bitmap,
    blob,
  }
  return loaded
}

/** 从 File 读取，文件名取自 File.name */
export async function loadFromFile(file: File): Promise<LoadedImage> {
  return loadFromBlob(file, file.name)
}

/** 释放运行时资源（bitmap 不进入序列化） */
export function disposeLoadedImage(img: LoadedImage): void {
  img.bitmap?.close()
  img.bitmap = undefined
  img.blob = undefined
}
