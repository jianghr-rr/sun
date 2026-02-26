#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const WORKSPACE = path.resolve(__dirname, '..');
const CONTENT_BASE = path.join(WORKSPACE, 'apps/sun/content/mao-dazhuan');

function walk(dir) {
  const r = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) r.push(...walk(f));
    else if (e.name.endsWith('.mdx')) r.push(f);
  }
  return r;
}

const allFiles = walk(CONTENT_BASE).sort();

const nodes = [];
for (const f of allFiles) {
  const name = path.basename(f, '.mdx');
  const parts = name.match(/^(V\d+)-C(\d+)-P(\d+)$/);
  if (!parts) continue;
  nodes.push({
    id: name,
    volId: parts[1].toLowerCase(),
    chNum: parseInt(parts[2]),
    pageNum: parseInt(parts[3]),
    filePath: f
  });
}

nodes.sort((a, b) => {
  if (a.volId !== b.volId) return a.volId.localeCompare(b.volId);
  if (a.chNum !== b.chNum) return a.chNum - b.chNum;
  return a.pageNum - b.pageNum;
});

console.log(`Processing ${nodes.length} nodes`);

const EXISTING_PREV_FOR_FIRST = 'V01-C03-P0008';
const V01_C00_C03_IDS = new Set();
for (const n of nodes) {
  if (n.volId === 'v01' && n.chNum <= 3) V01_C00_C03_IDS.add(n.id);
}

let fixed = 0;
for (let i = 0; i < nodes.length; i++) {
  const n = nodes[i];
  if (V01_C00_C03_IDS.has(n.id)) continue;

  const expectedPrev = i === 0 || V01_C00_C03_IDS.has(nodes[i - 1]?.id)
    ? EXISTING_PREV_FOR_FIRST
    : nodes[i - 1].id;
  const expectedNext = i === nodes.length - 1 ? null : nodes[i + 1].id;

  let content = fs.readFileSync(n.filePath, 'utf8');
  const orig = content;

  // Fix links section
  const linksRegex = /"links":\s*\{[^}]*\}/;
  const newLinks = expectedNext !== null
    ? `"links": {\n    "prev": ${expectedPrev ? `"${expectedPrev}"` : 'null'},\n    "next": "${expectedNext}"\n  }`
    : `"links": {\n    "prev": ${expectedPrev ? `"${expectedPrev}"` : 'null'},\n    "next": null\n  }`;

  content = content.replace(linksRegex, newLinks);

  if (content !== orig) {
    fs.writeFileSync(n.filePath, content);
    fixed++;
  }
}

console.log(`Fixed links in ${fixed} files`);

// Also fix V01-C03-P0008 to ensure its next points to V01-C04-P0001
const c03p08 = path.join(CONTENT_BASE, 'v01/c03/V01-C03-P0008.mdx');
if (fs.existsSync(c03p08)) {
  let c = fs.readFileSync(c03p08, 'utf8');
  if (!c.includes('"next": "V01-C04-P0001"')) {
    c = c.replace(/"links":\s*\{[^}]*\}/, `"links": {\n    "prev": "V01-C03-P0007",\n    "next": "V01-C04-P0001"\n  }`);
    fs.writeFileSync(c03p08, c);
    console.log('Also fixed V01-C03-P0008 links');
  }
}

// Fix V01-C01-P0014 to ensure its next points to V01-C02-P0001
const c01p14 = path.join(CONTENT_BASE, 'v01/c01/V01-C01-P0014.mdx');
if (fs.existsSync(c01p14)) {
  let c = fs.readFileSync(c01p14, 'utf8');
  if (!c.includes('"next": "V01-C02-P0001"')) {
    c = c.replace(/"links":\s*\{[^}]*\}/, `"links": {\n    "prev": "V01-C01-P0013",\n    "next": "V01-C02-P0001"\n  }`);
    fs.writeFileSync(c01p14, c);
    console.log('Also fixed V01-C01-P0014 links');
  }
}
