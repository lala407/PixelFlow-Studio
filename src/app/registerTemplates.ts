/**
 * 应用启动时注册所有模板（main.tsx 调一次即可）
 */
import { TemplateRegistry } from '../domain/templates/contract'
import { dotSplitTemplate } from '../features/templates/dotSplit'

export function registerAllTemplates(): void {
  TemplateRegistry.clear()
  TemplateRegistry.register(dotSplitTemplate)
  // Sprint 2 继续注册 digital1 / digital2 / collage
}
