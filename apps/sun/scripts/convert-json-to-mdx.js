const fs = require('fs')
const path = require('path')

const appRoot = path.resolve(__dirname, '..')
const dataRoot = path.join(appRoot, 'data', 'mao-dazhuan')
const contentRoot = path.join(appRoot, 'content', 'mao-dazhuan')
const indexPath = path.join(dataRoot, 'index.json')

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function sanitizeLooseJson(input) {
  let output = ''
  let inString = false
  let escape = false

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]

    if (escape) {
      output += char
      escape = false
      continue
    }

    if (char === '\\') {
      if (!inString && input[i + 1] === 'n') {
        output += '\n'
        i += 1
        continue
      }
      escape = true
      output += char
      continue
    }

    if (char === '"') {
      inString = !inString
    }

    output += char
  }

  return output
}

function repairInlineStrings(input) {
  let output = ''
  let i = 0

  while (i < input.length) {
    const inlineStart = input.indexOf('"inline": "', i)
    if (inlineStart === -1) {
      output += input.slice(i)
      break
    }

    output += input.slice(i, inlineStart)
    const contentStart = inlineStart + '"inline": "'.length

    let j = contentStart
    let rawContent = ''
    while (j < input.length) {
      const char = input[j]
      if (char === '"' && isInlineEnd(input, j)) {
        break
      }
      rawContent += char
      j += 1
    }

    const escapedContent = JSON.stringify(rawContent)
    output += `"inline": ${escapedContent}`

    if (j >= input.length) {
      i = input.length
    } else {
      i = j + 1
    }
  }

  return output
}

function isInlineEnd(input, quoteIndex) {
  let k = quoteIndex + 1
  while (k < input.length && (input[k] === ' ' || input[k] === '\t')) {
    k += 1
  }
  if (input[k] === '\r') k += 1
  if (input[k] !== '\n') return false
  k += 1
  while (k < input.length && (input[k] === ' ' || input[k] === '\t')) {
    k += 1
  }
  return input[k] === '}'
}

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const repairedInline = repairInlineStrings(raw)
  const sanitized = sanitizeLooseJson(repairedInline)
  return JSON.parse(sanitized)
}

function toImportIdentifier(id) {
  return `Node_${id.replace(/[^a-zA-Z0-9]/g, '_')}`
}

function writeMdxFile(node, order, outputDir) {
  const { content, ...rest } = node
  const meta = { ...rest, order }
  const metaBlock = `export const meta = ${JSON.stringify(meta, null, 2)}\n`
  const body = content?.inline ? `${content.inline}\n` : ''
  const fileContent = `${metaBlock}\n${body}`

  const fileName = `${node.id}.mdx`
  const filePath = path.join(outputDir, fileName)
  fs.writeFileSync(filePath, fileContent, 'utf8')
  return filePath
}

function main() {
  if (!fs.existsSync(indexPath)) {
    throw new Error(`index.json not found at ${indexPath}`)
  }

  const index = readJsonFile(indexPath)
  const work = index.work

  const importLines = []
  const nodeEntries = []
  const chapterNodesMap = new Map()

  for (const volume of work.volumes) {
    const volumeId = `v${String(volume.number).padStart(2, '0')}`
    for (const chapter of volume.chapters) {
      const chapterId = `c${String(chapter.number).padStart(2, '0')}`
      const chapterJsonPath = path.join(
        dataRoot,
        'nodes',
        volumeId,
        `${chapterId}.json`
      )
      const chapterData = readJsonFile(chapterJsonPath)

      const outputDir = path.join(contentRoot, volumeId, chapterId)
      ensureDir(outputDir)

      const nodes = chapterData.nodes || []
      nodes.forEach((node, index) => {
        const order = index + 1
        const filePath = writeMdxFile(node, order, outputDir)

        const importId = toImportIdentifier(node.id)
        const importPath = filePath
          .replace(appRoot + path.sep, '')
          .replace(/\\/g, '/')
        importLines.push(
          `import ${importId}, { meta as meta_${importId} } from '../${importPath}'`
        )

        nodeEntries.push(`{
  meta: meta_${importId},
  Component: ${importId},
}`)

        if (!chapterNodesMap.has(chapter.id)) {
          chapterNodesMap.set(chapter.id, [])
        }
        chapterNodesMap.get(chapter.id).push(`meta_${importId}.id`)
      })
    }
  }

  const mdxIndexPath = path.join(appRoot, 'lib', 'mdx-index.ts')
  const workExport = JSON.stringify(
    {
      id: work.id,
      title: work.title,
      subtitle: work.subtitle,
      author: work.author,
      description: work.description,
      volumes: work.volumes.map((volume) => ({
        id: volume.id,
        number: volume.number,
        title: volume.title,
        subtitle: volume.subtitle,
        chapters: volume.chapters.map((chapter) => ({
          id: chapter.id,
          number: chapter.number,
          title: chapter.title,
          subtitle: chapter.subtitle,
          nodeCount: chapter.nodeCount,
        })),
      })),
    },
    null,
    2
  )

  const chapterMapEntries = Array.from(chapterNodesMap.entries())
    .map(([chapterId, nodeIds]) => `  '${chapterId}': [${nodeIds.join(', ')}]`)
    .join(',\n')

  const mdxIndexContent = `import type { Work, Node } from '../types/narrative'

${importLines.join('\n')}

const nodeModules = [
${nodeEntries.join(',\n')}
]

export const mdxWork: Work = ${workExport}

export const mdxNodes: Node[] = nodeModules.map((entry) => ({
  ...entry.meta,
  content: { type: 'mdx', Component: entry.Component },
}))

export const mdxNodesById: Record<string, Node> = Object.fromEntries(
  mdxNodes.map((node) => [node.id, node])
)

export const mdxChapterNodeIds: Record<string, string[]> = {
${chapterMapEntries}
}
`

  ensureDir(path.dirname(mdxIndexPath))
  fs.writeFileSync(mdxIndexPath, mdxIndexContent, 'utf8')

  console.log('MDX conversion complete.')
}

main()

