#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const WORKSPACE = path.resolve(__dirname, '..');
const CONTENT_BASE = path.join(WORKSPACE, 'apps/sun/content/mao-dazhuan');
const TXT_FILE = path.join(WORKSPACE, '1~3.txt');
const TARGET_CHARS = 1200;
const MIN_CHARS = 400;

const text = fs.readFileSync(TXT_FILE, 'utf8');
const allLines = text.split('\n');

const VOLUMES = [
  { num: 1, id: 'v01', title: '横空出世', subtitle: '1893年12月——1918年6月' },
  { num: 2, id: 'v02', title: '倚天抽剑', subtitle: '1918年6月——1927年8月5日' },
  { num: 3, id: 'v03', title: '战地黄花', subtitle: '1927年8月7日——1935年10月' },
];

const CN_NUMS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

function findVolumeStarts() {
  const starts = [];
  const headers = ['第一卷', '第二卷', '第三卷'];
  for (let i = 0; i < allLines.length; i++) {
    if (headers.includes(allLines[i].trim())) starts.push(i);
  }
  return starts;
}

function findChapters(startLine, endLine) {
  const chapters = [];
  const re = /^第(\d+)章\s*$/;
  for (let i = startLine; i < endLine; i++) {
    const m = allLines[i].trim().match(re);
    if (m) chapters.push({ num: parseInt(m[1]), startLine: i });
  }
  for (let c = 0; c < chapters.length; c++) {
    chapters[c].endLine = c < chapters.length - 1 ? chapters[c + 1].startLine : endLine;
  }
  return chapters;
}

const BODY_STARTERS = ['话说', '且说', '再说', '却说', '原来'];

function extractContent(ch) {
  const lines = [];
  for (let i = ch.startLine + 1; i < ch.endLine; i++) lines.push(allLines[i]);

  const subtitleParts = [];
  let bodyIdx = 0;

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) {
      if (subtitleParts.length > 0) continue;
      continue;
    }
    if (BODY_STARTERS.some(s => t.startsWith(s))) {
      bodyIdx = i;
      break;
    }
    subtitleParts.push(t);
    bodyIdx = i + 1;
  }

  const subtitle = subtitleParts.join('').replace(/^\s+/, '');

  const paragraphs = [];
  for (let i = bodyIdx; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t) paragraphs.push(t);
  }

  while (paragraphs.length && !paragraphs[paragraphs.length - 1]) paragraphs.pop();
  return { subtitle, paragraphs };
}

function splitPages(paragraphs) {
  if (!paragraphs.length) return [['本章内容正在整理中。']];
  const pages = [];
  let cur = [];
  let chars = 0;

  for (const p of paragraphs) {
    const len = p.length;
    if (chars > 0 && chars + len > TARGET_CHARS && chars >= MIN_CHARS) {
      pages.push(cur);
      cur = [p];
      chars = len;
    } else {
      cur.push(p);
      chars += len;
    }
  }
  if (cur.length) {
    if (pages.length && chars < MIN_CHARS) {
      pages[pages.length - 1].push(...cur);
    } else {
      pages.push(cur);
    }
  }
  return pages;
}

function convertQuotes(t) {
  return t.replace(/\u201c/g, '\u300c').replace(/\u201d/g, '\u300d');
}

function makeTitle(firstPara) {
  let c = firstPara.replace(/^(话说|且说|再说|却说|正是|这正是|原来)/, '').trim();
  c = c.replace(/^在/, '').replace(/^[0-9]{4}年[0-9]*月?[0-9]*日?[，,]?/, '').trim();
  const m = c.match(/^(.{2,10}?)[，。！？、；：\u300c\u300d]/);
  return m ? m[1] : c.substring(0, 8);
}

function pageId(volId, chNum, pageNum) {
  return `${volId.toUpperCase()}-C${String(chNum).padStart(2, '0')}-P${String(pageNum).padStart(4, '0')}`;
}

function makeMdx(id, volNum, chNum, title, prev, next, order, paras) {
  const meta = {
    id, workId: 'mao-dazhuan', volume: volNum, chapter: chNum, title,
    time: null,
    map: {
      features: [], route: null,
      camera: { mode: 'preset', lng: 112.9388, lat: 28.2282, height: 20000, heading: 0, pitch: -45, durationMs: 1200 }
    },
    transitions: { enter: { fadeMs: 300, flyToMs: 1200 }, exit: { fadeMs: 200 } },
    links: { prev, next },
    sources: [{ type: 'book', title: `毛泽东大传 第${CN_NUMS[volNum]}卷`, loc: `第${chNum}章` }],
    order
  };
  const body = paras.map(convertQuotes).join('\n\n');
  return `export const meta = ${JSON.stringify(meta, null, 2)}\n\n${body}\n`;
}

// === MAIN ===
const volStarts = findVolumeStarts();
console.log('Volume starts:', volStarts.map((s, i) => `V${i + 1}@line${s + 1}`).join(', '));

const allPages = [];

for (let vi = 0; vi < VOLUMES.length; vi++) {
  const vol = VOLUMES[vi];
  const vStart = volStarts[vi];
  const vEnd = vi < volStarts.length - 1 ? volStarts[vi + 1] : allLines.length;
  const chapters = findChapters(vStart, vEnd);
  console.log(`\n${vol.id} "${vol.title}": ${chapters.length} chapters`);

  for (const ch of chapters) {
    if (vol.num === 1 && ch.num <= 3) continue;

    const { subtitle, paragraphs } = extractContent(ch);
    const pages = splitPages(paragraphs);
    console.log(`  ch${ch.num}: ${paragraphs.length} paras -> ${pages.length} pages | "${subtitle.substring(0, 30)}..."`);

    for (let pi = 0; pi < pages.length; pi++) {
      allPages.push({
        volNum: vol.num, volId: vol.id, chNum: ch.num,
        pageNum: pi + 1, totalPages: pages.length,
        paragraphs: pages[pi], subtitle
      });
    }
  }
}

const EXISTING_LAST = 'V01-C03-P0008';

for (let i = 0; i < allPages.length; i++) {
  allPages[i].id = pageId(allPages[i].volId, allPages[i].chNum, allPages[i].pageNum);
}
for (let i = 0; i < allPages.length; i++) {
  const p = allPages[i];
  p.prev = i === 0 ? EXISTING_LAST : allPages[i - 1].id;
  p.next = i === allPages.length - 1 ? null : allPages[i + 1].id;
}

let written = 0;
for (const p of allPages) {
  const dir = path.join(CONTENT_BASE, p.volId, `c${String(p.chNum).padStart(2, '0')}`);
  fs.mkdirSync(dir, { recursive: true });
  const title = convertQuotes(makeTitle(p.paragraphs[0]));
  const mdx = makeMdx(p.id, p.volNum, p.chNum, title, p.prev, p.next, p.pageNum, p.paragraphs);
  fs.writeFileSync(path.join(dir, `${p.id}.mdx`), mdx);
  written++;
}
console.log(`\nWrote ${written} MDX files`);

// Generate mdx-index.ts content
const imports = [];
const metas = [];
const modules = [];
const chNodeIds = {};

for (const p of allPages) {
  const v = p.id.replace(/-/g, '_');
  const rel = `../content/mao-dazhuan/${p.volId}/c${String(p.chNum).padStart(2, '0')}/${p.id}.mdx`;
  imports.push(`import Node_${v}, { meta as meta_Node_${v} } from '${rel}'`);
  metas.push(`const nodeMeta_${v} = meta_Node_${v} as unknown as NodeMeta`);
  modules.push(`{\n  meta: nodeMeta_${v},\n  Component: Node_${v},\n}`);

  const ck = `${p.volId}-c${String(p.chNum).padStart(2, '0')}`;
  if (!chNodeIds[ck]) chNodeIds[ck] = [];
  chNodeIds[ck].push(`nodeMeta_${v}.id`);
}

// Chapter defs for volumes array
const chDefs = {};
const seenCh = new Set();
for (const p of allPages) {
  const key = `${p.volId}-${p.chNum}`;
  if (seenCh.has(key)) continue;
  seenCh.add(key);
  if (!chDefs[p.volId]) chDefs[p.volId] = [];
  const cleanSub = p.subtitle.replace(/[\u201c\u201d""]/g, '').trim();
  chDefs[p.volId].push({
    id: `${p.volId}-c${String(p.chNum).padStart(2, '0')}`,
    number: p.chNum,
    title: `第${p.chNum}章`,
    subtitle: cleanSub ? `"${cleanSub}"` : undefined,
    nodeCount: p.totalPages
  });
}

const output = `// ============= NEW IMPORTS =============
${imports.join('\n')}

// ============= NEW META DECLARATIONS =============
${metas.join('\n')}

// ============= NEW NODE MODULE ENTRIES =============
${modules.join(',\n')}

// ============= NEW CHAPTER NODE IDS =============
${Object.entries(chNodeIds).map(([k, v]) => `  '${k}': [${v.join(', ')}],`).join('\n')}

// ============= VOLUME CHAPTER DEFINITIONS =============
${JSON.stringify(chDefs, null, 2)}
`;

fs.writeFileSync(path.join(WORKSPACE, 'generated-index-additions.txt'), output);
console.log('Wrote generated-index-additions.txt');
