import { Toolbar } from '../features/editor/Toolbar'
import { CanvasStage } from '../components/CanvasStage'
import { InspectorPanel } from '../features/editor/InspectorPanel'

const shell: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  background: '#0f172a',
}

const body: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
}

export function EditorShell() {
  return (
    <div style={shell}>
      <Toolbar />
      <div style={body}>
        <CanvasStage />
        <InspectorPanel />
      </div>
    </div>
  )
}
