#!/usr/bin/env node
/**
 * Recompute and rewrite MDX node meta.title for better TOC readability.
 *
 * Usage:
 *   node scripts/retitle-mdx-nodes.js --vol v04 --vol v05
 */
const fs = require('fs')
const path = require('path')

const WORKSPACE = path.resolve(__dirname, '..')
const CONTENT_BASE = path.join(WORKSPACE, 'apps/sun/content/mao-dazhuan')

function parseArgs(argv) {
  const args = { vol: [] }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) continue
    const key = a.slice(2)
    const val = argv[i + 1]
    if (!val || val.startsWith('--')) {
      args[key] = true
    } else {
      if (key === 'vol') args.vol.push(val)
      else args[key] = val
      i++
    }
  }
  return args
}

const args = parseArgs(process.argv)
const volIds = args.vol.length ? args.vol : ['v04', 'v05']
const MAX_SCAN_PARAS = parseInt(args.maxScanParas || '8', 10)
const MAX_TITLE_LEN = parseInt(args.maxTitleLen || '18', 10)

function findMdxFiles(dir) {
  const results = []
  if (!fs.existsSync(dir)) return results
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) results.push(...findMdxFiles(full))
    else if (e.name.endsWith('.mdx')) results.push(full)
  }
  return results
}

function extractBody(content) {
  const idx = content.indexOf('\n\n')
  return idx > -1 ? content.substring(idx + 2) : ''
}

function parseMeta(content) {
  const metaMatch = content.match(/export\s+const\s+meta\s*=\s*(\{[\s\S]*?\n\})/)
  if (!metaMatch) return null
  try {
    // meta object is JSON stringified in our generator, so eval is safe-ish here
    return new Function(`return ${metaMatch[1]}`)()
  } catch {
    return null
  }
}

function convertQuotes(t) {
  return t.replace(/\u201c/g, '\u300c').replace(/\u201d/g, '\u300d')
}

const KEY_PEOPLE = [
  '毛泽东',
  '周恩来',
  '朱德',
  '蒋介石',
  '蒋中正',
  '刘志丹',
  '谢子长',
  '徐海东',
  '张闻天',
  '林彪',
  '彭德怀',
  '聂荣臻',
  '罗荣桓',
  '刘少奇',
  '任弼时',
  '陈毅',
  '邓小平',
  '赫尔利',
]

const KEY_ORGS = [
  '中共中央',
  '中央军委',
  '中央政治局',
  '中央书记处',
  '新华社',
  '解放日报',
  '西北工委',
  '西北军委',
  '西北革命军事委员会',
  '红军',
  '八路军',
  '新四军',
]

const ACTION_VERBS = [
  '致电',
  '复电',
  '电邀',
  '来电',
  '电示',
  '电告',
  '起草',
  '发表',
  '播发',
  '发布',
  '表示',
  '召开',
  '举行',
  '会见',
  '谈判',
  '会谈',
  '决定',
  '指示',
  '提出',
  '建议',
  '探望',
  '成立',
  '组建',
  '恢复',
  '撤销',
  '任命',
  '批评',
  '部署',
  '宣布',
]

const TIME_PREFIX_RE = new RegExp(
  '^' +
    '(?:' +
    // date forms
    '(?:\\d{4}年)?\\d{1,2}月\\d{1,2}日' +
    '|' +
    '(?:\\d{1,2}月)?\\d{1,2}日' +
    '|' +
    '\\d{1,2}月' +
    '|' +
    // year-ish
    '\\d{4}年(?:初|中|末|底)?' +
    '|' +
    // relative/day parts
    '这一天|当日|当天|当晚|同日|次日|翌日|翌晨|当夜|夜里|夜间' +
    '|' +
    // time of day
    '清晨|凌晨|拂晓|早晨|早上|晨|上午|中午|下午|傍晚|晚上|晚|深夜|夜' +
    '|' +
    // ranges
    '月初|月底|年初|年底|年中|年末|上旬|中旬|下旬' +
    ')' +
    '(?:[，,、\\s]+|$)'
)

const BAD_TITLES = new Set([
  '年初',
  '年底',
  '年中',
  '年末',
  '上旬',
  '中旬',
  '下旬',
  '上午',
  '中午',
  '下午',
  '清晨',
  '凌晨',
  '傍晚',
  '晚上',
  '深夜',
  '晨',
  '晚',
  '夜',
  '这一天',
  '次日',
  '翌日',
  '当日',
  '当天',
  '同日',
  '月底',
  '月初',
  // overly generic discourse openers
  '看起来',
  '看来',
  '看上去',
  '看样子',
  '总之',
  '因此',
  '然而',
  '但是',
  '同时',
  '于是',
  '后来',
  '原来',
])

const BAD_PREFIX_RE =
  /^(?:就在|此时|这些天|这期间|不久前|早饭后|午饭后|晚饭后|饭后|从此|目前|后来|于是|因此|关于|会议决定|会议宣布|今日者|此方针下|此期间|待.+坐定)/u

function stripLeadingNoise(s) {
  let t = String(s).trim()
  t = t.replace(/^[「」“”"]+/g, '').trim()
  t = t.replace(/^(话说|且说|再说|却说|原来|正是|这正是)\s*/g, '').trim()
  t = t.replace(/^(看起来|看来|看上去|看样子)\s*[，,、]?\s*/g, '').trim()
  // strip leading "在/于" early so time patterns can match
  t = t.replace(/^(在|于)\s*/g, '').trim()
  // strip date-like prefixes even when glued (e.g. 1948年4月7日上午10时许 / 8月14日这一天)
  t = t
    .replace(/^(?:\d{4}年)?\d{1,2}月\d{1,2}日(?:这一天|这天|当日|当天)?/g, '')
    .replace(/^\d{1,2}月\d{1,2}日(?:这一天|这天|当日|当天)?/g, '')
    .replace(/^\d{4}年(?:初|中|末|底)?/g, '')
    .trim()
  // strip month-ish prefixes like "4月间/12月底/10月下旬/8月间的一个星期天"
  t = t
    .replace(/^\d{1,2}月(?:初|中旬|下旬|上旬|月底|月初|底|末|间)(?:的)?/g, '')
    .replace(/^\d{1,2}月(?:的)?(?:一天|一晚|晚上|清晨|上午|中午|下午|傍晚|夜里|夜间)/g, '')
    .trim()
  // strip time-of-day glued with digits (e.g. 上午10时许 / 10时许)
  t = t
    .replace(/^(?:上午|中午|下午|凌晨|清晨|傍晚|晚上|早上|早晨|夜里|夜间|深夜)\d{1,2}时(?:\d{1,2}分)?(?:许)?/g, '')
    .replace(/^\d{1,2}时(?:\d{1,2}分)?(?:许)?/g, '')
    .trim()
  // strip multiple time/date prefixes repeatedly
  for (let i = 0; i < 3; i++) {
    const next = t.replace(TIME_PREFIX_RE, '')
    if (next === t) break
    t = next.trim()
  }
  t = t.replace(/^[，,、；;:：。.!！?？]+/g, '').trim()
  return t
}

function stripDanglingBracketsAndQuotes(s) {
  let t = String(s || '').trim()
  // normalize 《...》 into bare text when complete
  t = t.replace(/《([^》]{2,80})》/g, '$1')
  // cut dangling 《... (no closing)
  if (t.includes('《') && !t.includes('》')) t = t.split('《')[0].trim()
  if (t.includes('「') && !t.includes('」')) t = t.split('「')[0].trim()
  if (t.includes('“') && !t.includes('”')) t = t.split('“')[0].trim()
  // remove trailing openers if any
  t = t.replace(/[《「“（(]+$/g, '').trim()
  // remove trailing particles/punct
  t = t.replace(/[，,、；;:：。.!！?？]+$/g, '').trim()
  t = t.replace(/的$/g, '').trim()
  return t
}

function firstClause(s) {
  const t = String(s).trim()
  // Prefer title-like fragment before punctuation/quotes
  const m =
    t.match(/^(.{3,24}?)[，。！？、；：\u300c\u300d]/) ||
    t.match(/^(.{3,24}?)(?:\s|$)/)
  return (m ? m[1] : t).trim()
}

function firstSentence(s) {
  const t = String(s).trim()
  const m = t.match(/^([\s\S]{3,120}?)[。！？!?\n]/)
  return (m ? m[1] : t).trim()
}

function simplifySentenceTitle(s) {
  let t = String(s || '').trim()
  t = t.replace(/\s+/g, '')
  // common rhetorical wrappers
  t = t.replace(/^(?:我看|我认为|我觉得|我们认为|一般说来|总的说来)/u, '')
  // make “我们有些同志…” more title-like
  t = t.replace(/^我们有些同志/u, '部分同志')
  t = t.replace(/^有些同志/u, '部分同志')
  // reduce long “对于马克思、列宁所说的...” lead-ins
  t = t.replace(/对于(?:马克思(?:、列宁)?|列宁|马克思列宁)(?:所说的)?/u, '')
  // tighten frequent endings
  t = t.replace(/还不理解/u, '不理解')
  t = t.replace(/不大理解/u, '不理解')
  // drop internal separators for TOC readability
  t = t.replace(/[，,、；;:：]+/g, '')
  return t.trim()
}

function isBadCandidate(t) {
  if (!t) return true
  if (t.length < 3) return true
  if (BAD_TITLES.has(t)) return true
  if (BAD_PREFIX_RE.test(t)) return true
  // bare subject-only openers that read poorly in TOC
  if (/^(?:我们|咱们)?(?:有些|一些|部分)?(?:同志|人|人们|干部|领导|群众)(?:们)?$/u.test(t) && t.length <= 8) return true
  if (/^(?:我们|咱们)(?:有些|一些|部分)?$/u.test(t)) return true
  // too generic speech verbs when short
  if (/(?:说|表示|指出|认为|强调)$/.test(t) && t.length <= 8) return true
  // pure digits or date-like leftovers
  if (/^\d+$/.test(t)) return true
  if (/^\d{1,2}月\d{1,2}日$/.test(t)) return true
  if (/^\d{1,2}月$/.test(t)) return true
  if (/^\d{4}年(?:初|中|末|底)?$/.test(t)) return true
  if (/^\d{4}(?:年|年初|年底|年中|年末|年初)$/.test(t)) return true
  if (/^\d{3,4}/.test(t) && t.length <= 8) return true
  return false
}

function clampTitle(t) {
  const s = String(t || '').trim()
  if (!s) return ''
  if (s.length <= MAX_TITLE_LEN) return s
  // try cut at punctuation within limit
  const cut = s.slice(0, MAX_TITLE_LEN)
  const m = cut.match(/^(.+?)[，,、；;:：。.!！?？\u300c\u300d]$/)
  return (m ? m[1] : cut).trim()
}

function normalizeTitle(raw) {
  let base = convertQuotes(String(raw || '')).trim()
  base = stripLeadingNoise(base)
  base = stripDanglingBracketsAndQuotes(base)

  const clean = (x) => {
    let t = String(x || '').trim()
    t = t.replace(/[，,、；;:：。.!！?？]+$/g, '').trim()
    t = t.replace(/\d+$/g, '').trim()
    t = stripDanglingBracketsAndQuotes(t)
    t = clampTitle(t)
    // clampTitle can re-introduce dangling openers by truncation; sanitize again.
    t = stripDanglingBracketsAndQuotes(t)
    return t
  }

  let cand = clean(firstClause(base))
  if (isBadCandidate(cand)) {
    const sent = simplifySentenceTitle(firstSentence(base))
    cand = clean(sent)
  }
  if (isBadCandidate(cand)) return ''
  return cand
}

function pickDocTitle(text) {
  const m = text.match(/《([^》]{2,30})》/)
  if (!m) return ''
  const doc = `《${m[1]}》`
  // add a light verb if present
  if (/(发表|播发|发布|刊登|印发)/.test(text)) return normalizeTitle(`发表${doc}`)
  if (/(起草|撰写|写作)/.test(text)) return normalizeTitle(`起草${doc}`)
  if (/(通过|决定|指示)/.test(text)) return normalizeTitle(`通过${doc}`)
  return normalizeTitle(doc)
}

function pickKeywordTitle(text) {
  // High-signal keyword combos (handy for avoiding "时间碎片" titles)
  if (/成立[^。]{0,20}(西北工委|中共西北工委)/.test(text) && /成立[^。]{0,20}(西北军委)/.test(text)) {
    return '成立西北工委、西北军委'
  }
  // telegram patterns like “X发给Y一封电报…”
  {
    const m = text.match(/(蒋介石|毛泽东|周恩来|朱德|张闻天)[^。\\n]{0,20}发给(蒋介石|毛泽东|周恩来|朱德|张闻天)[^。\\n]{0,10}电报/);
    if (m && m[1] && m[2] && m[1] !== m[2]) return `${m[1]}致电${m[2]}`
  }
  if (/恢复[^。]{0,16}陕北红军/.test(text) || /恢复[^。]{0,16}游击队/.test(text)) {
    return '恢复陕北红军游击队'
  }
  if (/求助[^。]{0,10}徐海东/.test(text) || /向[^。]{0,6}徐海东[^。]{0,10}求助/.test(text)) {
    return '向徐海东求助'
  }
  if (/刘志丹[^。]{0,10}探望[^。]{0,8}谢子长/.test(text) || /刘志丹[^。]{0,10}去探望[^。]{0,8}谢子长/.test(text)) {
    return '刘志丹探望谢子长'
  }
  if (/朱理治[^。]{0,18}(左倾|肃反|批评)/.test(text)) {
    return '朱理治推行左倾'
  }
  return ''
}

function pickActionTitle(text) {
  const cleaned = convertQuotes(String(text)).replace(/\s+/g, '')
  const names = [...KEY_PEOPLE, ...KEY_ORGS]
  const verbs = ACTION_VERBS
  for (const name of names) {
    const idx = cleaned.indexOf(name)
    if (idx === -1) continue
    const tail = cleaned.slice(idx, idx + 80)
    for (const v of verbs) {
      const j = tail.indexOf(v)
      if (j === -1) continue
      let after = tail.slice(j + v.length)
      after = after.replace(/^(?:说|称|指出|强调|认为|表示|提出)?[:：]*/g, '')
      after = after.replace(/^[:：,，、\s]+/g, '')
      // drop filler like "了一个/一封/一份/一篇..."
      after = after.replace(/^(?:了|又|遂|即|并)?(?:一封|一个|一份|一篇|一则|一项|一条|一套)?/g, '')
      after = after.replace(/^[:：,，、\s]+/g, '')
      // If object starts with 《...》, extract doc name and avoid dangling brackets.
      if (after.startsWith('《')) {
        const dm = after.match(/^《([^》]{2,40})》?/);
        if (dm && dm[1]) {
          const docName = dm[1];
          if (docName.startsWith('致')) {
            const to = docName.slice(1).match(/^[^，,、。]{2,8}/)?.[0];
            const candidate = normalizeTitle(`${name}${v}致${to || '对方'}的信`);
            if (candidate) return clampTitle(candidate);
          }
          const candidate = normalizeTitle(`${name}${v}${docName}`);
          if (candidate) return clampTitle(candidate);
        }
        // If can't extract a usable doc name, drop the doc part.
        after = after.split('《')[0].trim();
      }
      // object: take a short span until punctuation-ish
      const objMatch = after.match(/^(.{2,14}?)(?:[，,、。；;:：\u300c\u300d]|$)/)
      const objRaw = objMatch ? objMatch[1] : after.slice(0, 10)
      let obj = objRaw
        .replace(/并转.*$/, '')
        .replace(/并告.*$/, '')
        .replace(/等.*$/, '等')
        .replace(/(?:同志|先生|委员长|将军|主席)$/, '')
      obj = obj.replace(/[「」“”"]/g, '').trim()
      obj = stripDanglingBracketsAndQuotes(obj)
      // Require some object for generic verbs like 指示/表示/认为/决定
      if (obj.length < 2 && ['指示', '表示', '认为', '决定', '提出', '建议', '宣布', '批评', '部署', '起草', '发表', '播发', '发布', '召开', '举行', '会见', '会谈', '谈判'].includes(v)) {
        continue
      }
      const candidate = normalizeTitle(`${name}${v}${obj}`)
      if (candidate) return clampTitle(candidate)
    }
  }
  return ''
}

function computeBetterTitleFromBody(body) {
  const paras = body
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean)
  const headText = paras.slice(0, Math.min(MAX_SCAN_PARAS, paras.length)).join('\n')

  // Generate multiple candidates and pick best by score.
  const candidates = []

  // 1) Keyword combos (usually best)
  const kw = pickKeywordTitle(headText)
  if (kw) candidates.push({ t: kw, score: 95, kind: 'keyword' })

  // 2) Person/org + action verb pattern
  const act = pickActionTitle(headText)
  if (act) candidates.push({ t: act, score: 90, kind: 'action' })

  // 3) Doc title inside 《...》 (demote bare doc titles; keep when verb present)
  const doc = pickDocTitle(headText)
  if (doc) {
    const hasVerb = /^(发表|起草|通过)/.test(doc)
    candidates.push({ t: doc, score: hasVerb ? 70 : 25, kind: 'doc' })
  }

  // 4) Best paragraph-based fallback
  for (let i = 0; i < Math.min(MAX_SCAN_PARAS, paras.length); i++) {
    const cand = normalizeTitle(paras[i])
    if (cand) {
      candidates.push({ t: cand, score: 55 - i, kind: 'para' })
      break
    }
  }

  if (!candidates.length) return '未命名'

  // Extra penalty: overly generic endings.
  for (const c of candidates) {
    if (/^(?:.*)(?:说|表示|指出|认为)$/.test(c.t)) c.score -= 20
    if (/^(?:.*)(?:问题|情况)$/.test(c.t) && c.t.length <= 8) c.score -= 10
  }

  candidates.sort((a, b) => b.score - a.score)
  return candidates[0].t
}

let updated = 0
let total = 0
for (const volId of volIds) {
  const base = path.join(CONTENT_BASE, volId)
  const files = findMdxFiles(base).sort()
  console.log(`${volId}: ${files.length} files`)
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8')
    const meta = parseMeta(content)
    if (!meta) continue
    const body = extractBody(content)
    if (!body.trim()) continue
    total++
    const oldTitle = meta.title
    const newTitle = computeBetterTitleFromBody(body)
    if (!newTitle || newTitle === oldTitle) continue
    meta.title = newTitle
    const newContent = `export const meta = ${JSON.stringify(meta, null, 2)}\n\n${body}`
    fs.writeFileSync(f, newContent)
    updated++
  }
}

console.log(`Scanned ${total} nodes, updated ${updated} titles`)

