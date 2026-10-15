/**
 * 编辑器状态（Zustand）
 *
 * 规则：
 *   - 只放**可序列化**状态（JSON-safe）
 *   - Blob / Bitmap / 模型实例 等运行时资源不进 store，用 imageId / 外部 ref 管理
 *   - 模板配置、seed 全部可序列化
 *
 * 注意：templateConfig 在首次被访问时才初始化（lazy），
 *       确保 registerAllTemplates() 已经执行过。
 */
import { create } from 'zustand'
import type {
  AnalysisResult,
  EditorState,
  LoadedImage,
  TemplateConfig,
  TemplateId,
} from '../domain/models/types'
import { PROJECT_SCHEMA_VERSION } from '../domain/models/types'
import { TemplateRegistry } from '../domain/templates/contract'
import { randomSeed } from '../image/utils/random'

interface EditorStore {
  image: LoadedImage | null
  analysis: AnalysisResult | null
  templateConfig: TemplateConfig
  editor: EditorState
  projectName: string
  schemaVersion: number

  // -------- Actions --------
  setImage: (img: LoadedImage | null) => void
  setAnalysis: (r: AnalysisResult | null) => void
  setTemplateId: (id: TemplateId) => void
  updateParams: <P>(patch: Partial<P>) => void
  setSeed: (seed: number) => void
  rerandomize: () => void
  setProjectName: (name: string) => void
  setStatus: (s: EditorState['status'], msg?: string) => void
  setFitMode: (mode: EditorState['fitMode']) => void
}

const initialEditor: EditorState = {
  status: 'idle',
  activeTemplateId: null,
  fitMode: 'contain',
  viewMode: 'preview',
  selectedLayerId: null,
  hasSelection: false,
  ui: { inspectorCollapsed: false, templatePanelCollapsed: false, zoom: 1, panX: 0, panY: 0 },
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  image: null,
  analysis: null,
  // 关键：不直接调 makeDefaultConfig()，留一个 placeholder，
  // 确保 create() 调用时不会因为 TemplateRegistry 还空着而崩溃
  templateConfig: {
    templateId: 'dotSplit',
    version: 1,
    seed: 0,
    params: {},
  } as TemplateConfig,
  editor: { ...initialEditor, activeTemplateId: 'dotSplit' },
  projectName: '未命名项目',
  schemaVersion: PROJECT_SCHEMA_VERSION,

  setImage: (img) => {
    if (!img) {
      set({ image: null, analysis: null, editor: { ...get().editor, status: 'idle', errorMessage: undefined } })
      return
    }
    set({ image: img, editor: { ...get().editor, status: 'analyzing', errorMessage: undefined } })
  },

  setAnalysis: (r) => {
    const current = get()
    if (r) {
      if (current.templateConfig.templateId === 'dotSplit' && r.capabilities.color === 'ready') {
        const topColor = r.dominantColors[0]?.hex
        if (topColor) {
          set({
            analysis: r,
            templateConfig: {
              ...current.templateConfig,
              params: { ...(current.templateConfig.params as object), rightBgColor: topColor },
            } as TemplateConfig,
            editor: { ...current.editor, status: 'ready' },
          })
          return
        }
      }
    }
    set({ analysis: r, editor: { ...current.editor, status: r ? 'ready' : 'error' } })
  },

  setTemplateId: (id) => {
    const current = get()
    const t = TemplateRegistry.get(id)
    if (!t) return
    set({
      templateConfig: {
        templateId: id,
        version: t.version,
        seed: randomSeed(),
        params: { ...(t.defaults as Record<string, unknown>) },
      },
      editor: { ...current.editor, activeTemplateId: id },
    })
  },

  updateParams: <P>(patch: Partial<P>) => {
    const current = get()
    set({
      templateConfig: {
        ...current.templateConfig,
        params: { ...(current.templateConfig.params as object), ...patch } as unknown,
      } as TemplateConfig,
    })
  },

  setSeed: (seed) => {
    set({ templateConfig: { ...get().templateConfig, seed } })
  },

  rerandomize: () => {
    set({ templateConfig: { ...get().templateConfig, seed: randomSeed() } })
  },

  setProjectName: (projectName) => set({ projectName }),

  setStatus: (status, message) => {
    const current = get()
    set({ editor: { ...current.editor, status, errorMessage: message } })
  },

  setFitMode: (fitMode) => {
    const current = get()
    set({ editor: { ...current.editor, fitMode } })
  },
}))

/** 应用启动后调用一次，用正确的模板 defaults 替换 store 初始值 */
export function bootstrapEditorStore(): void {
  const t = TemplateRegistry.get('dotSplit')
  if (!t) return
  useEditorStore.setState({
    templateConfig: {
      templateId: 'dotSplit',
      version: t.version,
      seed: randomSeed(),
      params: { ...(t.defaults as Record<string, unknown>) },
    },
  })
}
