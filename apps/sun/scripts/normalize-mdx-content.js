const fs = require('fs')
const path = require('path')

const appRoot = path.resolve(__dirname, '..')
const contentRoot = path.join(appRoot, 'content', 'mao-dazhuan')

function normalizeFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const marker = '}\n\n'
  const index = raw.indexOf(marker)
  if (index === -1) return

  const head = raw.slice(0, index + marker.length)
  const body = raw.slice(index + marker.length)
  const normalized = body.replace(/\\n/g, '\n')

  if (normalized !== body) {
    fs.writeFileSync(filePath, head + normalized, 'utf8')
  }
}

function walk(dirPath) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath)
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      normalizeFile(fullPath)
    }
  }
}

walk(contentRoot)
console.log('MDX content normalized.')

