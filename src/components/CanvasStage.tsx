/**
 * CanvasStage：预览画布容器
 *
 * 职责：
 *   - 监听 store 变化 → 调 CanvasRenderer 重绘
 *   - 画布尺寸 = 容器 clientWidth/Height（contain 模式预览）
 *   - 不持有运行时状态；全部从 store 取
 */
import { useEffect, useRef } from 'react'
import { useEditorStore } from '../store/editorStore'
import { renderToCanvas } from '../rendering/CanvasRenderer'

export function CanvasStage() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const image = useEditorStore((s) => s.image)
  const analysis = useEditorStore((s) => s.analysis)
  const templateConfig = useEditorStore((s) => s.templateConfig)
  const fitMode = useEditorStore((s) => s.editor.fitMode)
  const status = useEditorStore((s) => s.editor.status)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    if (!canvas || !wrapper) return

    let raf = 0
    const redraw = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const rect = wrapper.getBoundingClientRect()
        const w = Math.max(1, Math.floor(rect.width))
        const h = Math.max(1, Math.floor(rect.height))
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // 空状态：绘占位
        if (!image || !analysis || status === 'loading-image' || status === 'analyzing') {
          ctx.fillStyle = '#111827'
          ctx.fillRect(0, 0, w, h)
          ctx.fillStyle = '#6b7280'
          ctx.font = '16px system-ui, sans-serif'
          const msg =
            status === 'loading-image'
              ? '正在加载图片...'
              : status === 'analyzing'
                ? '正在分析主色...'
                : '请在左侧导入图片（支持 JPG/PNG/WebP）'
          ctx.fillText(msg, 24, h / 2)
          return
        }

        // 正常渲染
        const bg =
          templateConfig.templateId === 'dotSplit'
            ? (templateConfig.params as { rightBgColor?: string }).rightBgColor ?? '#6366f1'
            : '#111827'
        try {
          renderToCanvas(canvas, image, analysis, templateConfig, {
            width: w,
            height: h,
            fit: fitMode,
            background: bg,
          })
        } catch (err) {
          ctx.fillStyle = '#dc2626'
          ctx.fillRect(0, 0, w, h)
          ctx.fillStyle = '#fff'
          ctx.font = '14px system-ui, sans-serif'
          ctx.fillText(`渲染失败: ${(err as Error).message}`, 16, 24)
        }
      })
    }

    const ro = new ResizeObserver(redraw)
    ro.observe(wrapper)
    redraw()
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [image, analysis, templateConfig, fitMode, status])

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#0f172a',
        minHeight: 300,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  )
}
