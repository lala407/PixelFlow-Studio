/**
 * 工具栏：导入 / 模板切换 / 重新随机 / 导出
 *
 * 导出结果直接渲染到页面上（状态条），不依赖 DevTools，
 * 便于在内嵌预览环境里定位「点了没下载」的问题。
 */
import { useCallback, useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { loadFromFile } from '../../image/import/imageLoader'
import { analyzeColor } from '../../image/analysis/colorAnalyzer'
import { TemplateRegistry } from '../../domain/templates/contract'
import { exportAndDownload } from '../../infrastructure/files/exportAdapter'
import type { ExportResult } from '../../infrastructure/files/exportAdapter'

const toolbar: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 16px',
  background: '#1f2937',
  borderBottom: '1px solid #374151',
}

const btn: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 6,
  border: 'none',
  background: '#4f46e5',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 13,
}

const btnGhost: React.CSSProperties = { ...btn, background: '#374151' }

const statusBar: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '6px 16px',
  fontSize: 12,
  borderBottom: '1px solid #374151',
}

const statusTone: Record<ExportPhase, React.CSSProperties> = {
  idle: { background: '#1f2937', color: '#9ca3af' },
  working: { background: '#374151', color: '#fbbf24' },
  ok: { background: '#064e3b', color: '#a7f3d0' },
  error: { background: '#7f1d1d', color: '#fecaca' },
}

const link: React.CSSProperties = { color: '#93c5fd', textDecoration: 'underline', cursor: 'pointer' }

type ExportPhase = 'idle' | 'working' | 'ok' | 'error'

interface ExportState {
  phase: ExportPhase
  message: string
  result?: ExportResult
}

const select: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  background: '#374151',
  color: '#fff',
  border: '1px solid #4b5563',
  fontSize: 13,
}

export function Toolbar() {
  const templateConfig = useEditorStore((s) => s.templateConfig)
  const image = useEditorStore((s) => s.image)
  const analysis = useEditorStore((s) => s.analysis)
  const setImage = useEditorStore((s) => s.setImage)
  const setAnalysis = useEditorStore((s) => s.setAnalysis)
  const setTemplateId = useEditorStore((s) => s.setTemplateId)
  const rerandomize = useEditorStore((s) => s.rerandomize)
  const projectName = useEditorStore((s) => s.projectName)
  const setStatus = useEditorStore((s) => s.setStatus)
  const editorStatus = useEditorStore((s) => s.editor.status)
  const errorMessage = useEditorStore((s) => s.editor.errorMessage)
  const [exportState, setExportState] = useState<ExportState>({ phase: 'idle', message: '' })

  const onFile = useCallback(
    async (file: File) => {
      try {
        const loaded = await loadFromFile(file)
        setImage(loaded)
        const result = await analyzeColor(loaded)
        setAnalysis(result)
      } catch (err) {
        setStatus('error', (err as Error).message)
      }
    },
    [setImage, setAnalysis, setStatus],
  )

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/webp'
    input.onchange = () => {
      const f = input.files?.[0]
      if (f) onFile(f)
    }
    input.click()
  }

  const handleExport = async () => {
    if (!image || !analysis) {
      setExportState({
        phase: 'error',
        message: '请先导入图片（支持 JPG/PNG/WebP），分析完成后再导出',
      })
      return
    }
    const w = Math.max(image.width, 1200)
    const h = Math.max(image.height, 900)
    setExportState({ phase: 'working', message: `正在渲染 ${w}×${h} 导出画布…` })
    const t0 = performance.now()
    try {
      const result = await exportAndDownload({
        source: image,
        analysis,
        config: templateConfig,
        outputWidth: w,
        outputHeight: h,
        background: '#111827',
        projectName,
      })
      const ms = Math.round(performance.now() - t0)
      setExportState({
        phase: 'ok',
        message: `已生成 ${result.filename}（${result.width}×${result.height}，${(result.bytes / 1024).toFixed(0)} KB，耗时 ${ms} ms）`,
        result,
      })
    } catch (err) {
      setExportState({ phase: 'error', message: `导出失败：${(err as Error).message}` })
    }
  }

  const templates = TemplateRegistry.list()
  const hasImage = !!image && !!analysis

  // 状态条始终可见：优先展示导出结果，否则展示编辑器当前状态
  let barPhase: ExportPhase
  let barMessage: string
  if (exportState.phase !== 'idle') {
    barPhase = exportState.phase
    barMessage = exportState.message
  } else if (editorStatus === 'error') {
    barPhase = 'error'
    barMessage = `导入失败：${errorMessage ?? '未知错误'}`
  } else if (!image) {
    barPhase = 'idle'
    barMessage = '请先导入图片（支持 JPG/PNG/WebP）'
  } else if (editorStatus === 'analyzing' || !analysis) {
    barPhase = 'working'
    barMessage = '正在分析主色…'
  } else {
    barPhase = 'ok'
    barMessage = `图片已就绪：${image.filename} · ${image.width}×${image.height}，可调参后导出`
  }

  return (
    <>
      <header style={toolbar}>
        <strong style={{ color: '#f3f4f6' }}>PixelFlow Studio</strong>
        <button type="button" style={btn} onClick={handleImport}>
          📥 导入图片
        </button>
        <select
          style={select}
          value={templateConfig.templateId}
          onChange={(e) => setTemplateId(e.target.value as never)}
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button type="button" style={btnGhost} disabled={!hasImage} onClick={rerandomize}>
          🎲 重新随机
        </button>
        <button
          type="button"
          style={btn}
          disabled={exportState.phase === 'working'}
          onClick={handleExport}
        >
          {exportState.phase === 'working' ? '⏳ 导出中…' : '💾 导出 PNG'}
        </button>
        <span style={{ flex: 1 }} />
        <span style={{ color: '#9ca3af', fontSize: 12 }}>
          seed: {templateConfig.seed.toString(16).slice(0, 8)}
        </span>
      </header>

      <div style={{ ...statusBar, ...statusTone[barPhase] }}>
        <span>
          {barPhase === 'working' ? '⏳' : barPhase === 'ok' ? '✅' : barPhase === 'error' ? '❌' : 'ℹ️'}{' '}
          {barMessage}
        </span>
        {exportState.result && (
          <>
            <a href={exportState.result.url} download={exportState.result.filename} style={link}>
              ⬇️ 没自动下载？点这里保存
            </a>
            <a href={exportState.result.url} target="_blank" rel="noreferrer" style={link}>
              🔍 新标签页查看
            </a>
          </>
        )}
      </div>
    </>
  )
}
