/**
 * Demo 1 验证模块：Canvas 绘制 + toBlob 导出 PNG
 * 未来演进为 Sprint 1 的 infrastructure/files/exportAdapter.ts
 */
export async function exportAsPng(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建 2D 上下文')
  draw(ctx)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('toBlob 导出失败')
  return blob
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
