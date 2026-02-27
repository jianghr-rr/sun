## 用途

把《毛泽东大传》某一卷的**原书正文**，按 `v01` 的方式生成站点可阅读的 MDX 分页节点（不是概述/总结），并接入全站导航索引与前后页跳转，同时自动补地点 `map.features`。

---

## 可直接复制给 AI 的提示词（Prompt）

```text
你是一个“把《毛泽东大传》某一卷按 v01 方式落地到站点”的代码助手。我要的不是概述，而是把**原书正文**整理成可浏览的 MDX 分页节点，并接入全站索引与前后页导航（prev/next），同时自动补地点 map.features。

### 仓库关键约定（必须遵守）
- 内容目录：`apps/sun/content/mao-dazhuan/vXX/cYY/`
- 节点文件命名：`VXX-CYY-P####.mdx`（一章多页，#### 从 0001 递增）
- 每个 MDX 顶部必须有 `export const meta = { ... }`，字段同 v01：
  - `id, workId, volume, chapter, title, time, map, transitions, links, sources, order`
- `links.prev/next` 必须全局连续：上一卷最后页 -> 本卷第一页；本卷最后页 next=null
- 索引文件：`apps/sun/lib/mdx-index.ts`（必须能让站点目录看到新卷，并能按章节分页导航）
- 地点库：`apps/sun/public/data/mao-dazhuan/geo/places.json`
- 自动补地名脚本：`scripts/annotate-places.js`（跑完会写 features/camera 并更新 places.json）

### 你的任务（按顺序完成，不能只给计划）
1) **从文本生成 MDX**：读取 `<VOLUME_TXT>`（例如 `5.txt`）
   - 以原文里的 `第N章` 为章切分（保留 1..N 章）
   - 每章按字数分页（参考目标：每页约 1200 字，最小 400 字；太短页并入上一页）
   - 每页标题 `meta.title`（很重要，影响“章节下的小标题/目录可读性”）：
     - **先粗生成**：可以先从该页前几段抽取一个候选标题（去掉“话说/且说/再说/却说/原来”等开头）
     - **再统一优化（必须做）**：用“事件概述”风格重算标题，避免突兀与无信息量的时间碎片（例如“中午/下旬/11月5日/10时许/这一天/早饭后/不久前/就在这期间…”）
       - 优先模式：`人物/机构 + 动作 + 对象`（如“毛泽东致电林彪 / 中共中央发布… / 新华社发表…”）
       - 文献名：只有在**确实是**“发表/起草/通过《…》”时才使用；禁止留下“《…（未闭合）”或被截断的《文献名》
       - 长度：建议控制在 **8~18 字**，必要时截断，但不能留下开引号/开书名号
   - `sources.loc` 统一写 `第N章`，`sources.title` 写 `毛泽东大传 第X卷`
   - 先把 `map.features` 留空也可以（后面会自动标注）

2) **串 prev/next**
   - 我会给你 `<PREV_LAST_NODE_ID>`（上一卷最后节点）
   - 你要把 `<PREV_LAST_NODE_ID>` 的 `links.next` 指向本卷第一页
   - 本卷内所有页按顺序互相 prev/next

3) **重建索引/目录**
   - 让 `apps/sun/lib/mdx-index.ts` 包含新卷 vXX 的所有节点 import、nodeModules、mdxChapterNodeIds
   - `mdxWork.volumes` 里新增 vXX：title/subtitle/chapters/nodeCount 都正确
   - 章节 subtitle：从 txt 中每章标题下、正文“话说/且说...”之前的引号句抽取（若没有就留空）
   - 章节 title（“大章节标题”）必须可读：
     - 目录 UI 会显示成 `第N章 ${chapter.title}`，所以 **chapter.title 不能还是“第N章”**，否则会出现“第N章 第N章”
     - 推荐：用该章第 1 页（或前几页）优化后的 `meta.title` 作为章标题的来源，并过滤“时间碎片/过短/未闭合书名号”等坏标题

3.5) **标题优化脚本（建议直接跑）**
   - 生成完 MDX 后，跑一遍节点标题重算（只改 `meta.title`，不改正文）：
     - `node scripts/retitle-mdx-nodes.js --vol vXX --maxScanParas 10 --maxTitleLen 18`
   - 然后**再重建索引**（让章标题也跟着变好）：
     - `node scripts/build-mdx-index.js --volumeDef "vXX,<卷号>,<卷名>,<时间范围>,<VOLUME_TXT>"`

4) **自动补地点信息**
   - 运行 `scripts/annotate-places.js`，让新卷页面的 `meta.map.features` 自动填好（primary/context），并更新 `places.json`
   - 如果某页匹配不到地点允许 features 为空

5) **自检**
   - 抽查：第一章第一页、中间一页、最后一章最后一页，确认 meta/links/正文都正确
   - 抽查目录可读性：
     - **章标题**不要出现“第N章 第N章”、不要出现“《…（未闭合）/10时许/早饭后/这一天”这类
     - **章下节点标题**（展开后的小标题）应是“事件概述”而不是时间碎片
   - 跑一次 lints（至少覆盖你改过/新增的脚本、`mdx-index.ts`、places.json）

### 输出
- 直接在仓库里生成/修改文件并确保可用
- 最后用要点列出：生成了多少页、章数、上一卷如何接入、places.json 新增多少地点

### 现在开始（我会替换这些变量）
- 卷号：<XX>
- 卷名：<VOLUME_TITLE>
- 时间范围：<VOLUME_SUBTITLE>
- 输入文本：<VOLUME_TXT>（如 5.txt）
- 上一卷最后节点：<PREV_LAST_NODE_ID>（如 V04-C70-P0018）
```

---

## 变量填法（最小替换模板）

把 Prompt 最后一段替换成类似这样（示例：做第 5 卷）：

```text
- 卷号：05
- 卷名：<你写>
- 时间范围：<你写>
- 输入文本：5.txt
- 上一卷最后节点：V04-C70-P0018
```

