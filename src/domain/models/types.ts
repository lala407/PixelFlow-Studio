/**
 * PixelFlow Studio 核心领域类型（全局唯一契约）
 *
 * 冻结于 Sprint 1 开始前，变更须走评审（ADR 或 PR 说明）。
 * 以下模块的类型定义以本文件为准：
 *   - image/import/imageLoader.ts        → LoadedImage
 *   - image/analysis/colorAnalyzer.ts    → ColorSwatch
 *   - rendering/CanvasRenderer.ts        → RenderContext
 *   - domain/templates/contract.ts       → TemplateDefinition / TemplateRegistry
 */
import type { ZodSchema } from 'zod'

// -------- 基础几何 --------

export interface Point {
  x: number
  y: number
}

/**
 * 轴对齐矩形，坐标语义由使用方决定：
 *   - 图像分析层：原图像素坐标
 *   - 渲染层：    画布像素坐标
 * 使用前须注释说明坐标系。
 */
export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

// -------- 图片输入 --------

export const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number]

/**
 * 已解码并校验的图片。
 * 注意：LoadedImage.bitmap 是浏览器资源，需显式调用 close() 释放；
 *       序列化到 IndexedDB 时只存 imageId + metadata，bitmap 以 Blob 形式单独存。
 */
export interface LoadedImage {
  imageId: string
  filename: string
  mimeType: SupportedMimeType
  fileSize: number
  width: number
  height: number
  /** 原图像素坐标系下的裁剪区域；未裁剪时为整图 */
  crop: BoundingBox
  /** 运行时资源，不进入序列化 */
  bitmap?: ImageBitmap
  blob?: Blob
}

// -------- 分析结果 --------

export interface ColorSwatch {
  hex: string
  r: number
  g: number
  b: number
  /** 在整个采样中的占比，[0, 1] */
  proportion: number
}

export interface FaceBox extends BoundingBox {
  confidence: number
  /** 装饰用展示 ID，不等同于真实身份 */
  displayId?: string
}

export interface DetectedObject extends BoundingBox {
  label: string
  confidence: number
}

export interface AnalysisCapabilities {
  color: 'ready' | 'failed'
  face: 'ready' | 'unavailable' | 'failed'
  segmentation: 'ready' | 'unavailable' | 'failed'
}

/**
 * 一次分析的完整输出，四个模板共享。
 * 字段允许部分缺失（见 capabilities），模板须据此降级。
 */
export interface AnalysisResult {
  imageId: string
  imageWidth: number
  imageHeight: number
  dominantColors: ColorSwatch[]
  faceBoxes: FaceBox[]
  personBoxes: BoundingBox[]
  objects: DetectedObject[]
  capabilities: AnalysisCapabilities
  analyzedAt: number
  version: 1
}

// -------- 渲染 --------

export type FitMode = 'contain' | 'cover'

/**
 * 渲染上下文。渲染层只依赖本接口，不感知 UI。
 * 预览画布与导出画布共享同一组参数：render() 在不同尺寸 ctx 上被调用。
 *
 * 坐标系约定：
 *   - sourceImage 与 analysis 用原图像素坐标
 *   - context2d 与 width/height 是当前画布坐标
 *   - scale / offsetX / offsetY 是 原图像素 → 画布像素 的正向换算
 *   - 换算公式：canvasX = imageX * scale + offsetX
 */
export interface RenderContext {
  context2d: CanvasRenderingContext2D
  width: number
  height: number
  sourceImage: LoadedImage
  analysis: AnalysisResult
  fit: FitMode
  scale: number
  offsetX: number
  offsetY: number
}

// -------- 模板 --------

export type TemplateId = 'dotSplit' | 'digital1' | 'digital2' | 'collage'

/**
 * 模板的完整配置。泛型 P 是该模板独有的参数 schema。
 * 必须可序列化（JSON-safe），以便项目保存 / 撤销重做。
 */
export interface TemplateConfig<P = unknown> {
  templateId: TemplateId
  version: number
  seed: number
  params: P
}

/**
 * 模板定义。新增模板不改主流程，只注册一个新的 TemplateDefinition。
 *
 * 约束：
 *   - defaults 必须符合 schema（用 Zod 校验）
 *   - render 不得抛出；内部异常需降级处理（如用默认色替代）
 *   - render 不持有 UI 引用；状态变化通过 TemplateConfig 传入
 */
export interface TemplateDefinition<P = unknown> {
  id: TemplateId
  name: string
  version: number
  description: string
  defaults: P
  schema: ZodSchema<P>
  render(ctx: RenderContext, config: TemplateConfig<P>, analysis: AnalysisResult): void
}

// -------- 图层（P1，当前 Sprint 仅占位） --------

export type LayerType = 'image' | 'text' | 'shape' | 'sticker' | 'mask'

export interface BaseLayer {
  id: string
  type: LayerType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  zIndex: number
  visible: boolean
}

export type Layer = BaseLayer & {
  [key: string]: unknown
}

// -------- 项目文档 --------

export const PROJECT_SCHEMA_VERSION = 1

export interface ProjectDocument {
  id: string
  name: string
  schemaVersion: number
  createdAt: number
  updatedAt: number
  sourceImage: {
    imageId: string
    filename: string
    width: number
    height: number
  }
  analysis?: AnalysisResult
  template: TemplateConfig
  layers: Layer[]
  outputSize?: { width: number; height: number }
}

// -------- 编辑器状态（运行时，非序列化） --------

export type EditorViewMode = 'preview' | 'mask' | 'split'

export interface EditorState {
  status: 'idle' | 'loading-image' | 'analyzing' | 'ready' | 'error'
  activeTemplateId: TemplateId | null
  fitMode: FitMode
  viewMode: EditorViewMode
  selectedLayerId: string | null
  hasSelection: boolean
  errorMessage?: string
  /** 仅 UI 态，不进序列化 */
  ui: {
    inspectorCollapsed: boolean
    templatePanelCollapsed: boolean
    zoom: number
    panX: number
    panY: number
  }
}
