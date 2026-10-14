# PixelFlow Studio

面向照片拼贴创意设计的纯前端图片创意生成器。导入照片后自动生成艺术拼贴：波点拼接、数字监控 UI、故障艺术、素材拼贴四大模板，全流程本地处理，图片不上传。

> 软件工程课程设计项目。详细设计见 [docs/](docs/)，执行计划见仓库根目录《执行计划.md》。

## 技术栈

React 19 · TypeScript (strict) · Vite 8 · Zustand · Zod · Dexie (IndexedDB) · Canvas 2D · Vitest · Playwright · oxlint + Prettier

## 快速开始

```bash
npm install        # 安装依赖
npm run dev        # 启动开发服务器（http://localhost:5173）
npm run test       # 单元测试（Vitest）
npm run test:cov   # 覆盖率
npm run e2e        # 端到端测试（Playwright）
npm run lint       # oxlint 检查
npm run build      # 生产构建
npm run fixtures   # 重新生成测试样例集（程序自绘，CC0）
```

## 当前进度

- [x] Sprint 0：工程骨架、技术验证 demo、测试样例集、ADR 决策记录、画布交互原型
- [ ] Sprint 1（进行中）：契约冻结 + 最小闭环（导入 → 波点模板 → 导出 PNG）
- [ ] Sprint 2：四模板全部跑通
- [ ] Sprint 3：Undo/Redo、项目持久化、素材库
- [ ] Sprint 4：批量处理、测试补齐、验收交付

## 架构

UI 层（React）→ 应用层（Zustand 状态）→ 分析层（统一 `AnalysisResult`）→ 模板渲染层（Canvas 2D，预览与导出共用渲染逻辑）→ 本地存储（IndexedDB）。关键决策记录见 [docs/adr/](docs/adr/)。

## 已知限制

- 人脸检测未接入（M1 用手动框选兜底）
- 视频导出暂缓（静态 PNG 优先，见 ADR-005）
