import {
  useState,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { decodeImageBlob } from '../image/import/imageLoader'
import { countTopColors, readPixels } from '../image/analysis/colorAnalyzer'
import { downloadBlob, exportAsPng } from '../rendering/exportAdapter'

interface DemoState {
  running: boolean
  ok: boolean | null
  log: string[]
  previewUrl?: string
}

const IDLE: DemoState = { running: false, ok: null, log: [] }

const container: CSSProperties = { maxWidth: 760, margin: '0 auto', padding: 24 }
const card: CSSProperties = {
  background: '#ffffff',
  color: '#1f2937',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: '16px 20px',
  marginBottom: 16,
}
const pre: CSSProperties = {
  background: '#0f172a',
  color: '#a5f3fc',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 13,
  minHeight: 20,
  whiteSpace: 'pre-wrap',
}
const button: CSSProperties = {
  padding: '6px 18px',
  borderRadius: 8,
  border: 'none',
  background: '#4f46e5',
  color: '#fff',
  cursor: 'pointer',
}

function DemoCard({
  index,
  title,
  desc,
  state,
  onRun,
  children,
}: {
  index: number
  title: string
  desc: string
  state: DemoState
  onRun: () => void
  children?: ReactNode
}) {
  return (
    <section style={card}>
      <h2 style={{ marginTop: 0, fontSize: 17 }}>
        {index}. {title}{' '}
        {state.ok !== null && (
          <span style={{ fontWeight: 500 }}>{state.ok ? '✅ 通过' : '❌ 未通过'}</span>
        )}
      </h2>
      <p style={{ color: '#6b7280', fontSize: 14 }}>{desc}</p>
      <button type="button" style={button} disabled={state.running} onClick={onRun}>
        {state.running ? '运行中…' : '运行验证'}
      </button>
      {children}
      {state.log.length > 0 && <pre style={pre}>{state.log.join('\n')}</pre>}
    </section>
  )
}

/** Demo 1：Canvas 绘制 + toBlob 导出 PNG */
async function runDemo1(): Promise<{ ok: boolean; log: string[]; previewUrl: string }> {
  const blob = await exportAsPng(400, 300, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 400, 300)
    grad.addColorStop(0, '#6366f1')
    grad.addColorStop(1, '#ec4899')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 400, 300)
    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.beginPath()
    ctx.arc(120, 150, 60, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#111827'
    ctx.font = '22px system-ui, sans-serif'
    ctx.fillText('PixelFlow Demo 1', 200, 158)
  })
  downloadBlob(blob, 'demo1-canvas-export.png')
  return {
    ok: blob.size > 0 && blob.type === 'image/png',
    log: [
      `✓ toBlob 成功: ${blob.type}, ${(blob.size / 1024).toFixed(1)} KB`,
      '✓ 已触发下载 demo1-canvas-export.png',
    ],
    previewUrl: URL.createObjectURL(blob),
  }
}

/** Demo 2：像素读取 + 颜色统计（已知色块图：左半红 50%，右上蓝 25%，右下绿 25%） */
async function runDemo2(): Promise<{ ok: boolean; log: string[] }> {
  const canvas = document.createElement('canvas')
  canvas.width = 200
  canvas.height = 200
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建 2D 上下文')
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(0, 0, 100, 200)
  ctx.fillStyle = '#0000ff'
  ctx.fillRect(100, 0, 100, 100)
  ctx.fillStyle = '#00ff00'
  ctx.fillRect(100, 100, 100, 100)
  const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!png) throw new Error('测试图编码失败')
  const { bitmap } = await decodeImageBlob(png)
  const pixels = await readPixels(bitmap)
  const top = countTopColors(pixels, 3)
  bitmap.close()
  const [red, blue, green] = top
  const log = top.map((s) => `✓ ${s.hex}  ${(s.proportion * 100).toFixed(1)}%`)
  const ok =
    red?.hex === '#ff0000' &&
    red.proportion > 0.45 &&
    blue?.hex === '#0000ff' &&
    blue.proportion > 0.18 &&
    green?.hex === '#00ff00' &&
    green.proportion > 0.18
  if (!ok) log.unshift(`✗ 主色统计与预期不符，期望 红50%/蓝25%/绿25%`)
  return { ok, log }
}

/** Demo 3：JPG/PNG/WebP 三种格式解码 + 不支持格式拒绝 */
async function runDemo3(): Promise<{ ok: boolean; log: string[] }> {
  const log: string[] = []
  for (const mime of ['image/png', 'image/jpeg', 'image/webp'] as const) {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法创建 2D 上下文')
    ctx.fillStyle = '#4f46e5'
    ctx.fillRect(0, 0, 64, 64)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(16, 16, 32, 32)
    const blob = await new Promise<Blob | null>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error(`toBlob 不支持 ${mime}`))), mime),
    )
    if (!blob) throw new Error(`toBlob 未产出 ${mime}`)
    const img = await decodeImageBlob(blob)
    img.bitmap.close()
    log.push(`✓ ${mime}: 解码 ${img.width}×${img.height}, ${(blob.size / 1024).toFixed(1)} KB`)
  }
  const fake = new Blob([new Uint8Array([66, 77])], { type: 'image/bmp' })
  try {
    await decodeImageBlob(fake)
    log.unshift('✗ image/bmp 未被拒绝，校验失效')
    return { ok: false, log }
  } catch (err) {
    log.push(`✓ image/bmp 正确拒绝: ${(err as Error).message}`)
  }
  return { ok: true, log }
}

export function TechDemo() {
  const [d1, setD1] = useState<DemoState>(IDLE)
  const [d2, setD2] = useState<DemoState>(IDLE)
  const [d3, setD3] = useState<DemoState>(IDLE)

  async function withState(
    set: Dispatch<SetStateAction<DemoState>>,
    run: () => Promise<{ ok: boolean; log: string[]; previewUrl?: string }>,
  ) {
    set({ running: true, ok: null, log: [] })
    try {
      const r = await run()
      set({ running: false, ok: r.ok, log: r.log, previewUrl: r.previewUrl })
    } catch (err) {
      set({ running: false, ok: false, log: [`✗ 异常: ${(err as Error).message}`] })
    }
  }

  return (
    <main style={container}>
      <h1 style={{ fontSize: 22 }}>PixelFlow Studio — Sprint 0 技术验证</h1>
      <p style={{ color: '#6b7280' }}>
        三项 Canvas/解码能力验证通过后，Sprint 1 可按统一架构实现正式功能。
      </p>

      <DemoCard
        index={1}
        title="Canvas 绘制 + toBlob 导出 PNG"
        desc="离屏绘制渐变/圆形/文字，toBlob 生成 PNG 并触发下载。"
        state={d1}
        onRun={() => withState(setD1, runDemo1)}
      >
        {d1.previewUrl && (
          <img
            src={d1.previewUrl}
            width={200}
            alt="导出预览"
            style={{ display: 'block', marginTop: 8, borderRadius: 8 }}
          />
        )}
      </DemoCard>

      <DemoCard
        index={2}
        title="像素读取 + 颜色统计"
        desc="生成已知色块图（红50%/蓝25%/绿25%）→ PNG → createImageBitmap → getImageData → 桶量化统计。"
        state={d2}
        onRun={() => withState(setD2, runDemo2)}
      />

      <DemoCard
        index={3}
        title="ImageBitmap 多格式解码 + 格式校验"
        desc="编码 JPG/PNG/WebP 三种格式并解码；BMP 应被校验拒绝。"
        state={d3}
        onRun={() => withState(setD3, runDemo3)}
      />
    </main>
  )
}
