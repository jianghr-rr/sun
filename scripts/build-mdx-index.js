#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const WORKSPACE = path.resolve(__dirname, '..');
const CONTENT_BASE = path.join(WORKSPACE, 'apps/sun/content/mao-dazhuan');
const LIB_BASE = path.join(WORKSPACE, 'apps/sun/lib');
const INDEX_OUTPUT = path.join(LIB_BASE, 'mdx-index.ts');
const LOADERS_OUTPUT = path.join(LIB_BASE, 'mdx-node-loaders.ts');

function findMdxFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMdxFiles(fullPath));
    } else if (entry.name.endsWith('.mdx')) {
      results.push(fullPath);
    }
  }
  return results;
}

function parseMetaFromMdx(fileContent, filePath) {
  const metaMatch = fileContent.match(/export\s+const\s+meta\s*=\s*(\{[\s\S]*?\n\})/);
  if (!metaMatch) {
    throw new Error(`meta not found in ${filePath}`);
  }
  return new Function(`return ${metaMatch[1]}`)();
}

function toSummaryMeta(meta) {
  return {
    id: meta.id,
    workId: meta.workId,
    volume: meta.volume,
    chapter: meta.chapter,
    title: meta.title,
    time: meta.time,
    order: meta.order,
    links: meta.links,
  };
}

function parseVolumeDefs(argv) {
  const defs = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] !== '--volumeDef') continue;
    const raw = argv[i + 1];
    i++;
    if (!raw) continue;
    const parts = raw.split(',');
    const [id, num, title, subtitle, txt] = parts;
    if (!id || !num) continue;
    defs[id] = {
      id,
      number: parseInt(num, 10),
      title: title || id,
      subtitle: subtitle || undefined,
      txt: txt ? path.join(WORKSPACE, txt) : undefined,
    };
  }
  return defs;
}

function loadExistingWork() {
  if (!fs.existsSync(INDEX_OUTPUT)) return null;
  const ts = fs.readFileSync(INDEX_OUTPUT, 'utf8');
  const match = ts.match(/export\s+const\s+mdxWork:\s*Work\s*=\s*(\{[\s\S]*?\n\})/);
  if (!match) return null;
  try {
    return new Function(`return ${match[1]}`)();
  } catch {
    console.warn('Failed to parse existing mdxWork, fallback to defaults.');
    return null;
  }
}

function isPlaceholderChapterTitle(title) {
  if (!title) return true;
  return /^第\d+章$/.test(String(title).trim());
}

function normalizeDerivedTitle(raw) {
  if (!raw) return '';
  let title = String(raw).trim();
  title = title.replace(/[「」“”"]/g, '').trim();
  title = title.replace(/《([^》]{2,80})》/g, '$1').trim();
  if (title.includes('《') && !title.includes('》')) title = title.split('《')[0].trim();
  title = title.replace(/^\s*(?:话说)\s*/g, '').trim();
  title = title.replace(/^(?:\d{4}年)?\d{1,2}月\d{1,2}日/g, '').trim();
  title = title.replace(/^\d{1,2}月\d{1,2}日/g, '').trim();
  title = title.replace(/^\d{4}年(?:初|中|末|底)?/g, '').trim();
  title = title
    .replace(
      /^(?:清晨|凌晨|早晨|早上|晨|上午|中午|下午|傍晚|晚|晚上|夜里|夜间|深夜|次日|翌日|当日|当天|当晚|同日|年初|年底|年中|年末|上旬|中旬|下旬|月底|月初|早饭后|午饭后|晚饭后|饭后)[，,、\s]*/g,
      ''
    )
    .trim();
  title = title.replace(/[，,、；;:：。.!！?？]+$/g, '').trim();
  title = title.replace(/\d+$/g, '').trim();
  title = title.replace(/[《「“（(]+$/g, '').trim();
  return title;
}

function isBadDerivedTitle(title) {
  if (!title) return true;
  const s = String(title).trim();
  if (s.length < 4) return true;
  if (/^[0-9]/.test(s)) return true;
  if (/[「“]$/.test(s) || /《[^》]*$/.test(s)) return true;
  if (
    /^(上旬|中旬|下旬|上午|中午|下午|晚上|清晨|凌晨|深夜|傍晚|次日|翌日|当日|当天|当晚|同日|年初|年底|年中|年末|早饭后|午饭后|晚饭后|饭后|这一天)$/.test(
      s
    )
  ) {
    return true;
  }
  if (/^(毛泽东|周恩来|刘少奇|蒋介石|新华社)$/.test(s)) return true;
  if (/(指示|表示|认为|决定|提出|建议|宣布|批评|部署|召开|起草|发表)$/.test(s) && s.length <= 8) {
    return true;
  }
  return false;
}

const allFiles = findMdxFiles(CONTENT_BASE).sort();
const nodes = [];
const chapterInfo = {};
const MAX_TITLE_PAGES_SCAN = 6;

for (const absFile of allFiles) {
  const id = path.basename(absFile, '.mdx');
  const parsed = id.match(/^(V\d+)-C(\d+)-P(\d+)$/);
  if (!parsed) continue;

  const volId = parsed[1].toLowerCase();
  const chNum = parseInt(parsed[2], 10);
  const pageNum = parseInt(parsed[3], 10);
  const relPathFromLib = path.relative(LIB_BASE, absFile).replace(/\\/g, '/');
  const fileContent = fs.readFileSync(absFile, 'utf8');

  let meta;
  try {
    meta = parseMetaFromMdx(fileContent, absFile);
  } catch (error) {
    console.warn(`Skip ${id}: ${error.message}`);
    continue;
  }

  const summary = toSummaryMeta(meta);

  const chapterKey = `${volId}-c${String(chNum).padStart(2, '0')}`;
  if (!chapterInfo[chapterKey]) {
    chapterInfo[chapterKey] = {
      volId,
      chNum,
      nodeCount: 0,
      pageTitles: {},
    };
  }
  chapterInfo[chapterKey].nodeCount++;
  if (pageNum >= 1 && pageNum <= MAX_TITLE_PAGES_SCAN && typeof meta.title === 'string' && meta.title.trim()) {
    chapterInfo[chapterKey].pageTitles[pageNum] = meta.title.trim();
  }

  nodes.push({
    id,
    volId,
    chNum,
    pageNum,
    relPathFromLib,
    summary,
  });
}

nodes.sort((a, b) => {
  if (a.volId !== b.volId) return a.volId.localeCompare(b.volId);
  if (a.chNum !== b.chNum) return a.chNum - b.chNum;
  return a.pageNum - b.pageNum;
});

console.log(`Found ${nodes.length} MDX nodes`);

const existingWork = loadExistingWork();
const existingVolumeById = {};
const existingChapterById = {};
if (existingWork?.volumes?.length) {
  for (const volume of existingWork.volumes) {
    existingVolumeById[volume.id] = volume;
    for (const chapter of volume.chapters || []) {
      existingChapterById[chapter.id] = chapter;
    }
  }
}

const volumeDefs = parseVolumeDefs(process.argv);
const txtLinesByVolId = {};
for (const [volId, def] of Object.entries(volumeDefs)) {
  if (!def.txt) continue;
  if (!fs.existsSync(def.txt)) {
    console.warn(`TXT not found for ${volId}: ${def.txt}`);
    continue;
  }
  txtLinesByVolId[volId] = fs.readFileSync(def.txt, 'utf8').split('\n');
}

function pickDerivedChapterTitle(chapterKey) {
  const titles = chapterInfo[chapterKey]?.pageTitles || {};
  const pageNums = Object.keys(titles)
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  let firstNormalized = '';
  for (const pageNum of pageNums) {
    const normalized = normalizeDerivedTitle(titles[pageNum]);
    if (!firstNormalized && normalized) firstNormalized = normalized;
    if (!isBadDerivedTitle(normalized)) return normalized;
  }
  return firstNormalized || undefined;
}

function getChapterMeta(volId, chNum) {
  const chapterKey = `${volId}-c${String(chNum).padStart(2, '0')}`;
  const derivedTitle = pickDerivedChapterTitle(chapterKey);

  const txtLines = txtLinesByVolId[volId];
  if (txtLines) {
    const chapterRegex = new RegExp(`^第${chNum}章\\s*$`);
    const starters = ['话说', '且说', '再说', '却说', '原来'];
    for (let i = 0; i < txtLines.length; i++) {
      if (!chapterRegex.test(txtLines[i].trim())) continue;
      const parts = [];
      for (let j = i + 1; j < txtLines.length && j < i + 12; j++) {
        const line = txtLines[j].trim();
        if (!line) continue;
        if (starters.some((s) => line.startsWith(s))) break;
        parts.push(line);
      }
      const subtitle = parts.join('').replace(/[\u201c\u201d""]/g, '').trim();
      return {
        title: derivedTitle || `第${chNum}章`,
        subtitle: subtitle ? `"${subtitle}"` : undefined,
      };
    }
  }

  const existing = existingChapterById[chapterKey];
  if (existing) {
    const normalizedExisting = normalizeDerivedTitle(existing.title);
    const existingLooksBad =
      isPlaceholderChapterTitle(existing.title) ||
      isBadDerivedTitle(normalizedExisting) ||
      (normalizedExisting && normalizedExisting !== String(existing.title).trim());
    return {
      title: existingLooksBad ? derivedTitle || normalizedExisting || `第${chNum}章` : existing.title,
      subtitle: existing.subtitle,
    };
  }

  return { title: derivedTitle || `第${chNum}章`, subtitle: undefined };
}

const volIds = Array.from(new Set(Object.values(chapterInfo).map((c) => c.volId))).sort();
const volumesData = volIds
  .map((volId) => {
    const existingVol = existingVolumeById[volId];
    const def = volumeDefs[volId];
    const matched = volId.match(/^v(\d+)$/);
    const number = def?.number ?? existingVol?.number ?? (matched ? parseInt(matched[1], 10) : 0);
    const title = def?.title ?? existingVol?.title ?? volId;
    const subtitle = def?.subtitle ?? existingVol?.subtitle;

    const chapterEntries = Object.entries(chapterInfo)
      .filter(([chapterKey]) => chapterKey.startsWith(`${volId}-c`))
      .sort(([a], [b]) => a.localeCompare(b));

    const chapters = chapterEntries.map(([chapterKey, info]) => {
      const chapterMeta = getChapterMeta(volId, info.chNum);
      const chapter = {
        id: chapterKey,
        number: info.chNum,
        title: chapterMeta.title,
        nodeCount: info.nodeCount,
      };
      if (chapterMeta.subtitle) chapter.subtitle = chapterMeta.subtitle;
      return chapter;
    });

    return { id: volId, number, title, subtitle, chapters };
  })
  .sort((a, b) => a.number - b.number);

const nodeSummaries = nodes.map((node) => node.summary);
const chapterGroups = {};
for (const node of nodes) {
  const chapterKey = `${node.volId}-c${String(node.chNum).padStart(2, '0')}`;
  if (!chapterGroups[chapterKey]) chapterGroups[chapterKey] = [];
  chapterGroups[chapterKey].push(node.id);
}

let indexTs = `import type { Work, NodeSummary } from '../types/narrative'\n\n`;
indexTs += `export const mdxWork: Work = ${JSON.stringify(
  {
    id: 'mao-dazhuan',
    title: '毛泽东大传',
    author: '东方直心',
    description: '全面记述毛泽东一生的大型传记，从韶山冲到天安门，从革命岁月到建国治国。',
    volumes: volumesData,
  },
  null,
  2
)}\n\n`;
indexTs += `export const mdxNodeSummaries: NodeSummary[] = ${JSON.stringify(nodeSummaries, null, 2)}\n\n`;
indexTs += `export const mdxNodeSummariesById: Record<string, NodeSummary> = Object.fromEntries(
  mdxNodeSummaries.map((node) => [node.id, node])
)\n\n`;
indexTs += `export const mdxChapterNodeIds: Record<string, string[]> = ${JSON.stringify(chapterGroups, null, 2)}\n`;

let loadersTs = `import type { MdxContentComponent, NodeFull, NodeSummary } from '../types/narrative'\n`;
loadersTs += `import { mdxNodeSummariesById } from './mdx-index'\n\n`;
loadersTs += `type MdxModule = {\n  default: MdxContentComponent\n  meta?: unknown\n}\n\n`;
loadersTs += `export const nodeLoaderById: Record<string, () => Promise<MdxModule>> = {\n`;
for (const node of nodes) {
  loadersTs += `  '${node.id}': () => import('./${node.relPathFromLib}'),\n`;
}
loadersTs += `}\n\n`;
loadersTs += `export async function loadNodeFullById(nodeId: string): Promise<NodeFull | undefined> {\n`;
loadersTs += `  const summary = mdxNodeSummariesById[nodeId]\n`;
loadersTs += `  if (!summary) return undefined\n`;
loadersTs += `  const loader = nodeLoaderById[nodeId]\n`;
loadersTs += `  if (!loader) return undefined\n`;
loadersTs += `  const mod = await loader()\n`;
loadersTs += `  const moduleMeta = (mod.meta || {}) as Partial<NodeSummary>\n`;
loadersTs += `  return {\n`;
loadersTs += `    ...summary,\n`;
loadersTs += `    ...moduleMeta,\n`;
loadersTs += `    content: { type: 'mdx', Component: mod.default },\n`;
loadersTs += `  }\n`;
loadersTs += `}\n`;

fs.writeFileSync(INDEX_OUTPUT, indexTs);
fs.writeFileSync(LOADERS_OUTPUT, loadersTs);
console.log(`Wrote ${INDEX_OUTPUT} (${indexTs.length} bytes)`);
console.log(`Wrote ${LOADERS_OUTPUT} (${loadersTs.length} bytes)`);
