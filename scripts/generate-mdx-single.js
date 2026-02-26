#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const WORKSPACE = path.resolve(__dirname, '..');
const CONTENT_BASE = path.join(WORKSPACE, 'apps/sun/content/mao-dazhuan');
const TXT_FILE = path.join(WORKSPACE, '1~3.txt');

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

function convertQuotes(t) {
  return t.replace(/\u201c/g, '\u300c').replace(/\u201d/g, '\u300d');
}

function escapeAngleBrackets(t) {
  return t.replace(/</g, '\u300A').replace(/>/g, '\u300B');
}

function pageId(volId, chNum) {
  return `${volId.toUpperCase()}-C${String(chNum).padStart(2, '0')}-P0001`;
}

function makeMdx(id, volNum, chNum, title, prev, next, paras) {
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
    order: 1
  };
  const body = paras.map(p => escapeAngleBrackets(convertQuotes(p))).join('\n\n');
  return `export const meta = ${JSON.stringify(meta, null, 2)}\n\n${body}\n`;
}

// === MAIN ===
const volStarts = findVolumeStarts();
console.log('Volume starts:', volStarts.map((s, i) => `V${i + 1}@line${s + 1}`).join(', '));

const allChapters = [];

for (let vi = 0; vi < VOLUMES.length; vi++) {
  const vol = VOLUMES[vi];
  const vStart = volStarts[vi];
  const vEnd = vi < volStarts.length - 1 ? volStarts[vi + 1] : allLines.length;
  const chapters = findChapters(vStart, vEnd);
  console.log(`\n${vol.id} "${vol.title}": ${chapters.length} chapters`);

  for (const ch of chapters) {
    if (vol.num === 1 && ch.num <= 3) continue;

    const { subtitle, paragraphs } = extractContent(ch);
    const cleanSub = convertQuotes(subtitle.replace(/[\u201c\u201d""]/g, '').trim());
    const title = cleanSub || `第${ch.num}章`;
    console.log(`  ch${ch.num}: ${paragraphs.length} paragraphs | "${title.substring(0, 40)}"`);

    allChapters.push({
      volNum: vol.num, volId: vol.id, chNum: ch.num,
      paragraphs, subtitle: cleanSub, title
    });
  }
}

const EXISTING_LAST = 'V01-C03-P0008';

for (let i = 0; i < allChapters.length; i++) {
  allChapters[i].id = pageId(allChapters[i].volId, allChapters[i].chNum);
}
for (let i = 0; i < allChapters.length; i++) {
  const ch = allChapters[i];
  ch.prev = i === 0 ? EXISTING_LAST : allChapters[i - 1].id;
  ch.next = i === allChapters.length - 1 ? null : allChapters[i + 1].id;
}

let written = 0;
for (const ch of allChapters) {
  const dir = path.join(CONTENT_BASE, ch.volId, `c${String(ch.chNum).padStart(2, '0')}`);
  fs.mkdirSync(dir, { recursive: true });
  const mdx = makeMdx(ch.id, ch.volNum, ch.chNum, ch.title, ch.prev, ch.next, ch.paragraphs);
  fs.writeFileSync(path.join(dir, `${ch.id}.mdx`), mdx);
  written++;
}

console.log(`\nWrote ${written} single-page chapter MDX files`);

// Also fix the last existing page (V01-C03-P0008) to link to V01-C04-P0001
if (allChapters.length > 0) {
  const firstNewId = allChapters[0].id;
  const lastExistingFile = path.join(CONTENT_BASE, 'v01/c03/V01-C03-P0008.mdx');
  if (fs.existsSync(lastExistingFile)) {
    let content = fs.readFileSync(lastExistingFile, 'utf8');
    content = content.replace(/"next":\s*(?:"[^"]*"|null)/, `"next": "${firstNewId}"`);
    fs.writeFileSync(lastExistingFile, content);
    console.log(`Updated V01-C03-P0008 next -> ${firstNewId}`);
  }
}
