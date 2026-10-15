/**
 * 模板注册表（全局唯一入口）
 *
 * 新增模板流程：
 *   1. 在 src/features/templates/<id>/ 下实现 TemplateDefinition 实例
 *   2. 在此文件 import 并 register(template)
 *   3. 不改本文件外部任何调用方
 */
import type {
  AnalysisResult,
  RenderContext,
  TemplateConfig,
  TemplateDefinition,
  TemplateId,
} from '../models/types'

export class TemplateRegistry {
  private static readonly registry = new Map<TemplateId, TemplateDefinition>()

  static register<P>(template: TemplateDefinition<P>): void {
    if (this.registry.has(template.id)) {
      throw new Error(`TemplateRegistry: 模板 ${template.id} 已注册`)
    }
    const parsed = template.schema.safeParse(template.defaults)
    if (!parsed.success) {
      throw new Error(
        `TemplateRegistry: 模板 ${template.id} defaults 不符合 schema: ${parsed.error.message}`,
      )
    }
    this.registry.set(template.id, template as TemplateDefinition)
  }

  static get<P = unknown>(id: TemplateId): TemplateDefinition<P> | undefined {
    return this.registry.get(id) as TemplateDefinition<P> | undefined
  }

  static require<P = unknown>(id: TemplateId): TemplateDefinition<P> {
    const t = this.get<P>(id)
    if (!t) throw new Error(`TemplateRegistry: 模板 ${id} 未注册`)
    return t
  }

  static list(): TemplateDefinition[] {
    return [...this.registry.values()]
  }

  static ids(): TemplateId[] {
    return [...this.registry.keys()]
  }

  static clear(): void {
    this.registry.clear()
  }
}

/**
 * 执行渲染的便捷函数（内部通过 TemplateRegistry 查找模板）
 * 模板渲染不得抛出；异常时用降级处理（空绘或默认色）。
 */
export function renderTemplate(
  ctx: RenderContext,
  config: TemplateConfig,
  analysis: AnalysisResult,
): void {
  const template = TemplateRegistry.require(config.templateId)
  try {
    template.render(ctx, config, analysis)
  } catch (err) {
    console.error(`[renderTemplate] 模板 ${config.templateId} 渲染失败:`, err)
    try {
      const { context2d } = ctx
      context2d.fillStyle = '#1f2937'
      context2d.fillRect(0, 0, ctx.width, ctx.height)
      context2d.fillStyle = '#ffffff'
      context2d.font = '16px system-ui, sans-serif'
      context2d.fillText(
        `模板渲染失败，请查看控制台: ${config.templateId}`,
        16,
        Math.min(32, ctx.height / 2),
      )
    } catch {
      // 彻底兜底
    }
  }
}
