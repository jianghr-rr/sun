## Chakra UI 集成方案（Next.js App Router）

目标：在 `apps/sun` 集成 Chakra UI，并满足：
- 支持服务端渲染（SSR）
- 支持服务端组件（RSC）与客户端组件的边界
- 支持主题切换（亮色 / 暗色）

参考资料：Chakra UI 官方站点与文档入口 [chakra-ui.com](https://chakra-ui.com/)

### 一、集成策略（总体）
- **UI 框架**：使用 Chakra UI 作为基础组件库与主题系统。
- **渲染模型**：在 App Router 中使用 `ChakraProvider` 包裹 client boundary；页面默认 RSC，需要 UI 交互时拆出 client components。
- **主题方案**：采用 Chakra 的 Color Mode 机制，结合 cookie/本地存储，提供 SSR 兼容的主题初始化与切换。

### 二、依赖与安装
- 依赖（核心）：
  - `@chakra-ui/react`
  - `@emotion/react`
  - `@emotion/styled`
  - `framer-motion`
- 安装建议（pnpm）：
  - `pnpm add @chakra-ui/react @emotion/react @emotion/styled framer-motion`

### 三、目录与代码结构（建议）
- `apps/sun/app/providers.tsx`  
  - `use client`
  - 定义 ChakraProvider、ColorModeManager、主题配置。
- `apps/sun/app/layout.tsx`  
  - 仍保持为 RSC，引用 `Providers` 组件包裹 `children`。
- `apps/sun/app/theme.ts`  
  - Chakra theme（colors/typography/space/radius/semantic tokens）。
- `apps/sun/components/`  
  - 放置 Chakra-based UI 组件；多数为 client components。

### 四、SSR 与 RSC 策略
**SSR**
- Chakra UI 在 Next.js SSR 中需要 Emotion 的样式注入，Chakra 已提供对 App Router 的推荐方式：  
  - 保持 `layout.tsx` 为 RSC  
  - `Providers` 为 client component 包裹  
  - 页面内容如无交互需求可保持 RSC。

**RSC 边界**
- RSC 默认不支持 `use client` 的 Chakra hooks（如 `useColorMode`）。
- 规则：
  - **展示型**组件可保持 RSC + 纯 HTML + className。
  - **需要 Chakra 交互/状态**的组件放入 client component。
  - 通过 props 将数据从 RSC 传入 client components。

### 五、主题切换方案（亮/暗）
**推荐：Color Mode + Cookie**
- 使用 Chakra 的 `ColorModeScript` / `ColorModeManager` 思路，确保 SSR 首屏匹配主题，避免闪烁（FOUC）。
- 实现要点：
  - 在 `Providers` 中配置 `colorModeManager`，优先读取 cookie。
  - 在 `layout.tsx` 或 `Providers` 中挂载 `ColorModeScript`（若 Chakra v3 仍支持）。
  - 提供 `ThemeToggle` client 组件，使用 `useColorMode` 切换。

**可选：next-themes**
- 若需要更复杂的主题策略，可用 `next-themes` 统一管理，再与 Chakra theme 同步。

### 六、实施步骤（落地顺序）
1. **安装依赖**  
   安装 Chakra UI 与 Emotion 相关依赖。
2. **新增 `theme.ts`**  
   定义基础 token（colors, fonts, radii, space），后续逐步扩展。
3. **新增 `providers.tsx`**  
   作为 client boundary，包裹 `ChakraProvider`。
4. **更新 `layout.tsx`**  
   RSC 中引入 `Providers` 组件。
5. **主题切换组件**  
   新增 `ThemeToggle`，使用 `useColorMode` 实现切换。
6. **逐步迁移 UI**  
   先替换全局按钮/卡片，再迁移页面级 UI。

### 七、风险与注意事项
- Chakra 组件大多为 client components，注意控制 client boundary 的范围，避免整页都变成 client。
- 主题切换若未处理 SSR 读写，会出现闪烁；需确保 cookie/初始脚本策略。
- 迁移过程中注意与现有 Tailwind 样式共存（可逐步替换而非一次性迁移）。

### 八、后续可扩展
- 建立 `tokens` 与 `recipes`，抽象统一组件样式。
- 设计主题切换动画与系统主题跟随策略。
- 引入 Storybook 或 Docsify 作为组件文档。


