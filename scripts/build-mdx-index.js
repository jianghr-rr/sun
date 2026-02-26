#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const WORKSPACE = path.resolve(__dirname, '..');
const CONTENT_BASE = path.join(WORKSPACE, 'apps/sun/content/mao-dazhuan');
const OUTPUT = path.join(WORKSPACE, 'apps/sun/lib/mdx-index.ts');

const glob = require('path');

function findMdxFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...findMdxFiles(full));
    else if (e.name.endsWith('.mdx')) results.push(full);
  }
  return results;
}

const allFiles = findMdxFiles(CONTENT_BASE).sort();

const nodes = [];
for (const f of allFiles) {
  const name = path.basename(f, '.mdx');
  const rel = path.relative(path.join(WORKSPACE, 'apps/sun/lib'), f).replace(/\\/g, '/');
  const parts = name.match(/^(V\d+)-C(\d+)-P(\d+)$/);
  if (!parts) continue;
  const volId = parts[1].toLowerCase();
  const chNum = parseInt(parts[2]);
  const pageNum = parseInt(parts[3]);
  nodes.push({ id: name, volId, chNum, pageNum, relPath: rel, varName: name.replace(/-/g, '_') });
}

nodes.sort((a, b) => {
  if (a.volId !== b.volId) return a.volId.localeCompare(b.volId);
  if (a.chNum !== b.chNum) return a.chNum - b.chNum;
  return a.pageNum - b.pageNum;
});

console.log(`Found ${nodes.length} MDX nodes`);

// Read chapter info from MDX meta for volume/chapter defs
// We need to know: volume titles, chapter titles/subtitles/nodeCounts
const volumeInfo = {};
const chapterInfo = {};

for (const n of nodes) {
  const content = fs.readFileSync(path.join(CONTENT_BASE, n.volId, `c${String(n.chNum).padStart(2, '0')}`, `${n.id}.mdx`), 'utf8');
  const metaMatch = content.match(/export\s+const\s+meta\s*=\s*(\{[\s\S]*?\n\})/);
  if (metaMatch) {
    try {
      const meta = new Function(`return ${metaMatch[1]}`)();
      const chKey = `${n.volId}-c${String(n.chNum).padStart(2, '0')}`;
      if (!chapterInfo[chKey]) {
        chapterInfo[chKey] = { volId: n.volId, chNum: n.chNum, nodeCount: 0 };
      }
      chapterInfo[chKey].nodeCount++;
    } catch (e) {}
  }
}

// Build chapter titles from existing mdxWork or generate defaults
const EXISTING_CHAPTERS = {
  'v01-c00': { title: '引子', subtitle: undefined },
  'v01-c01': { title: '韶山冲与毛氏家族', subtitle: '"大宋天子赵匡胤说过：有钱龟孙不讲理！"' },
  'v01-c02': { title: '孩儿立志出乡关', subtitle: '"学不成名誓不还"' },
  'v01-c03': { title: '身入异乡为异客', subtitle: '"我们学堂里取了一名建国才！"' },
};

// Read subtitles from the text file for new chapters
const txtContent = fs.readFileSync(path.join(WORKSPACE, '1~3.txt'), 'utf8');
const txtLines = txtContent.split('\n');

// Find chapter subtitles
function getChapterSubtitle(volNum, chNum) {
  const key = `v${String(volNum).padStart(2, '0')}-c${String(chNum).padStart(2, '0')}`;
  if (EXISTING_CHAPTERS[key]) return EXISTING_CHAPTERS[key];

  // Search in txt file for this chapter
  const volHeaders = ['第一卷', '第二卷', '第三卷'];
  let volStart = 0;
  for (let i = 0; i < txtLines.length; i++) {
    if (txtLines[i].trim() === volHeaders[volNum - 1]) { volStart = i; break; }
  }
  let volEnd = txtLines.length;
  if (volNum < 3) {
    for (let i = volStart + 1; i < txtLines.length; i++) {
      if (txtLines[i].trim() === volHeaders[volNum]) { volEnd = i; break; }
    }
  }

  const chRe = new RegExp(`^第${chNum}章\\s*$`);
  for (let i = volStart; i < volEnd; i++) {
    if (chRe.test(txtLines[i].trim())) {
      // Collect subtitle lines
      const parts = [];
      const starters = ['话说', '且说', '再说', '却说', '原来'];
      for (let j = i + 1; j < volEnd && j < i + 10; j++) {
        const t = txtLines[j].trim();
        if (!t) continue;
        if (starters.some(s => t.startsWith(s))) break;
        parts.push(t);
      }
      const sub = parts.join('').replace(/[\u201c\u201d""]/g, '').trim();
      return { title: `第${chNum}章`, subtitle: sub ? `"${sub}"` : undefined };
    }
  }
  return { title: `第${chNum}章`, subtitle: undefined };
}

// Build volumes array
const VOLUME_DEFS = [
  { id: 'v01', number: 1, title: '横空出世', subtitle: '1893-1918' },
  { id: 'v02', number: 2, title: '倚天抽剑', subtitle: '1918-1927' },
  { id: 'v03', number: 3, title: '战地黄花', subtitle: '1927-1935' },
];

const volumesData = VOLUME_DEFS.map(vol => {
  const chs = Object.entries(chapterInfo)
    .filter(([k]) => k.startsWith(vol.id))
    .sort(([a], [b]) => a.localeCompare(b));

  const chapters = chs.map(([chKey, info]) => {
    const sub = getChapterSubtitle(vol.number, info.chNum);
    const obj = {
      id: chKey,
      number: info.chNum,
      title: sub.title,
      nodeCount: info.nodeCount
    };
    if (sub.subtitle) obj.subtitle = sub.subtitle;
    return obj;
  });

  return {
    id: vol.id,
    number: vol.number,
    title: vol.title,
    subtitle: vol.subtitle,
    chapters
  };
});

// Generate the TypeScript file
let ts = `import type { Work, Node, MdxContentComponent } from '../types/narrative'\n\n`;

// Imports
for (const n of nodes) {
  ts += `import Node_${n.varName}, { meta as meta_Node_${n.varName} } from '${n.relPath}'\n`;
}

ts += `\ntype NodeMeta = Omit<Node, 'content'>\n\n`;

// Meta declarations
for (const n of nodes) {
  ts += `const nodeMeta_${n.varName} = meta_Node_${n.varName} as unknown as NodeMeta\n`;
}

ts += `\nconst nodeModules: { meta: NodeMeta; Component: MdxContentComponent }[] = [\n`;

// Node modules
for (const n of nodes) {
  ts += `{\n  meta: nodeMeta_${n.varName},\n  Component: Node_${n.varName},\n},\n`;
}

ts += `]\n\n`;

// mdxWork
ts += `export const mdxWork: Work = ${JSON.stringify({
  id: 'mao-dazhuan',
  title: '毛泽东大传',
  author: '东方直心',
  description: '全面记述毛泽东一生的大型传记，从韶山冲到天安门，从革命岁月到建国治国。',
  volumes: volumesData
}, null, 2)}\n\n`;

// mdxNodes
ts += `export const mdxNodes: Node[] = nodeModules.map((entry) => ({
  ...entry.meta,
  content: { type: 'mdx', Component: entry.Component },
}))\n\n`;

// mdxNodesById
ts += `export const mdxNodesById: Record<string, Node> = Object.fromEntries(
  mdxNodes.map((node) => [node.id, node])
)\n\n`;

// mdxChapterNodeIds
ts += `export const mdxChapterNodeIds: Record<string, string[]> = {\n`;
const chGroups = {};
for (const n of nodes) {
  const ck = `${n.volId}-c${String(n.chNum).padStart(2, '0')}`;
  if (!chGroups[ck]) chGroups[ck] = [];
  chGroups[ck].push(`nodeMeta_${n.varName}.id`);
}
for (const [ck, ids] of Object.entries(chGroups).sort()) {
  ts += `  '${ck}': [${ids.join(', ')}],\n`;
}
ts += `}\n`;

fs.writeFileSync(OUTPUT, ts);
console.log(`Wrote ${OUTPUT} (${ts.length} bytes, ${nodes.length} nodes)`);
