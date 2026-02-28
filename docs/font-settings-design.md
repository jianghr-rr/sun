# 字体与字号设置功能 — 实现设计文档

## 一、需求概述

在现有主题切换（换肤）功能基础上，新增**字体选择**和**字号调节**能力，统一放置在一个「外观设置」面板中，用户可自由组合主题 × 字体 × 字号。

核心原则：
- 字体文件**自托管**（放入 `public/fonts/`），不依赖 Google Fonts CDN，确保国内用户也能正常加载
- 设置持久化到 `localStorage`，刷新不丢失
- 防闪烁：在 `<head>` 内联脚本中恢复设置，避免 FOUT

---

## 二、字体方案选型

以下字体均为**开源免费**（SIL OFL 1.1 许可），适合中文长文阅读，各有风格特色：

| 字体 | 类型 | 特点 | 文件格式 | 单文件大小 (woff2) |
|---|---|---|---|---|
| **思源宋体** (Noto Serif SC) | 衬线 | 经典宋体，适合严肃长文阅读，当前默认字体 | woff2 | ~5–7 MB (Regular) |
| **霞鹜文楷** (LXGW WenKai) | 楷体 | 温润文雅，兼具手写感与可读性，极受欢迎 | woff2 | ~7 MB (Regular) |
| **思源黑体** (Noto Sans SC) | 无衬线 | 现代简洁，适合快速浏览，当前标题字体 | woff2 | ~5–7 MB (Regular) |
| **朱雀仿宋** (Zhuque Fangsong) | 仿宋 | 传统出版物风格，典雅大方 | woff2 | ~4–6 MB |

### 推荐首批上线 4 款

1. **思源宋体** — 已有，经典默认
2. **霞鹜文楷** — 文艺气质，阅读体验温润
3. **思源黑体** — 已有，现代清爽
4. **朱雀仿宋** — 传统风味，适合古籍/政论

> 后续可按需扩展更多字体，架构预留扩展性。

---

## 三、字号方案

提供 5 档字号，覆盖从小屏到大屏、从年轻到年长用户的阅读需求：

| 档位 | 标签 | 正文字号 | 行高 | 适用场景 |
|---|---|---|---|---|
| `xs` | 较小 | 15px | 1.9 | 信息密度优先 |
| `sm` | 小 | 16px | 1.95 | 紧凑阅读 |
| `md` | 标准 | 18px（默认） | 2.0 | 舒适阅读 |
| `lg` | 大 | 20px | 2.1 | 宽屏/长时间阅读 |
| `xl` | 较大 | 22px | 2.2 | 视力不佳/大屏 |

字号变化会同步调整：
- 正文段落 (`mdx-content p`, `.reading-paragraph`)
- 行高（随字号等比增加）
- 标题保持比例缩放（h1 = 正文 × 1.5, h2 = × 1.33, h3 = × 1.17）

---

## 四、架构设计

### 4.1 文件结构

```
apps/sun/
├── public/
│   └── fonts/                        # 自托管字体文件
│       ├── NotoSerifSC-Regular.woff2
│       ├── NotoSerifSC-Bold.woff2
│       ├── NotoSansSC-Regular.woff2
│       ├── NotoSansSC-Bold.woff2
│       ├── LXGWWenKai-Regular.woff2
│       ├── LXGWWenKai-Bold.woff2
│       ├── ZhuqueFangsong-Regular.woff2
│       └── font-license.txt          # 字体许可声明
├── app/
│   ├── layout.tsx                    # 移除 next/font/google，改用自托管
│   ├── globals.css                   # 新增 @font-face 声明 + 字号 CSS 变量
│   └── ...
├── hooks/
│   ├── useTheme.ts                   # 扩展：管理主题+字体+字号
│   └── ...
├── components/
│   ├── ThemeToggle.tsx → AppearanceToggle.tsx  # 重命名，入口按钮
│   ├── AppearancePanel.tsx           # 新增：外观设置面板（主题+字体+字号）
│   └── ...
└── types/
    └── appearance.ts                 # 新增：类型定义
```

### 4.2 类型定义

```typescript
// types/appearance.ts

export type ThemeId = 'neutral' | 'green'

export type FontId = 'noto-serif' | 'lxgw-wenkai' | 'noto-sans' | 'zhuque-fangsong'

export type FontSizeId = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface FontOption {
  id: FontId
  label: string           // 显示名称
  family: string          // CSS font-family 值
  category: '衬线' | '无衬线' | '楷体' | '仿宋'
  preview: string         // 预览用的示例文字
}

export interface FontSizeOption {
  id: FontSizeId
  label: string
  bodyPx: number
  lineHeight: number
}

export interface AppearanceState {
  theme: ThemeId
  font: FontId
  fontSize: FontSizeId
}
```

### 4.3 状态管理 — `useAppearance` Hook

将现有 `useTheme` 扩展为 `useAppearance`，统一管理三项设置：

```typescript
// hooks/useAppearance.ts

const STORAGE_KEY = 'appearance'

const DEFAULTS: AppearanceState = {
  theme: 'neutral',
  font: 'noto-serif',
  fontSize: 'md',
}

export function useAppearance() {
  const [state, setState] = useState<AppearanceState>(getStored)

  const setTheme = (theme: ThemeId) => { ... }
  const setFont = (font: FontId) => { ... }
  const setFontSize = (fontSize: FontSizeId) => { ... }

  // 应用到 DOM：
  // - data-theme="neutral|green"
  // - data-font="noto-serif|lxgw-wenkai|..."
  // - data-font-size="xs|sm|md|lg|xl"

  return { ...state, setTheme, setFont, setFontSize }
}
```

**DOM 属性方案**：在 `<html>` 上设置三个 `data-*` 属性，CSS 通过属性选择器匹配样式，零 JS 运行时开销。

### 4.4 CSS 方案

#### @font-face 声明（globals.css 顶部）

```css
@font-face {
  font-family: 'Noto Serif SC Local';
  src: url('/fonts/NotoSerifSC-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Noto Serif SC Local';
  src: url('/fonts/NotoSerifSC-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* ...类似声明其余字体... */
```

#### 字体切换（data-font 属性选择器）

```css
:root,
[data-font="noto-serif"] {
  --reading-font: 'Noto Serif SC Local', 'Source Han Serif SC', STSong, serif;
}

[data-font="lxgw-wenkai"] {
  --reading-font: 'LXGW WenKai', 'Kaiti SC', STKaiti, serif;
}

[data-font="noto-sans"] {
  --reading-font: 'Noto Sans SC Local', 'Source Han Sans SC', 'PingFang SC', sans-serif;
}

[data-font="zhuque-fangsong"] {
  --reading-font: 'Zhuque Fangsong', STFangsong, FangSong, serif;
}
```

在 `.mdx-content`、`body`、`.reading-paragraph` 等处引用 `var(--reading-font)`。

#### 字号切换（data-font-size 属性选择器）

```css
:root,
[data-font-size="md"] {
  --reading-size: 1.125rem;
  --reading-lh: 2.0;
}

[data-font-size="xs"] {
  --reading-size: 0.9375rem;
  --reading-lh: 1.9;
}

[data-font-size="sm"] {
  --reading-size: 1rem;
  --reading-lh: 1.95;
}

[data-font-size="lg"] {
  --reading-size: 1.25rem;
  --reading-lh: 2.1;
}

[data-font-size="xl"] {
  --reading-size: 1.375rem;
  --reading-lh: 2.2;
}
```

正文段落统一引用：

```css
.mdx-content p,
.reading-paragraph {
  font-size: var(--reading-size);
  line-height: var(--reading-lh);
}
```

### 4.5 防闪烁脚本

更新 `layout.tsx` 中的内联脚本，同时恢复三项设置：

```javascript
try {
  var a = JSON.parse(localStorage.getItem('appearance') || '{}');
  var d = document.documentElement;
  if (a.theme === 'green') d.setAttribute('data-theme', 'green');
  if (a.font) d.setAttribute('data-font', a.font);
  if (a.fontSize) d.setAttribute('data-font-size', a.fontSize);
} catch(e) {}
```

---

## 五、UI 设计

### 5.1 入口按钮

将现有 `ThemeToggle` 按钮改造为「外观设置」入口，仍使用 `icon-button` 样式类，图标改为调色板/画笔图标。点击后弹出浮层面板。

按钮位置不变：
- ReaderLayout：左上角控制按钮组（与目录菜单并排）
- HomePage：Header 右侧

### 5.2 外观设置面板（AppearancePanel）

点击入口按钮后，弹出一个小面板（Popover 风格），包含三个区域：

```
┌─────────────────────────────┐
│  外观设置                ✕  │
├─────────────────────────────┤
│                             │
│  主题                       │
│  ┌──────┐  ┌──────┐        │
│  │ ● 冷灰 │  │ ○ 墨绿 │     │
│  └──────┘  └──────┘        │
│                             │
│  字体                       │
│  ┌─────────────────────┐   │
│  │ ● 思源宋体  衬线      │   │
│  │ ○ 霞鹜文楷  楷体      │   │
│  │ ○ 思源黑体  无衬线    │   │
│  │ ○ 朱雀仿宋  仿宋      │   │
│  └─────────────────────┘   │
│                             │
│  字号                       │
│  ─(●)──────────── 标准      │
│  较小  小  标准  大  较大    │
│                             │
│  ┌─────────────────────┐   │
│  │ 预览：天地英雄气，千秋│   │
│  │ 尚凛然。              │   │
│  └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

**交互细节：**
- 面板使用 `reader-card` 样式（毛玻璃效果），与现有视觉一致
- 主题：两个色块按钮，带勾选指示
- 字体：列表选项，每项显示字体名 + 类型标签，用对应字体渲染名称
- 字号：分段控制器（5 个档位），或 slider + 刻度
- 底部预览区：实时预览当前字体+字号效果
- 点击面板外部自动关闭
- 移动端适配：面板从底部滑出（Sheet 形态），桌面端为 Popover

---

## 六、字体文件获取与部署

### 6.1 下载来源

| 字体 | 下载地址 |
|---|---|
| Noto Serif SC | https://github.com/notofonts/noto-cjk/releases (Serif) |
| Noto Sans SC | https://github.com/notofonts/noto-cjk/releases (Sans) |
| LXGW WenKai | https://github.com/lxgw/LxgwWenKai/releases |
| Zhuque Fangsong | https://github.com/nicewuranran/zhuque-fangsong/releases 或 https://github.com/nicewuranran/Zhuque-Fangsong |

### 6.2 字体子集化（可选优化）

完整的中文字体文件通常 5–10MB，可使用 `fonttools` / `glyphhanger` 做子集化：
- 方案 A：按 GB2312 常用字集裁剪（~6763 字），大幅缩小体积至 1–3MB
- 方案 B：使用 Unicode Range 分片加载（类似 Google Fonts 的做法）
- 方案 C：首期不做子集化，利用 `font-display: swap` 和 HTTP 缓存保证体验

**建议首期采用方案 C**，后续根据实际加载性能再优化。

### 6.3 缓存策略

在 `next.config.ts` 中为 `/fonts/*` 配置长期缓存头：

```typescript
async headers() {
  return [{
    source: '/fonts/:path*',
    headers: [{
      key: 'Cache-Control',
      value: 'public, max-age=31536000, immutable',
    }],
  }]
}
```

---

## 七、迁移策略（兼容现有用户）

现有用户的 `localStorage` 中存储格式为 `theme: "neutral" | "green"`（键名 `theme`）。

迁移逻辑：
```typescript
function migrateStorage(): AppearanceState {
  const legacy = localStorage.getItem('theme')
  const stored = localStorage.getItem('appearance')

  if (stored) {
    return { ...DEFAULTS, ...JSON.parse(stored) }
  }

  if (legacy && (legacy === 'neutral' || legacy === 'green')) {
    const state = { ...DEFAULTS, theme: legacy as ThemeId }
    localStorage.setItem('appearance', JSON.stringify(state))
    localStorage.removeItem('theme')
    return state
  }

  return DEFAULTS
}
```

---

## 八、实施步骤

### Phase 1：基础设施（预计 1 天）
1. 下载字体 woff2 文件，放入 `public/fonts/`
2. 创建 `types/appearance.ts` 类型定义
3. 在 `globals.css` 中添加 `@font-face` 声明
4. 在 `globals.css` 中添加 `data-font` / `data-font-size` 的 CSS 变量规则
5. 配置字体缓存头

### Phase 2：状态管理（预计 0.5 天）
1. 创建 `hooks/useAppearance.ts`（整合 useTheme）
2. 更新 `layout.tsx` 防闪烁脚本
3. 移除 `next/font/google` 依赖，改用自托管 `@font-face`
4. 迁移现有 `useTheme` 的调用点

### Phase 3：UI 组件（预计 1 天）
1. 创建 `AppearancePanel.tsx`（外观设置面板）
2. 改造 `ThemeToggle.tsx` → `AppearanceToggle.tsx`（入口按钮）
3. 更新 `ReaderLayout.tsx` 和 `HomePage.tsx` 中的引用
4. 移动端适配（底部 Sheet 形态）

### Phase 4：测试与优化
1. 验证各字体 × 主题 × 字号组合的视觉效果
2. 验证 localStorage 迁移逻辑
3. 验证防闪烁效果
4. 检查字体加载性能（Lighthouse / WebPageTest）
5. 无障碍检查（键盘导航、屏幕阅读器）

---

## 九、风险与注意事项

1. **字体文件体积**：中文字体较大（5–10MB/字重），首次访问加载时间较长。缓解方案：`font-display: swap` + 强缓存 + 后续子集化
2. **仓库体积**：字体文件会增加仓库大小约 30–50MB。可考虑 Git LFS 或 CDN 分离，但当前项目规模下可接受
3. **字体渲染差异**：不同操作系统的字体渲染引擎不同（ClearType vs Core Text），需在 Windows/macOS/移动端分别验证
4. **阅读进度兼容**：字号变化会影响滚动位置，需确保 `useReadingProgress` 的 scrollRatio 在字号切换后仍然准确
5. **标题字体**：标题（h1–h6）始终使用无衬线字体（思源黑体），不受正文字体设置影响，保持层次感
