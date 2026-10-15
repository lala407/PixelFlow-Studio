/**
 * Dot Split 模板参数定义
 * 所有参数 JSON-safe，可序列化到项目文件
 */
import { z } from 'zod'

export type DotShape = 'circle' | 'star'
export type DotDistribution = 'random' | 'grid'
export type MaskMode = 'source' | 'color' | 'background'

export interface DotSplitParams {
  /** 左右分栏比例（左栏占比，[0.2, 0.8]） */
  splitRatio: number
  /** 右栏背景色（HEX，默认取主色 0） */
  rightBgColor: string
  /** 波点形状 */
  dotShape: DotShape
  /** 波点数量 */
  dotCount: number
  /** 波点大小基准（画布百分比，[0.01, 0.15]） */
  dotSize: number
  /** 大小差异（0 表示同尺寸，[0, 0.8]） */
  dotJitter: number
  /** 波点分布 */
  distribution: DotDistribution
  /** 波点颜色策略 */
  maskMode: MaskMode
  /** 波点透明度 [0.3, 1.0] */
  dotOpacity: number
}

export const dotSplitSchema = z.object({
  splitRatio: z.number().min(0.2).max(0.8),
  rightBgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  dotShape: z.enum(['circle', 'star']),
  dotCount: z.number().int().min(1).max(5000),
  dotSize: z.number().min(0.01).max(0.15),
  dotJitter: z.number().min(0).max(0.8),
  distribution: z.enum(['random', 'grid']),
  maskMode: z.enum(['source', 'color', 'background']),
  dotOpacity: z.number().min(0.3).max(1),
})

export const dotSplitDefaults: DotSplitParams = {
  splitRatio: 0.5,
  rightBgColor: '#6366f1',
  dotShape: 'circle',
  dotCount: 120,
  dotSize: 0.04,
  dotJitter: 0.5,
  distribution: 'random',
  maskMode: 'source',
  dotOpacity: 0.85,
}
