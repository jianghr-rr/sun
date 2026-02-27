#!/usr/bin/env node
/**
 * Split single-page v03 MDX chapters into multiple pages.
 * Usage: node scripts/split-mdx-chapters.js [startCh] [endCh]
 * Example: node scripts/split-mdx-chapters.js 18 65
 */
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '../apps/sun/content/mao-dazhuan/v03');
const BREAK_MARKERS = /^(话说|且说|话分两头|翌日|会毕|再说)/;
const TARGET_LINES = 100;
const MIN_LINES = 70;
const MAX_LINES = 130;

function extractMeta(content) {
  const match = content.match(/export const meta = (\{[\s\S]*?\n\})\s*\n/);
  if (!match) return null;
  try {
    return new Function('return ' + match[1])();
  } catch {
    return null;
  }
}

function extractContent(content) {
  const idx = content.indexOf('\n}\n\n');
  if (idx === -1) return null;
  return content.slice(idx + 4).trim();
}

function deriveTitle(firstParagraph) {
  if (!firstParagraph) return '本章内容';
  let t = firstParagraph
    .replace(/^(话说|且说|话分两头|再说)\s*/g, '')
    .replace(/^\d{4}年\d{1,2}月\d{1,2}日[，,、\s]*/g, '')
    .replace(/^\d{1,2}月\d{1,2}日[，,、\s]*/g, '')
    .trim();
  t = t.replace(/[。「」""''？！?!]+\s*$/g, '').trim();
  if (t.length <= 18) return t;
  return t.slice(0, 18);
}

function processChapter(chNum) {
  const chDir = path.join(BASE, `c${String(chNum).padStart(2, '0')}`);
  const p1Path = path.join(chDir, `V03-C${String(chNum).padStart(2, '0')}-P0001.mdx`);
  if (!fs.existsSync(p1Path)) return { ok: false, msg: 'P0001 not found' };

  const raw = fs.readFileSync(p1Path, 'utf8');
  const meta = extractMeta(raw);
  const body = extractContent(raw);
  if (!meta || !body) return { ok: false, msg: 'Parse failed' };

  const lines = body.split('\n');
  const totalLines = raw.split('\n').length;
  if (totalLines < 150) return { ok: false, msg: 'Too short' };

  const breakIndices = [0];
  for (let i = 1; i < lines.length; i++) {
    if (BREAK_MARKERS.test(lines[i].trim())) breakIndices.push(i);
  }
  breakIndices.push(lines.length);

  const splits = [];
  let idx = 0;
  while (idx < lines.length) {
    let bestEnd = Math.min(idx + TARGET_LINES, lines.length);
    const candidates = breakIndices.filter((b) => b > idx && b <= idx + MAX_LINES && b >= idx + MIN_LINES);
    if (candidates.length > 0) {
      bestEnd = candidates.reduce((a, b) => (Math.abs(b - idx - TARGET_LINES) < Math.abs(a - idx - TARGET_LINES) ? b : a));
    } else if (idx + TARGET_LINES < lines.length) {
      const fallback = breakIndices.find((b) => b > idx && b <= idx + MAX_LINES);
      if (fallback) bestEnd = fallback;
    }
    splits.push({ start: idx, end: bestEnd });
    idx = bestEnd;
  }

  if (splits.length <= 1) return { ok: false, msg: 'No split' };

  const chId = `V03-C${String(chNum).padStart(2, '0')}`;
  const numPages = splits.length;
  const lastPageId = `${chId}-P${String(numPages).padStart(4, '0')}`;

  for (let p = 0; p < numPages; p++) {
    const pageNum = p + 1;
    const prevId = p === 0 ? meta.links?.prev : `${chId}-P${String(p).padStart(4, '0')}`;
    let nextId = p === numPages - 1 ? null : `${chId}-P${String(pageNum + 1).padStart(4, '0')}`;
    const nextCh = chNum + 1;
    const nextChPath = path.join(BASE, `c${String(nextCh).padStart(2, '0')}`, `V03-C${String(nextCh).padStart(2, '0')}-P0001.mdx`);
    if (p === numPages - 1 && fs.existsSync(nextChPath)) {
      nextId = `V03-C${String(nextCh).padStart(2, '0')}-P0001`;
    }

    const chunk = lines.slice(splits[p].start, splits[p].end).join('\n');
    const firstLine = lines[splits[p].start];
    const pageMeta = JSON.parse(JSON.stringify(meta));
    pageMeta.id = `${chId}-P${String(pageNum).padStart(4, '0')}`;
    pageMeta.order = pageNum;
    pageMeta.title = deriveTitle(firstLine);
    pageMeta.links = { prev: prevId, next: nextId };

    const out = 'export const meta = ' + JSON.stringify(pageMeta, null, 2) + '\n\n' + chunk + '\n';
    const fname = `V03-C${String(chNum).padStart(2, '0')}-P${String(pageNum).padStart(4, '0')}.mdx`;
    fs.writeFileSync(path.join(chDir, fname), out, 'utf8');
  }

  const nextCh = chNum + 1;
  const nextChPath = path.join(BASE, `c${String(nextCh).padStart(2, '0')}`, `V03-C${String(nextCh).padStart(2, '0')}-P0001.mdx`);
  if (fs.existsSync(nextChPath)) {
    let nextRaw = fs.readFileSync(nextChPath, 'utf8');
    const oldPrev = nextRaw.match(/"prev"\s*:\s*"([^"]+)"/);
    if (oldPrev) {
      nextRaw = nextRaw.replace(/"prev"\s*:\s*"[^"]+"/, `"prev": "${lastPageId}"`);
      fs.writeFileSync(nextChPath, nextRaw, 'utf8');
    }
  }

  return { ok: true, pages: numPages };
}

const startCh = parseInt(process.argv[2] || '18', 10);
const endCh = parseInt(process.argv[3] || '65', 10);

console.log(`Splitting v03 c${startCh}-c${endCh}...`);
for (let ch = startCh; ch <= endCh; ch++) {
  try {
    const r = processChapter(ch);
    console.log(r.ok ? `  c${String(ch).padStart(2, '0')}: ${r.pages} pages` : `  c${String(ch).padStart(2, '0')}: ${r.msg}`);
  } catch (e) {
    console.log(`  c${String(ch).padStart(2, '0')}: ERROR ${e.message}`);
  }
}
