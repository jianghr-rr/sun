# Sun

基于 Next.js 16 构建的交互式叙事阅读平台，将《毛泽东大传》的文字内容与 CesiumJS 3D 地图深度联动——阅读到哪里，地图就飞到哪里。

## 特性

- **文-图联动**：每个叙事节点绑定地理坐标与镜头参数，阅读时地图自动飞行切换
- **MDX 内容体系**：全书按 卷 → 章 → 节点 组织，以 `.mdx` 文件承载正文与元数据
- **3D 地球**：CesiumJS 渲染全球三维地图，支持预设镜头、自动适配、路线跟随等模式
- **阅读器 UI**：目录导航、阅读进度追踪、暗色 / 亮色主题切换
- **按需加载**：节点正文懒加载 + LRU 缓存，首屏只加载索引

## 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 前端 | React 19, TypeScript 5 |
| 样式 | Tailwind CSS 4, Chakra UI 3 |
| 地图 | CesiumJS |
| 内容 | MDX 3 (@mdx-js/react + @next/mdx) |
| 动画 | Framer Motion |
| 构建 | Turborepo, pnpm Workspaces |
| 规范 | ESLint, Prettier, Commitlint, Husky |

## 项目结构

```
sun/
├── apps/
│   └── sun/                      # 主应用
│       ├── app/                   # Next.js App Router
│       ├── components/            # React 组件
│       │   ├── ReaderPage.tsx     # 阅读器入口
│       │   ├── ReaderLayout.tsx   # 阅读器布局（地图 + 目录 + 正文）
│       │   ├── ContentReader.tsx  # 正文阅读区
│       │   ├── MapViewer.tsx      # CesiumJS 地图
│       │   ├── TableOfContents.tsx# 目录导航
│       │   ├── MdxRenderer.tsx    # MDX 渲染器
│       │   └── ThemeToggle.tsx    # 主题切换
│       ├── content/               # MDX 内容
│       │   └── mao-dazhuan/
│       │       ├── v01/           # 第一卷
│       │       │   ├── c00/       # 引子
│       │       │   ├── c01/       # 第1章
│       │       │   │   ├── V01-C01-P0001.mdx
│       │       │   │   └── ...
│       │       │   └── ...
│       │       ├── v02/ ~ v05/    # 第二卷 ~ 第五卷
│       │       └── ...
│       ├── data/                  # 地理数据
│       │   └── mao-dazhuan/geo/places.json
│       ├── hooks/                 # 自定义 Hooks
│       ├── lib/                   # 工具函数与数据加载
│       ├── types/                 # TypeScript 类型定义
│       └── public/                # 静态资源
├── packages/                      # 共享包（预留）
├── turbo.json                     # Turborepo 配置
├── package.json                   # 根 package.json
└── pnpm-workspace.yaml
```

## 内容格式

每个叙事节点是一个 `.mdx` 文件，包含导出的元数据和正文：

```mdx
export const meta = {
  id: "V01-C01-P0001",
  workId: "mao-dazhuan",
  volume: 1,
  chapter: 1,
  title: "韶山地理",
  map: {
    features: [{ type: "place", placeId: "shao-feng", role: "primary" }],
    camera: { mode: "preset", lng: 112.518, lat: 27.905, height: 15000 }
  },
  links: { prev: "V01-C00-P0002", next: "V01-C01-P0002" }
}

正文内容，支持 Markdown 语法 ...
```

节点 ID 编码规则：`V{卷}-C{章}-P{序号}`，例如 `V01-C01-P0001` 表示第一卷第一章第一节。

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 9.6.0

### 安装与运行

```bash
# 克隆仓库
git clone <repo-url> && cd sun

# 安装依赖
pnpm install

# 启动开发服务器
pnpm start:sun

# 构建生产版本
pnpm build:sun
```

### 常用命令

```bash
pnpm g:lint              # 全量 ESLint 检查
pnpm deps:check          # 检查依赖更新
pnpm deps:update         # 更新依赖版本
```

## License

ISC
