#!/usr/bin/env node
/**
 * Generate MDX nodes from a single-volume TXT file.
 *
 * Example:
 *   node scripts/generate-mdx-volume.js \
 *     --input 4.txt --volId v04 --volNum 4 --bookTitle "毛泽东大传 第四卷" \
 *     --existingLastId V03-C65-P0001
 */
const fs = require('fs')
const path = require('path')

const WORKSPACE = path.resolve(__dirname, '..')
const CONTENT_BASE = path.join(WORKSPACE, 'apps/sun/content/mao-dazhuan')

function parseArgs(argv) {
  const args = {}
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) continue
    const key = a.slice(2)
    const val = argv[i + 1]
    if (!val || val.startsWith('--')) {
      args[key] = true
    } else {
      args[key] = val
      i++
    }
  }
  return args
}

const args = parseArgs(process.argv)
const inputRel = args.input
if (!inputRel) {
  console.error('Missing --input <txt>')
  process.exit(1)
}

const volId = args.volId || 'v04'
const volNum = parseInt(args.volNum || '4', 10)
const bookTitle = args.bookTitle || `毛泽东大传 第${['', '一', '二', '三', '四', '五'][volNum] || volNum}卷`
const existingLastId = args.existingLastId || 'V03-C65-P0001'
const targetChars = parseInt(args.targetChars || '1200', 10)
const minChars = parseInt(args.minChars || '400', 10)

const txtPath = path.isAbsolute(inputRel) ? inputRel : path.join(WORKSPACE, inputRel)
const text = fs.readFileSync(txtPath, 'utf8')
const allLines = text.split('\n')

function findChapters(lines) {
  const chapters = []
  const re = /^第(\d+)章\s*$/
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].trim().match(re)
    if (m) chapters.push({ num: parseInt(m[1], 10), startLine: i })
  }
  for (let c = 0; c < chapters.length; c++) {
    chapters[c].endLine = c < chapters.length - 1 ? chapters[c + 1].startLine : lines.length
  }
  return chapters
}

const BODY_STARTERS = ['话说', '且说', '再说', '却说', '原来']

function extractContent(ch) {
  const lines = []
  for (let i = ch.startLine + 1; i < ch.endLine; i++) lines.push(allLines[i])

  const subtitleParts = []
  let bodyIdx = 0
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    if (!t) {
      if (subtitleParts.length > 0) continue
      continue
    }
    if (BODY_STARTERS.some((s) => t.startsWith(s))) {
      bodyIdx = i
      break
    }
    subtitleParts.push(t)
    bodyIdx = i + 1
  }

  const subtitle = subtitleParts.join('').replace(/^\s+/, '')

  const paragraphs = []
  for (let i = bodyIdx; i < lines.length; i++) {
    const t = lines[i].trim()
    if (t) paragraphs.push(t)
  }

  while (paragraphs.length && !paragraphs[paragraphs.length - 1]) paragraphs.pop()
  return { subtitle, paragraphs }
}

function splitPages(paragraphs) {
  if (!paragraphs.length) return [['本章内容正在整理中。']]
  const pages = []
  let cur = []
  let chars = 0

  for (const p of paragraphs) {
    const len = p.length
    if (chars > 0 && chars + len > targetChars && chars >= minChars) {
      pages.push(cur)
      cur = [p]
      chars = len
    } else {
      cur.push(p)
      chars += len
    }
  }

  if (cur.length) {
    if (pages.length && chars < minChars) {
      pages[pages.length - 1].push(...cur)
    } else {
      pages.push(cur)
    }
  }
  return pages
}

function convertQuotes(t) {
  return t.replace(/\u201c/g, '\u300c').replace(/\u201d/g, '\u300d')
}

function escapeAngleBrackets(t) {
  // avoid MDX parsing issues for raw text like <...>
  return t.replace(/</g, '\u300A').replace(/>/g, '\u300B')
}

function makeTitle(firstPara) {
  let c = firstPara.trim()
  c = c.replace(/^(话说|且说|再说|却说|正是|这正是|原来)\s*/g, '').trim()
  // strip date/time-ish prefixes like "1945年8月14日", "11月5日", "中旬", "中午"
  for (let i = 0; i < 3; i++) {
    const next = c
      .replace(/^(?:\d{4}年)?\d{1,2}月\d{1,2}日[，,、\s]*/g, '')
      .replace(/^(?:\d{1,2}月)?\d{1,2}日[，,、\s]*/g, '')
      .replace(/^(?:\d{1,2}月)[，,、\s]*/g, '')
      .replace(/^\d{4}年(?:初|中|末|底)?[，,、\s]*/g, '')
      .replace(
        /^(?:这一天|当日|当天|同日|次日|翌日|翌晨|清晨|凌晨|拂晓|早晨|早上|晨|上午|中午|下午|傍晚|晚上|晚|深夜|夜里|夜间|夜|月初|月底|年初|年底|年中|年末|上旬|中旬|下旬)[，,、\s]*/g,
        ''
      )
      .trim()
    if (next === c) break
    c = next
  }
  c = c.replace(/^(在|于)\s*/g, '').trim()
  // take a readable clause
  const m = c.match(/^(.{3,18}?)[，。！？、；：\u300c\u300d]/)
  const t = (m ? m[1] : c.substring(0, 14)).replace(/[，,、；;:：。.!！?？]+$/g, '').trim()
  // avoid too-short titles
  if (t.length < 3) return c.substring(0, 8) || '未命名'
  return t
}

function pageId(chNum, pageNum) {
  return `${volId.toUpperCase()}-C${String(chNum).padStart(2, '0')}-P${String(pageNum).padStart(4, '0')}`
}

function makeMdx({ id, chNum, title, prev, next, order, paras }) {
  const meta = {
    id,
    workId: 'mao-dazhuan',
    volume: volNum,
    chapter: chNum,
    title,
    time: null,
    map: {
      features: [],
      route: null,
      camera: {
        mode: 'preset',
        lng: 108.95,
        lat: 35.75,
        height: 900000,
        heading: 0,
        pitch: -60,
        durationMs: 1200,
      },
    },
    transitions: { enter: { fadeMs: 300, flyToMs: 1200 }, exit: { fadeMs: 200 } },
    links: { prev, next },
    sources: [{ type: 'book', title: bookTitle, loc: `第${chNum}章` }],
    order,
  }

  const body = paras.map((p) => escapeAngleBrackets(convertQuotes(p))).join('\n\n')
  return `export const meta = ${JSON.stringify(meta, null, 2)}\n\n${body}\n`
}

const chapters = findChapters(allLines)
console.log(`Found ${chapters.length} chapters in ${path.relative(WORKSPACE, txtPath)}`)

const pages = []
for (const ch of chapters) {
  const { subtitle, paragraphs } = extractContent(ch)
  const pageParas = paragraphs
  const chPages = splitPages(pageParas)
  for (let i = 0; i < chPages.length; i++) {
    const id = pageId(ch.num, i + 1)
    const title = convertQuotes(makeTitle(chPages[i][0] || `第${ch.num}章`))
    pages.push({
      id,
      chNum: ch.num,
      pageNum: i + 1,
      totalPages: chPages.length,
      subtitle,
      title,
      paras: chPages[i],
    })
  }
}

for (let i = 0; i < pages.length; i++) {
  pages[i].prev = i === 0 ? existingLastId : pages[i - 1].id
  pages[i].next = i === pages.length - 1 ? null : pages[i + 1].id
}

let written = 0
for (const p of pages) {
  const dir = path.join(CONTENT_BASE, volId, `c${String(p.chNum).padStart(2, '0')}`)
  fs.mkdirSync(dir, { recursive: true })
  const mdx = makeMdx({
    id: p.id,
    chNum: p.chNum,
    title: p.title,
    prev: p.prev,
    next: p.next,
    order: p.pageNum,
    paras: p.paras,
  })
  fs.writeFileSync(path.join(dir, `${p.id}.mdx`), mdx)
  written++
}

console.log(`Wrote ${written} MDX files into apps/sun/content/mao-dazhuan/${volId}`)

// Update existing last node to point to new first node
if (pages.length > 0) {
  const firstId = pages[0].id
  const m = existingLastId.match(/^V(\d+)-C(\d+)-P(\d+)$/)
  const prevVolId = m ? `v${m[1]}` : 'v03'
  const prevChNum = m ? parseInt(m[2], 10) : 65
  const prevDir = path.join(CONTENT_BASE, prevVolId, `c${String(prevChNum).padStart(2, '0')}`)
  const prevPathGuess = path.join(prevDir, `${existingLastId}.mdx`)
  const candidates = [prevPathGuess]

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue
    let content = fs.readFileSync(filePath, 'utf8')
    content = content.replace(/"next":\s*(?:"[^"]*"|null)/, `"next": "${firstId}"`)
    fs.writeFileSync(filePath, content)
    console.log(`Updated ${path.relative(WORKSPACE, filePath)} next -> ${firstId}`)
    break
  }
}

