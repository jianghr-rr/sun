# Sun Reader — 设计系统 (Design System)

> 历史传记阅读器 · 3D 地图联动 · 沉浸式叙事体验

---

## 1. 产品定位与设计理念

**产品类型**: 历史传记沉浸式阅读平台 + 交互式地理叙事  
**目标用户**: 历史爱好者、研究者、中文深度阅读用户  
**核心体验**: 文字叙事 × 地理空间 的双向联动，让历史"活"起来

### 设计原则

| 原则 | 说明 |
|------|------|
| **书房感** | 深色温暖基调，营造沉浸式阅读氛围，如同在书房中翻阅古卷 |
| **克制留白** | UI 元素最小化，不与正文争夺注意力，地图与文案自然分层 |
| **双向联动** | 文中地名 → 地图聚焦，地图标记 → 文中高亮，形成闭环叙事 |
| **无障碍优先** | 高对比度文字、键盘可导航、尊重系统减弱动画偏好 |

### 推荐设计模式: Scroll-Triggered Storytelling

- 叙事驱动的阅读流，用章节进度引导用户
- 每个节点切换即为一次"翻页"，伴随地图场景变换
- 移动端简化动画，保留核心联动体验

---

## 2. 色彩系统 (Color Palette)

### 2.1 主色板 — 古卷书房 (Paper)

从暖米白到深墨棕的完整灰阶，模拟古旧纸张质感。

| Token | 色值 | 用途 | 预览 |
|-------|------|------|------|
| `paper-50` | `#FAF8F5` | 最亮背景（保留，Light Mode 可用） | ![](https://via.placeholder.com/20/FAF8F5/FAF8F5) |
| `paper-100` | `#F5F1EB` | 标题文字 / 高亮文字 | ![](https://via.placeholder.com/20/F5F1EB/F5F1EB) |
| `paper-200` | `#E8E4DF` | 正文文字（主体） | ![](https://via.placeholder.com/20/E8E4DF/E8E4DF) |
| `paper-300` | `#D4CFC8` | 次要文字 / 目录章节名 | ![](https://via.placeholder.com/20/D4CFC8/D4CFC8) |
| `paper-400` | `#B5ADA3` | 辅助文字 / 元数据 | ![](https://via.placeholder.com/20/B5ADA3/B5ADA3) |
| `paper-500` | `#8C8279` | 禁用状态 / 分隔线 | ![](https://via.placeholder.com/20/8C8279/8C8279) |
| `paper-600` | `#6B6259` | 滚动条悬停 / 边框 | ![](https://via.placeholder.com/20/6B6259/6B6259) |
| `paper-700` | `#4A4540` | 卡片边框 / 分隔线 | ![](https://via.placeholder.com/20/4A4540/4A4540) |
| `paper-800` | `#3A3632` | 阅读卡片背景 | ![](https://via.placeholder.com/20/3A3632/3A3632) |
| `paper-900` | `#2D2A26` | 侧边栏背景 | ![](https://via.placeholder.com/20/2D2A26/2D2A26) |
| `paper-950` | `#1F1C19` | 页面底色 / 最深 | ![](https://via.placeholder.com/20/1F1C19/1F1C19) |

### 2.2 强调色 — 古铜暗金 (Accent)

用于交互元素、选中状态、CTA，传达"古籍镶金"的质感。

| Token | 色值 | 用途 |
|-------|------|------|
| `accent-50` | `#FDF8E9` | 高亮背景（极浅） |
| `accent-100` | `#F9EDC4` | 高亮背景 |
| `accent-200` | `#F3DC8B` | 徽章背景 |
| `accent-300` | `#E9C55A` | 活跃文字 / 链接色 |
| `accent-400` | `#D9A83A` | 当前节点高亮 |
| `accent-500` | `#C9A45C` | 主强调色（按钮、标记） |
| `accent-600` | `#A67C3D` | 深强调色（悬停） |
| `accent-700` | `#835F2E` | 更深强调 |
| `accent-800` | `#6B4D28` | 深底强调 |
| `accent-900` | `#5A4125` | 最深强调 |

### 2.3 语义色 — 朱砂红 (Cinnabar)

保留用于错误提示与特殊标记，呼应传统朱砂印章的文化意象。

| Token | 色值 | 用途 |
|-------|------|------|
| `cinnabar-400` | `#D35F5F` | 错误信息 |
| `cinnabar-500` | `#C44D4D` | 错误状态 |
| `cinnabar-600` | `#A33D3D` | 深红标记 |

### 2.4 新增建议: 地图功能色

当前地图标记使用硬编码颜色，建议纳入设计系统统一管理：

| Token | 色值 | 用途 |
|-------|------|------|
| `marker-primary` | `#E74C3C` | 主地点标记（红） |
| `marker-context` | `#3498DB` | 上下文地点标记（蓝） |
| `marker-highlight` | `#F1C40F` | 高亮联动标记（金黄） |
| `marker-route` | `#2ECC71` | 路线起点（绿） |
| `marker-route-end` | `#E67E22` | 路线终点（橙） |

### 2.5 对比度要求

| 组合 | 对比度 | 标准 |
|------|--------|------|
| `paper-200` on `paper-800` | ~8.2:1 | WCAG AAA |
| `paper-100` on `paper-900` | ~10.5:1 | WCAG AAA |
| `paper-400` on `paper-800` | ~4.6:1 | WCAG AA |
| `accent-300` on `paper-800` | ~6.8:1 | WCAG AAA |

> 当前色板对比度优秀，保持不变。

---

## 3. 排版系统 (Typography)

### 3.1 字体族

| 角色 | 字体 | 回退链 | 场景 |
|------|------|--------|------|
| **正文** (Serif) | Noto Serif SC | Source Han Serif SC → STSong → SimSun → serif | MDX 正文、引用、段落 |
| **标题/UI** (Sans) | Noto Sans SC | Source Han Sans SC → PingFang SC → Microsoft YaHei → system-ui → sans-serif | 标题、导航、按钮、元数据 |

### 3.2 字号梯度

| 级别 | 移动端 | 桌面端 | 行高 | 用途 |
|------|--------|--------|------|------|
| Display | 1.5rem (24px) | 1.875rem (30px) | 1.3 | 作品标题 |
| H1 | 1.5rem (24px) | 1.875rem (30px) | 1.3 | 章节标题 |
| H2 | 1.25rem (20px) | 1.5rem (24px) | 1.4 | 小节标题 |
| H3 | 1.125rem (18px) | 1.25rem (20px) | 1.4 | 子标题 |
| Body | 1.125rem (18px) | 1.125rem (18px) | 2.0 | 正文段落 |
| Small | 0.875rem (14px) | 0.875rem (14px) | 1.5 | 元数据、备注 |
| XS | 0.75rem (12px) | 0.75rem (12px) | 1.4 | 来源、版号 |

### 3.3 正文排版规范

```
font-size: 1.125rem (18px)
line-height: 2.0
letter-spacing: 0.04em
text-indent: 2em （中文段落首行缩进）
text-align: justify
```

> **优化建议**: 当前 `line-height: 2.1` 略显松散，建议调整为 `2.0`，在保持中文阅读舒适度的同时提升紧凑感。

### 3.4 字体加载优化 (关键改进)

**现状问题**: 使用 `@import url(...)` 从 Google Fonts 加载字体，会阻塞渲染。

**建议**: 迁移至 `next/font` 实现零布局偏移 (zero CLS):

```tsx
// app/layout.tsx
import { Noto_Serif_SC, Noto_Sans_SC } from 'next/font/google'

const notoSerifSC = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
})

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})
```

**收益**:
- 字体文件自动 self-host，无外部请求
- 消除 FOIT/FOUT 闪烁
- 零 CLS（布局偏移）
- 构建时自动优化

---

## 4. 间距与布局 (Spacing & Layout)

### 4.1 间距基准

```
--spacing: 0.25rem (4px)
```

| 尺寸 | Token | 像素 | 用途 |
|------|-------|------|------|
| xs | `1` | 4px | 紧凑间距 |
| sm | `2` | 8px | 内联间距 |
| md | `4` | 16px | 组件内间距 |
| lg | `6` | 24px | 区块间距 |
| xl | `8` | 32px | 卡片/区域间距 |
| 2xl | `12` | 48px | 大区块间距 |

### 4.2 响应式布局

| 断点 | 宽度 | 布局描述 |
|------|------|----------|
| Mobile | < 1024px | 全屏地图 + 浮层内容卡片 + 抽屉目录 |
| Desktop | ≥ 1024px | 左侧目录 320px 固定 + 右侧内容卡片浮层 + 底层地图 |

### 4.3 层叠关系 (z-index)

**当前问题**: z-index 值分散，缺乏统一管理。

**建议**: 建立层级系统:

| 层级 | z-index | 元素 |
|------|---------|------|
| Map | `0` | Cesium 3D 地图 |
| Content | `10` | 阅读卡片、内容区 |
| Sidebar | `10` (desktop) / `50` (mobile) | 目录侧边栏 |
| Controls | `20` | 折叠按钮、路线指示器 |
| Overlay | `40` | 移动端遮罩层 |
| Drawer | `50` | 移动端抽屉 |
| Toast | `60` | 通知提示 |

### 4.4 内容区尺寸

| 属性 | 值 | 说明 |
|------|-----|------|
| 侧边栏宽度 | `w-80` (320px) | 目录宽度 |
| 内容最大宽度 | `max-w-2xl` (672px) | 正文最大宽度 |
| 正文最大宽度 | `max-w-prose` (65ch) | MDX 正文，约 65 字符宽 |
| 内容边距 | `px-8 lg:px-12` | 内容区水平内边距 |
| 卡片圆角 | `rounded-2xl` (16px) | 阅读卡片/侧边栏圆角 |
| 卡片间距 | `top-4 right-4 bottom-4` | 浮层卡片距屏幕边缘 |

---

## 5. 阴影与视觉层次 (Elevation)

| Token | 值 | 用途 |
|-------|-----|------|
| `shadow-card` | `0 4px 24px -4px rgba(0,0,0,0.3), 0 2px 8px -2px rgba(0,0,0,0.2)` | 阅读卡片、浮层按钮 |
| `shadow-soft` | `0 2px 12px -2px rgba(0,0,0,0.15)` | 次级卡片、工具提示 |

### 毛玻璃效果

| 元素 | 背景 | 模糊度 |
|------|------|--------|
| 阅读卡片 | `bg-paper-800/95` + gradient overlay | `backdrop-blur-md` |
| 侧边栏 | `bg-paper-900/95` + gradient overlay | `backdrop-blur-md` |
| 图标按钮 | `bg-paper-800/90` | `backdrop-blur-sm` |
| 路线加载提示 | `bg-paper-800/95` | `backdrop-blur-sm` |

> **优化建议**: 毛玻璃 `backdrop-blur` 在低端设备上会影响性能。建议提供 `@supports not (backdrop-filter: blur(1px))` 的降级方案，使用纯色背景替代。

---

## 6. 组件规范

### 6.1 阅读卡片 (Reader Card)

```
背景: bg-paper-800/95 + linear-gradient overlay
圆角: rounded-2xl (16px)
阴影: shadow-card
模糊: backdrop-blur-md
位置: fixed, top-4 right-4 bottom-4
最大宽度: max-w-2xl
```

### 6.2 目录侧边栏 (Sidebar)

```
背景: bg-paper-900/95 + linear-gradient overlay
宽度: w-80 (320px)
位置: fixed, left-0 top-0, h-full
移动端: transform -translate-x-full → translate-x-0 (抽屉动画)
过渡: duration-300 ease-out
```

### 6.3 地名标签 (Place Tag)

| 状态 | 样式 |
|------|------|
| 默认 | `px-2 py-0.5 rounded transition-all cursor-pointer` |
| 悬停 | `bg-paper-700/60 text-paper-200` |
| 激活 | `bg-accent-500/25 text-accent-300 ring-1 ring-accent-500/40` |

### 6.4 导航按钮 (Nav Button)

| 状态 | 样式 |
|------|------|
| 默认 | `bg-paper-700 text-paper-200 px-4 py-2 rounded-lg` |
| 悬停 | `bg-paper-600 text-paper-100` |
| 禁用 | `bg-paper-800 text-paper-500 cursor-not-allowed` |

### 6.5 目录项 (TOC Item)

| 状态 | 样式 |
|------|------|
| 默认 | `text-paper-300 hover:bg-paper-800/60 hover:text-paper-200` |
| 当前 | `bg-accent-500/15 text-accent-400 border-l-2 border-accent-500` |

### 6.6 图标按钮 (Icon Button)

```
尺寸: p-2.5 (min 44x44px 触摸目标)
圆角: rounded-lg
背景: bg-paper-800/90 backdrop-blur-sm
文字: text-paper-300
悬停: bg-paper-700 text-paper-100
```

---

## 7. 动效系统 (Motion)

### 7.1 时长规范

| 类型 | 时长 | 缓动函数 | 用途 |
|------|------|----------|------|
| 微交互 | 150-200ms | `ease-out` | 悬停、焦点、颜色变化 |
| 状态切换 | 200-300ms | `ease-out` | 卡片显隐、抽屉开合 |
| 页面过渡 | 300-500ms | `cubic-bezier(0.4, 0, 0.2, 1)` | 节点切换、地图飞行 |

### 7.2 进入动画 (Fade In)

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### 7.3 减弱动画 (关键改进)

**现状问题**: 未尊重 `prefers-reduced-motion` 系统设置。

**建议添加**:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 8. 无障碍 (Accessibility)

### 8.1 当前缺失项

| 问题 | 严重程度 | 建议 |
|------|----------|------|
| 无可见焦点样式 | 严重 | 所有交互元素添加 `focus-visible:ring-2 focus-visible:ring-accent-500/60` |
| Button 被全局 reset 覆盖 | 高 | 移除 `@layer utilities` 中对 button 的 `!important` 全局覆盖，改用更精确的选择器 |
| 未尊重减弱动画 | 高 | 添加 `prefers-reduced-motion` 媒体查询 |
| 缺少 Skip Link | 中 | 添加 "跳转到正文" 的隐藏链接 |
| 触摸目标不一致 | 中 | 确保所有可交互元素 ≥ 44×44px |
| 地图标记无键盘访问 | 中 | Cesium 标记需提供键盘导航替代方案 |

### 8.2 焦点样式规范

```css
:focus-visible {
  outline: none;
  ring-width: 2px;
  ring-color: rgba(201, 164, 92, 0.6); /* accent-500/60 */
  ring-offset: 2px;
  ring-offset-color: var(--color-paper-900);
}
```

### 8.3 语义化 HTML 建议

| 当前 | 建议 |
|------|------|
| 图标按钮缺少 `aria-label` | 已有，保持 |
| 目录 `<nav>` | 已有，保持 |
| 正文 `<article>` | 已有，保持 |
| 缺少 `<main>` landmark | 已有，保持 |
| `<aside>` 用于目录 | 已有，保持 |

---

## 9. 响应式策略

### 9.1 移动端 (< 1024px)

| 元素 | 行为 |
|------|------|
| 地图 | 全屏底层 |
| 目录 | 左侧抽屉，点击汉堡图标展开 |
| 阅读卡片 | 浮层，可折叠隐藏以查看地图 |
| 折叠按钮 | 右上角固定 |
| 菜单按钮 | 左上角固定 |

**优化建议**:
- 添加底部手势操作区：上滑展开内容、下滑收起
- 考虑卡片半屏模式（类似地图 App 的底部面板）
- 地名标签增大触摸区域至 44px

### 9.2 桌面端 (≥ 1024px)

| 元素 | 行为 |
|------|------|
| 地图 | 全屏底层 |
| 目录 | 左侧固定 320px |
| 阅读卡片 | 右侧浮层，可折叠 |
| 键盘快捷键 | ← → 翻页，Esc 折叠 |

**优化建议**:
- 目录与内容区之间考虑可拖拽分隔线
- 地图区域增加键盘快捷操作说明

### 9.3 关键断点测试清单

- [ ] 375px (iPhone SE)
- [ ] 390px (iPhone 14)
- [ ] 768px (iPad)
- [ ] 1024px (Desktop 起始)
- [ ] 1440px (标准桌面)
- [ ] 1920px (大屏桌面)

---

## 10. 性能优化建议

### 10.1 字体

| 现状 | 建议 | 收益 |
|------|------|------|
| Google Fonts `@import` | 迁移至 `next/font` | 消除外部请求，零 CLS |
| 加载全部字重 | 仅加载 400/600/700 | 减少字体文件体积 |

### 10.2 渲染

| 现状 | 建议 | 收益 |
|------|------|------|
| Cesium 始终全屏渲染 | 内容展开时降低地图帧率 | 减少 GPU 占用 |
| 目录每次渲染全部节点 | 虚拟列表 (react-window) | 大量节点时不卡顿 |
| Chakra UI 引入但少用 | 评估是否移除 | 减少 bundle 大小 |

### 10.3 动画

| 现状 | 建议 | 收益 |
|------|------|------|
| `backdrop-blur` 全局使用 | 提供 `@supports` 降级方案 | 低端设备兼容 |
| 无 `will-change` 提示 | 滑动抽屉添加 `will-change: transform` | GPU 加速 |
| Framer Motion 引入 | 评估是否仅用 CSS 动画替代 | 减少 JS 大小 |

---

## 11. 待优化清单 (Improvement Roadmap)

### 优先级 P0 (立即修复)

- [x] 添加 `focus-visible` 焦点样式到所有交互元素
- [x] 添加 `prefers-reduced-motion` 支持
- [x] 移除全局 button reset 中的 `!important` 覆盖，改用组件级样式
- [x] 迁移字体加载至 `next/font`

### 优先级 P1 (重要优化)

- [x] 统一 z-index 管理为层级变量
- [x] 地图标记颜色纳入设计 token
- [x] `backdrop-blur` 提供降级方案
- [x] 移动端底部面板交互优化（半屏/全屏切换）
- [x] 加载状态使用骨架屏替代文字

### 优先级 P2 (体验增强)

- [x] 添加键盘快捷键（翻页、目录折叠）
- [x] 阅读进度指示器
- [ ] 目录虚拟滚动（节点数量有限，暂缓）
- [ ] 评估移除 Chakra UI 减小 bundle（需评估影响范围）
- [x] 添加 Skip Link（跳转到正文）

---

## 12. 反模式清单 (Anti-Patterns to Avoid)

| 避免 | 原因 | 替代方案 |
|------|------|----------|
| 用 emoji 作为 UI 图标 | 跨平台不一致，不专业 | 使用 SVG 图标（当前已正确） |
| 过度动画 | 干扰阅读沉浸感 | 仅在状态切换时使用微动画 |
| 炫彩渐变 / AI 风格 | 与历史传记调性冲突 | 保持温暖素雅的古卷色调 |
| 移除 outline 不提供替代 | 键盘用户无法导航 | `focus-visible:ring-2` |
| `!important` 全局覆盖 | 样式难以维护和覆盖 | 使用 CSS 层级和更精确的选择器 |
| 水平滚动 | 移动端体验差 | `max-w-full overflow-x-hidden` |

---

## 13. 交付检查清单 (Pre-Delivery Checklist)

### 视觉质量
- [x] 所有图标使用 SVG（Heroicons 风格内联 SVG）
- [x] 无 emoji 用作 UI 图标
- [x] 悬停状态不引起布局偏移
- [x] 直接使用 theme token（`bg-paper-800` 而非硬编码 `#3A3632`）

### 交互
- [x] 所有可点击元素有 `cursor-pointer`
- [x] 悬停状态提供平滑视觉反馈 (150-300ms)
- [x] 焦点状态对键盘导航可见
- [x] 触摸目标 ≥ 44×44px

### 无障碍
- [x] 正文对比度 ≥ 4.5:1（当前 ~8:1，优秀）
- [x] 尊重 `prefers-reduced-motion`
- [x] 图片有 alt 文本
- [x] 语义化 HTML 结构正确

### 响应式
- [ ] 375px / 768px / 1024px / 1440px 测试通过（需手动验证）
- [x] 移动端无水平滚动
- [x] 浮层元素正确间距
- [x] 固定元素不遮挡内容

### 性能
- [x] 字体使用 `next/font` 自托管
- [x] `backdrop-blur` 有降级方案
- [x] 无不必要的连续动画
- [x] 骨架屏替代空白加载

---

*Generated with UI-UX-Pro-Max | Last updated: 2026-02-25*
