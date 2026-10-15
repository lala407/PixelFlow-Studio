# PixelFlow Studio 执行计划（Execution Plan）

> 依据：《PixelFlow Studio 软件工程课程设计计划书 V1.0》
> 原则：先闭环、后增强；契约先行；本地优先；可测试、可交付。
> 本文件是「计划书 → 可执行动作」的落地版：每一步都有产出物、命令与验收点。

---

## 0. 如何使用本计划

1. 按 **里程碑 M1→M4** 顺序推进，不跳阶段。
2. 每个 Sprint 有明确的 **入口条件 / 任务清单 / 退出（验收）标准**。验收不通过不进入下一阶段。
3. **契约先行**：先冻结第 5 节的三份接口，再写第一个模板，禁止四套模板各自复制。
4. 每完成一个可运行版本就 `git commit` 并留一张截图（答辩素材）。
5. 单人执行时按顺序做；三人小组按第 8 节分工。

---

## 1. 范围冻结（先定死，避免膨胀）

| 层级 | 范围 | 执行要求 |
| --- | --- | --- |
| **P0 必须完成** | 图片导入/校验、主色提取、波点拼接(Dot Split)、Digital 1 框选+数据 UI、Digital 2 静态故障、Collage 3 种布局、PNG 导出 | 全部跑通主流程 + 基础异常处理；**是结课底线** |
| **P1 工程加分** | 实时参数、模板缩略预览、Undo/Redo、历史记录、素材分类/导入、项目保存、批量处理 | 仅在 P0 冻结后立项；体现工程能力 |
| **P2 暂缓（不做）** | 动态雪花视频导出、在线素材站/API、高级主体分割、视觉重心自动布局、复杂碰撞检测、账号/云同步 | 时间有富余才评估，**默认不做** |

**冻结规则**：每个 Sprint 开始前锁定需求，Sprint 中途不新增需求；新想法一律记入「待办池」，结束后再评定优先级。

**若周期压缩到 2 周**：只做 Dot Split + Digital 1 + 主色提取 + PNG 导出 + 基本测试；Digital 2、Collage 做简化版。

---

## 2. 环境与工程初始化（Sprint 0 第一步）

### 2.1 环境要求
- Node.js ≥ 20（LTS）、Git；编辑器建议 VS Code + ESLint/Prettier 插件。
- 目标浏览器：近期版本 Chrome / Edge（兼容性验证对象）。

### 2.2 初始化命令（在项目根目录执行）

```bash
# 1) 创建工程（当前目录已存在则用 . 作为目标，避免多套目录）
npm create vite@latest pixelflow-studio -- --template react-ts

# 2) 运行时依赖
npm i zustand zod dexie
# 可选：人脸检测（先不装也行，M1 用手动框选兜底）
npm i @mediapipe/tasks-vision

# 3) 开发/测试依赖
npm i -D vitest @vitest/coverage-v8 jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  playwright @playwright/test prettier
# 注：Vite 8 react-ts 模板自带 oxlint（`npm run lint`），无需另装 eslint；
# Prettier 负责格式化，与 oxlint 分工：lint 查问题、prettier 管格式。
```

### 2.3 目录骨架（对齐计划书 8.1）

```text
pixelflow-studio/
├─ public/assets/            # 内置贴纸/图形/纹理/演示图
├─ public/models/            # 可选本地模型
├─ src/
│  ├─ app/                   # 入口、Provider
│  ├─ components/            # 通用 UI
│  ├─ features/editor|templates|assets|projects|batch/
│  ├─ domain/models|templates|history/
│  ├─ image/import|analysis|masks|utils/
│  ├─ rendering/CanvasRenderer.ts + layers/
│  ├─ infrastructure/storage|files|models/
│  ├─ store/
│  └─ main.tsx
├─ tests/unit|component|e2e/
├─ docs/                     # 架构图、测试记录、ADR
└─ README.md
```

### 2.4 配置项（收尾）
- `tsconfig.json`：开启 `"strict": true`。
- `package.json` scripts：`dev` / `build` / `test` / `test:cov` / `lint` / `format` / `e2e`。
- `.gitignore`：`node_modules`、`dist`、`coverage`、`.playwright`。
- 首次提交：`chore: init project skeleton`

---

## 3. 里程碑总览

| 里程碑 | 对应 Sprint | 目标 | 判定标准 |
| --- | --- | --- | --- |
| **M1 工程骨架** | Sprint 0–1 | 可导入→预览→导出的最小闭环 | 最简单模板能导入、预览、导出 PNG |
| **M2 核心模板** | Sprint 2 | 四个模板均可独立运行 | 四模板各自跑通闭环 |
| **M3 工程化** | Sprint 3 | 状态可恢复、可持久化 | Undo/Redo + 项目保存/重开 |
| **M4 验收交付** | Sprint 4 | 质量达标、材料齐全 | 按验收清单演示成功 |

---

## 4. 分阶段执行清单

### Sprint 0：准备（第 1–2 天）

**任务**
- [ ] 需求冻结：确认第 1 节 P0/P1/P2 表。
- [ ] 完成第 2 节工程初始化 + 目录骨架 + lint/format/test 配置。
- [ ] 画布交互纸面原型：确定「导入区 / 画布 / 右侧参数面板 / 顶部工具栏」布局。
- [ ] 技术验证（各写 30 行最小 demo 验证，不做完整功能）：
  - [ ] Canvas 绘制 + `toBlob()` 导出 PNG；
  - [ ] 读取像素并做简单颜色统计（验证可拿到像素数据）；
  - [ ] `ImageBitmap` 解码 JPG/PNG/WebP。
- [ ] 准备测试样例集：单色图、渐变图、透明 PNG、极小图、高噪声照片、含人脸照各 1 张（存 `tests/fixtures/`，许可证明确）。

**产出**：可启动的空工程；`docs/adr/` 下 ADR-001~005 落地文件。
**退出标准**：`npm run dev` 能启动；`npm run lint`、`npm run test`（跑通 1 个示例测试）无错；样例集就位。

---

### Sprint 1：基础骨架 / 最小闭环（第 3–6 天）

**任务（按依赖顺序做）**
1. [ ] **冻结契约**（第 5 节）：`domain/models/types.ts` 定义 `LoadedImage / AnalysisResult / FaceBox / ColorSwatch / TemplateConfig / Layer / ProjectDocument / EditorState`。
2. [ ] `image/import/imageLoader.ts`：格式（JPG/PNG/WebP）、尺寸、大小校验 → `LoadedImage`。
3. [ ] `image/analysis/colorAnalyzer.ts`：缩放采样(最长边 160–256)→ 颜色量化/K-means(K=4~8)→ 占比排序 → HEX。
4. [ ] `rendering/CanvasRenderer.ts`：统一 `render(ctx, config, analysis)`，预览与导出共用同一绘制逻辑。
5. [ ] `domain/templates/contract.ts`：`TemplateDefinition` + `TemplateRegistry`（`getTemplate/listTemplates`）。
6. [ ] `components/CanvasStage.tsx`：显示画布、处理缩放/偏移（contain/cover）。
7. [ ] `features/editor/`：工具栏 + 参数面板（先做「主色提取结果展示 + 背景色选择」）。
8. [ ] `features/templates/dotSplit/`（第一个模板，最易展示）：`config.ts / schema.ts / defaults.ts / renderer.ts / index.ts`。
9. [ ] `infrastructure/files/exportAdapter.ts`：按目标尺寸重渲染 → `toBlob()` → 下载（文件名含项目名+模板名+时间戳）。
10. [ ] `store/editorStore.ts`（Zustand）：只放可序列化状态；Blob/位图用 ID 引用。

**产出**：可导入图片 → 选波点模板 → 调参数 → 导出 PNG。
**退出标准**：波点模板完成「导入—调参—预览—导出」闭环；导入失败有可读提示；导出尺寸正确。
**提交**：`feat(editor): minimal import-preview-export loop`、`feat(dot-template): seeded random layout`。

---

### Sprint 2：模板核心（第 7–13 天）

按「先易后难 + 验证架构」顺序，**每个模板都必须复用统一分析与渲染**。

**模板 A 波点拼接（完善）**
- [ ] 左右分栏比例、右栏背景色（取主色）可调。
- [ ] 波点：形状（圆/星/水滴）、数量、大小、大小差异、颜色、透明度、旋转、分布（random/grid/cluster）。
- [ ] Mask 语义明确：显示原图像素 / 主色块 / 背景色（在 schema 中显式声明「显示 or 挖空」）。
- [ ] `seed` 可复现；「重新随机」更新 seed；保存项目时保存 seed。

**模板 B Digital 1（数字监控 UI）**
- [ ] 先做**手动框选兜底**（画框/拖动/删除矩形），再接人脸检测。
- [ ] 检测框数据 `{x,y,w,h}` 基于原图像素；渲染时按比例映射到画布（处理 contain/cover 差异）。
- [ ] HUD 元素：坐标、置信度、ID、检测数量；**必须标注「视觉装饰数据」**，避免误认为身份识别。
- [ ] `FaceDetector` 异步加载模型，支持置信度阈值与关闭；模型失败不影响模板可用。

**模板 C Digital 2（Glitch / Noise）**
- [ ] 至少两种可调静态效果（如颗粒噪声 + RGB 色彩偏移），再加局部水平错位、扫描线、块状故障、边缘模糊。
- [ ] 参数：强度、噪声密度、块数量、偏移距离、色差、局部/全图模式。
- [ ] 实现用 Canvas 像素处理 / 分块绘制；高分辨率图用「缩小预览 + 导出重算」。

**模板 D Collage 自动拼贴**
- [ ] 内置素材库：贴纸/文字/图形/纹理分类；素材元数据 `id/分类/宽高比/默认缩放范围/可旋转/透明`。
- [ ] 3–5 种布局：自由散布、边缘环绕、网格错位、角落聚集、对角线。
- [ ] 「避开人脸」轻量启发式：候选点与人脸框重叠率超阈值则重采样，最多 N 次，失败则放宽阈值/用预设位；布局记录 seed 可复现。
- [ ] **不做**完整视觉重心/碰撞检测/自动设计师级布局。

**产出**：四模板各带 `config/schema/renderer/defaults/index`。
**退出标准**：四模板均能独立完成闭环；参数变化预览刷新；滑块拖动用防抖/rAF 合并不卡顿。
**提交**：`feat(digital1): bbox + hud`、`feat(digital2): glitch effects`、`feat(collage): layout presets + seed`。

---

### Sprint 3：工程加分（第 14–20 天）

- [ ] **实时参数**：全模板参数面板 + 重置默认值。
- [ ] **模板缩略预览**：用小型离屏 Canvas 渲染模板缩略图。
- [ ] **Undo/Redo**：`domain/history/HistoryManager`，不可变快照 + `{label,before,after}`；栈上限 30–50；连续拖动合并为一个事务；大图像像素结果不存副本（存参数+重渲染）。
- [ ] **历史记录**：近期项目/操作快照，可恢复。
- [ ] **素材管理**：分类、搜索、用户导入、删除、预览（`infrastructure/storage` 存 Blob）。
- [ ] **项目保存/打开**：`ProjectRepository`（Dexie）`save/load/list/delete`；`ProjectDocument` 带 `schemaVersion`；用 Zod 校验导入文件，旧版本提供迁移逻辑。
- [ ] **状态分离**：短期 UI 状态在组件/轻 store；项目状态必须可序列化。

**退出标准**：刷新页面后能重新打开项目；素材缺失有提示；Undo/Redo 覆盖参数、元素位置、布局随机化。
**提交**：`feat(history): undo/redo`、`feat(projects): indexeddb persistence`、`feat(assets): library + import`。

---

### Sprint 4：质量与交付（第 21–28 天）

- [ ] **批量处理**：`BatchProcessor` 限制并发、逐项进度与失败原因、可跳过失败项。
- [ ] **性能优化**：预览缩放、导出尺寸上限（校验最大像素面积）、`toBlob()` 替代 `toDataURL()`、避免复制完整像素数组。
- [ ] **测试补齐**（见第 6 节）：unit / component / integration / e2e。
- [ ] **人工视觉测试**：用标准样例集检查溢出、文字裁切、遮罩与检测框对齐。
- [ ] **异常与兼容**：故障注入（检测失败、存储失败、格式错误）均有可理解提示；Chrome/Edge 验证。
- [ ] **文档**：README（简介、截图、技术栈、架构图、安装、已知限制、后续计划）+ 测试报告 + ADR 汇总。
- [ ] **演示素材**：许可明确的样例图、四模板前后对比、保存/恢复演示。
- [ ] **答辩材料**：按第 7 节演示脚本演练。

**退出标准**：第 7 节验收清单全部通过；文档齐全；演示 5 分钟内跑通。

---

## 5. 接口契约冻结（最关键的先行条件）

> 这三个契约定死后，四个模板与后续功能才不会被返工。

```ts
// 1) 统一分析结果（四个模板共享，字段允许部分缺失）
type AnalysisResult = {
  imageId: string;
  imageWidth: number;
  imageHeight: number;
  dominantColors: ColorSwatch[];
  faceBoxes: FaceBox[];
  personBoxes: BoundingBox[];
  objects: DetectedObject[];
  capabilities: {
    color: "ready" | "failed";
    face: "ready" | "unavailable" | "failed";
    segmentation: "ready" | "unavailable" | "failed";
  };
  analyzedAt: number;
  version: 1;
};

// 2) 模板契约（通过注册表管理，新增模板不改主流程）
type TemplateDefinition<P = unknown> = {
  id: string;
  name: string;
  version: number;
  defaults: P;
  schema: ZodSchema<P>;
  render(ctx: RenderContext, config: TemplateConfig<P>, analysis: AnalysisResult): void;
};

// 3) 渲染上下文（渲染层无 UI 依赖，预览与导出共用）
type RenderContext = {
  context2d: CanvasRenderingContext2D;
  width: number;   // 目标画布尺寸（预览尺寸 ≠ 导出尺寸）
  height: number;
  sourceImage: LoadedImage;
  analysis: AnalysisResult;
  scale: number;   // 原图→画布缩放比例
  offsetX: number;
  offsetY: number;
};
```

**坐标规则（全局统一）**：检测/框数据一律用**原图像素坐标**；渲染时按 `(x*scale+offset)` 换算；反向换算用于手动拖拽。`contain` / `cover` 两种适配策略必须分别处理，避免框错位。

---

## 6. 测试计划（映射验收门槛）

| 层级 | 工具 | 覆盖重点 |
| --- | --- | --- |
| 单元 | Vitest | 颜色量化、颜色格式转换、seed 随机分布、坐标映射、参数边界、重叠率、Undo/Redo |
| 组件 | React Testing Library | 导入错误提示、模板切换、滑块更新、撤销重做按钮状态、项目列表交互 |
| 集成 | Vitest + Canvas mock | 分析结果进入模板、参数触发重绘、保存后加载 |
| 端到端 | Playwright | 导入→选模板→调参→导出 PNG；保存并重开项目 |
| 人工视觉 | 标准样例集 | 效果明显、不溢出、文字不裁切、遮罩/检测框对齐 |
| 性能 | Chrome Performance | 中等尺寸交互响应、分析/导出耗时、内存 |

**质量门槛（建议）**

| 指标 | 目标 | 测量 |
| --- | --- | --- |
| P0 功能通过率 | 100% | 验收清单逐项 |
| 关键纯逻辑单测覆盖率 | ≥ 70% | Vitest coverage |
| 常见格式导入成功率 | 100% | JPG/PNG/WebP 样例 |
| 固定 seed 可复现 | 相同参数+seed 布局一致 | 自动化断言 |
| 中等尺寸预览响应 | 约 100–200ms | 浏览器性能记录（注明机器/尺寸/版本） |
| 异常恢复 | 检测/存储/格式失败均有提示 | 故障注入 + 手工 |

> 性能数值是课程目标值，非全设备保证；报告中须记录测试机器、图片尺寸、浏览器版本与实际数据。

---

## 7. 验收清单与演示脚本

### 7.1 功能验收清单（对照计划书 10.2）
- [ ] 导入 JPG/PNG/WebP，失败显示原因
- [ ] 主色提取返回 ≥3 个有效颜色并用于自动配色
- [ ] 波点模板可调数量/大小/颜色/分布并导出 PNG
- [ ] 左右拼接比例与颜色可调；Mask 显示/挖空语义明确
- [ ] Digital 1 显示 ≥1 检测框或手动框，带坐标/置信度样式
- [ ] Digital 2 含 ≥2 种可调静态效果（如噪声+色彩偏移）
- [ ] Collage ≥3 种布局，固定 seed 可复现
- [ ] 参数变化预览更新；重置参数有效
- [ ] Undo/Redo 覆盖参数、元素位置、布局随机化
- [ ] 项目保存后刷新仍可重开；素材缺失有提示
- [ ] 批处理逐张显示成功/失败，不因单张失败中断
- [ ] PNG 导出尺寸正确、可打开、无空白/裁切异常
- [ ] 核心路径有自动化测试；README 能指导安装启动

### 7.2 演示脚本（约 5 分钟）
1. 首页 + 导入图片 → 强调**本地处理不上传**。
2. 统一分析：主色提取结果 + 可选人脸框与坐标。
3. 波点拼接：调数量/大小/分布/背景色 → 说明**参数化模板机制**。
4. 切换 Digital 1 / Digital 2 / Collage → 说明**四模板共用分析与渲染基础设施**。
5. Undo/Redo + 保存项目 + 刷新恢复 → 突出工程化能力。
6. 导出 PNG → 说明**预览渲染与高分辨率导出分离**。
7. 一页架构图：UI / 应用层 / 分析层 / 模板渲染层 / 本地存储关系。

**值得强调的创新点**：共享 `AnalysisResult` 的模板化设计系统；分析与渲染解耦；seed 让随机创作可保存/可撤销/可测试；预览与导出分离；本地优先架构；用优先级/迭代/测试层级/风险登记/ADR 体现软件工程方法。

---

## 8. 分工与协作（三人小组）

| 角色 | 主责 | 交付物 | 必须先约定 |
| --- | --- | --- | --- |
| 成员 A 前端与编辑器 | 工作区布局、画布交互、参数面板、模板切换、状态集成 | Editor UI、CanvasStage、状态管理 | `EditorState`、`TemplateConfig` |
| 成员 B 图像与模板 | 导入、主色提取、波点、Glitch、数字 UI 渲染 | `image/`、`rendering/`、模板 A/B/C | `RenderContext`、`AnalysisResult` |
| 成员 C 拼贴/存储/质量 | Collage、素材库、IndexedDB、项目保存、测试与文档 | 模板 D、Repository、测试报告、README | `ProjectDocument`、Asset 元数据 |

**协作规则（防止集成冲突）**
- 先写类型契约 → 小 PR → 每 1–2 天集成一次 → 禁止多人同时改核心接口。
- 分支：`main` 保持可运行；功能走 `feature/*`；PR 至少检查运行结果/测试/类型检查/变更说明。
- 提交前缀：`feat / fix / refactor / test / docs / chore`；每个里程碑打 tag（`M1`~`M4`）。

**单人执行**：严格按 Sprint 顺序，不并行开发多模板；每完成一个模板即提交并留截图。

---

## 9. 风险应对（执行版）

| 风险 | 等级 | 立即执行的动作 |
| --- | --- | --- |
| 检测模型加载慢/失败 | 高 | 模型按需加载 + **手动框选兜底**；模板不依赖检测成功 |
| 高分辨率内存高/导出失败 | 高 | 预览缩放 + 导出尺寸上限校验 + `toBlob()` + 不复制完整像素数组 |
| 四模板实现不统一 | 高 | **先冻结契约**，首个模板跑通后再扩展 |
| 范围膨胀 | 高 | P0/P1/P2 分层 + 每周冻结需求 + P2 默认不做 |
| 随机效果无法复现 | 中 | 全程保存 `seed` + 可控随机数生成器 |
| 素材版权不清 | 中 | 只用自制/许可明确素材，记录来源与许可证 |
| Canvas 跨域污染 | 中 | 内置素材与本地导入优先，外链需 CORS 检查 |
| 本地存储不足 | 中 | 控制素材大小 + 删除/清理机制 + 失败提示 |
| 协作接口变动 | 中 | 先定类型契约 + 小 PR + 定期合并 |

---

## 10. 最终交付物清单

- [ ] 可运行源代码仓库（目录清晰、安装/启动命令、环境说明）
- [ ] 软件工程文档：需求规格、概要设计、详细设计、测试计划与报告
- [ ] README（简介、截图、技术栈、架构图、安装、已知限制、后续计划）
- [ ] 测试材料：测试用例表、结果、性能数据、Bug 修复记录
- [ ] 演示素材：许可明确样例图、四模板前后对比、保存/恢复演示
- [ ] 答辩材料：背景、架构、核心算法、工程亮点、局限与规划
