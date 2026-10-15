/**
 * Dot Split 模板入口
 * TemplateDefinition 实例，在应用启动时由 TemplateRegistry.register() 注册
 */
import type { TemplateDefinition } from '../../../domain/models/types'
import { dotSplitDefaults, dotSplitSchema } from './config'
import type { DotSplitParams } from './config'
import { renderDotSplit } from './renderer'

export const dotSplitTemplate: TemplateDefinition<DotSplitParams> = {
  id: 'dotSplit',
  name: '波点拼接 (Dot Split)',
  version: 1,
  description: '左右分栏：左侧原图 + 右侧波点叠加',
  defaults: dotSplitDefaults,
  schema: dotSplitSchema,
  render(ctx, config) {
    renderDotSplit(ctx, config)
  },
}
