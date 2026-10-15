/**
 * 参数面板（Sprint 1：硬编码 dotSplit 字段）
 * Sprint 2 扩展模板时按每个模板单独写 Inspector 子组件
 */
import { useEditorStore } from '../../store/editorStore'

const panel: React.CSSProperties = {
  width: 280,
  background: '#1f2937',
  color: '#e5e7eb',
  borderLeft: '1px solid #374151',
  overflowY: 'auto',
}

const rowStyle: React.CSSProperties = { padding: '10px 16px', borderBottom: '1px solid #374151' }
const labelStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 13,
  marginBottom: 4,
}

function NumberSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <div style={rowStyle}>
      <div style={labelStyle}>
        <span>{label}</span>
        <span style={{ color: '#9ca3af' }}>{value.toFixed(step < 1 ? 2 : 0)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  )
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly string[]
  onChange: (v: string) => void
}) {
  return (
    <div style={rowStyle}>
      <div style={labelStyle}>{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', padding: 4 }}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={rowStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 40, height: 28, border: 'none', background: 'transparent' }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            padding: 4,
            background: '#374151',
            color: '#fff',
            border: '1px solid #4b5563',
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  )
}

function DominantColors() {
  const analysis = useEditorStore((s) => s.analysis)
  if (!analysis || analysis.capabilities.color !== 'ready') return null
  return (
    <div style={rowStyle}>
      <div style={labelStyle}>🎨 主色提取结果</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {analysis.dominantColors.map((c) => (
          <div
            key={c.hex}
            title={`${c.hex} ${(c.proportion * 100).toFixed(1)}%`}
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: c.hex,
              border: '1px solid #4b5563',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              fontSize: 9,
              textShadow: '0 0 2px #fff',
            }}
          >
            <span style={{ color: '#000' }}>{(c.proportion * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function InspectorPanel() {
  const templateConfig = useEditorStore((s) => s.templateConfig)
  const updateParams = useEditorStore((s) => s.updateParams)

  const p = templateConfig.params as Record<string, unknown>

  return (
    <aside style={panel}>
      <h3 style={{ margin: '12px 16px', fontSize: 14, color: '#f3f4f6' }}>
        波点拼接 (Dot Split) · 参数
      </h3>
      <DominantColors />

      <NumberSlider
        label="左右分栏比例"
        value={p.splitRatio as number}
        min={0.2}
        max={0.8}
        step={0.01}
        onChange={(v) => updateParams({ splitRatio: v })}
      />

      <ColorRow
        label="右栏背景色"
        value={p.rightBgColor as string}
        onChange={(v) => updateParams({ rightBgColor: v })}
      />

      <SelectRow
        label="波点形状"
        value={p.dotShape as string}
        options={['circle', 'star']}
        onChange={(v) => updateParams({ dotShape: v })}
      />

      <NumberSlider
        label="波点数量"
        value={p.dotCount as number}
        min={10}
        max={500}
        step={1}
        onChange={(v) => updateParams({ dotCount: v })}
      />

      <NumberSlider
        label="波点大小"
        value={p.dotSize as number}
        min={0.01}
        max={0.15}
        step={0.005}
        onChange={(v) => updateParams({ dotSize: v })}
      />

      <NumberSlider
        label="大小差异"
        value={p.dotJitter as number}
        min={0}
        max={0.8}
        step={0.05}
        onChange={(v) => updateParams({ dotJitter: v })}
      />

      <SelectRow
        label="分布"
        value={p.distribution as string}
        options={['random', 'grid']}
        onChange={(v) => updateParams({ distribution: v })}
      />

      <NumberSlider
        label="透明度"
        value={p.dotOpacity as number}
        min={0.3}
        max={1}
        step={0.05}
        onChange={(v) => updateParams({ dotOpacity: v })}
      />
    </aside>
  )
}
