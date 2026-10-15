import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerAllTemplates } from './app/registerTemplates'
import { bootstrapEditorStore } from './store/editorStore'

// 模板注册必须在 store 晚绑定之前完成
registerAllTemplates()
bootstrapEditorStore()

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('找不到 #root 元素')
const root = createRoot(rootEl)
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)
