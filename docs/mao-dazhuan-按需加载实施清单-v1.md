# 《毛泽东大传》按需加载实施清单（v1）

## 0. 目标

把当前“全量节点随前端打包”的模式，改成：

- 首屏只加载目录/索引（轻量元数据）
- 点击节点后再加载该节点 MDX 正文
- 连续阅读场景下预取相邻节点（next/prev）

---

## 1. 现状确认（基于当前代码）

当前关键链路：

- `apps/sun/lib/mdx-index.ts`：静态 import 了大量 `*.mdx`，并在 `mdxNodes` 内直接挂 `Component`
- `apps/sun/lib/narrative.ts`：从 `mdx-index` 直接读 `mdxNodesById` / `mdxChapterNodeIds`
- `apps/sun/hooks/useNarrative.ts`：客户端初始化后会通过 `getNodeById`、`loadChapterNodes`读节点
- `apps/sun/components/ReaderPage.tsx`：`'use client'` 页面入口，整条读取链路在客户端可达

结论：**全量 MDX 静态可达，首屏包体会偏大**，按需加载改造必要且方向正确。

---

## 2. 改造原则

1. 目录层与正文层解耦（index/meta 与 content 分离）
2. 保持节点 ID、prev/next、卷章结构不变
3. 先保证正确性，再做预取与缓存优化
4. 脚本生成优先，避免手写大量映射

---

## 3. 分阶段实施

## Phase 1：完成“点击再加载正文”（必须先做）

### 3.1 数据结构拆分

新增两类数据：

- `NodeSummary`（目录/跳转需要）
  - `id/workId/volume/chapter/title/time/order/links/map(可保留)/sources(可选)`
  - 不含 `content.Component`
- `NodeFull`
  - `NodeSummary + content.Component`

建议在 `apps/sun/types/narrative.ts` 增加新类型，不直接破坏现有 `Node` 使用点。

### 3.2 生成脚本改造

改 `scripts/build-mdx-index.js`，从“单文件全量导出”改为“拆分导出”：

1. 生成 `apps/sun/lib/mdx-index.ts`（仅索引）
   - `mdxWork`
   - `mdxNodeSummariesById`
   - `mdxChapterNodeIds`
2. 新生成 `apps/sun/lib/mdx-node-loaders.ts`（正文加载器映射）
   - `nodeLoaderById: Record<string, () => Promise<{ default: MdxComp; meta: ... }>>`
   - 每个节点对应一个 `() => import('../content/...mdx')`

注意：加载器映射里必须是静态字符串字面量 import，确保 Next 能分包。

### 3.3 narrative 层改造

改 `apps/sun/lib/narrative.ts`：

- 保留 `getWorkStructure()`（读 `mdxWork`）
- `loadChapterNodes()` 返回 `NodeSummary[]`（目录用）
- 新增 `loadNodeContent(nodeId)`：调用 `nodeLoaderById[nodeId]`
- 新增 `getNodeFullById(nodeId)`：
  - 先取 summary
  - 再按需加载 content
  - 合并为 `NodeFull`
- 增加会话缓存（`Map<string, NodeFull>`）

### 3.4 Hook 改造

改 `apps/sun/hooks/useNarrative.ts`：

- `chapterNodes` 改为 `NodeSummary[]`
- `currentNode` 改为 `NodeFull | null`
- URL 节点变化时：
  - 先快速拿 summary 校验存在性
  - 再 `await getNodeFullById(nodeId)` 加载正文
- `nextNode` 可先保留 summary（地图联动如需正文再升级）

### 3.5 组件适配

- `apps/sun/components/TableOfContents.tsx` 使用 `NodeSummary[]`（现有只用到标题/时间/ID）
- `apps/sun/components/ContentReader.tsx` 继续吃 `NodeFull`（需要 `content.Component`）

### 3.6 验收（Phase 1）

- 首屏不再加载所有 MDX 对应 chunk
- 点击目录节点时才请求目标 chunk
- 目录展开与节点切换逻辑、prev/next 不回归

---

## Phase 2：体验优化（建议紧接着做）

### 4.1 相邻节点预取

在 `useNarrative` 当前节点加载成功后，空闲时预取：

- 优先 `current.links.next`
- 可选再预取 `prev`

实现建议：

- `requestIdleCallback`（带 `setTimeout` fallback）
- 只触发加载器，不立即切换 UI
- 已在缓存中则跳过

### 4.2 缓存策略

- 会话缓存上限（例如 30~80 节点）
- 简易 LRU（超限淘汰最早未访问项）
- 避免连续阅读时重复网络/解析

### 4.3 验收（Phase 2）

- 连续“下一节”切换明显更平滑
- 重复进入已读节点基本无感加载

---

## Phase 3：工程化与可观测（可后续）

- 增加加载埋点（首屏、节点切换、chunk 加载耗时）
- 增加包体对比基线（改造前后 `next build` 分析）
- 地图数据进一步分级加载（正文优先、路线次之）

---

## 4. 文件级改动清单（执行视角）

- `scripts/build-mdx-index.js`
  - 输出结构改造（索引与加载器拆分）
- `apps/sun/lib/mdx-index.ts`
  - 仅保留结构数据与 summary 映射
- `apps/sun/lib/mdx-node-loaders.ts`（新）
  - 按节点 ID 动态 import 映射
- `apps/sun/types/narrative.ts`
  - 新增 `NodeSummary` / `NodeFull` 类型
- `apps/sun/lib/narrative.ts`
  - 新增/改造按需加载 API 与缓存
- `apps/sun/hooks/useNarrative.ts`
  - 改状态类型与加载流程，增加预取
- `apps/sun/components/TableOfContents.tsx`
  - 目录节点类型切换为 summary
- `apps/sun/components/ContentReader.tsx`
  - 保持 NodeFull 输入（必要时补空值保护）

---

## 5. 风险与规避

1. **类型改造牵连面大**  
   规避：先引入新类型，逐步替换，不一次删除旧类型。

2. **动态 import 写法不当导致无法分包**  
   规避：加载器文件由脚本生成，使用固定字面量路径。

3. **目录展开时并发请求过多**  
   规避：章节节点仍走 summary，不触发正文加载。

4. **预取过度占用带宽**  
   规避：只预取 1~2 个邻接节点，并加缓存命中判断。

---

## 6. Definition of Done（整体）

- 首屏加载不包含全量正文组件
- 目录点击触发单节点正文加载
- prev/next 与目录高亮逻辑完整可用
- 连续阅读体验不下降（开启 next 预取后更优）
- 改造后文档生成脚本仍能支持后续卷册持续新增

---

## 7. 推荐执行顺序（最小风险）

1. 先改脚本，产出新 `mdx-index` + `mdx-node-loaders`
2. 再改 `narrative.ts` 的 API（先兼容旧调用）
3. 再改 `useNarrative` 和 `TableOfContents`
4. 最后加预取和缓存上限

这样可以每一步都可运行、可回归，便于快速定位问题。

