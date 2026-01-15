#!/usr/bin/env node

/**
 * 拷贝 Cesium 静态资源到 public/cesium
 * 在 postinstall 或 dev/build 前运行
 */

const fs = require('fs')
const path = require('path')

// require.resolve('cesium') 返回 .../cesium/index.cjs
// path.dirname 得到 .../cesium
// 再拼接 Build/Cesium
const cesiumPackage = path.dirname(require.resolve('cesium/package.json'))
const cesiumBuild = path.join(cesiumPackage, 'Build/Cesium')
const publicCesium = path.join(__dirname, '../public/cesium')

const folders = ['Workers', 'ThirdParty', 'Assets', 'Widgets']

function copyFolderSync(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠️  Source not found: ${src}`)
    return false
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyFolderSync(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
  return true
}

console.log('Copying Cesium assets to public/cesium...')
console.log(`  Source: ${cesiumBuild}`)
console.log(`  Dest:   ${publicCesium}`)
console.log('')

let success = true
for (const folder of folders) {
  const src = path.join(cesiumBuild, folder)
  const dest = path.join(publicCesium, folder)
  process.stdout.write(`  ${folder}... `)
  if (copyFolderSync(src, dest)) {
    console.log('✓')
  } else {
    success = false
  }
}

console.log('')
if (success) {
  console.log('✅ Done!')
} else {
  console.log('⚠️  Some folders were not found. Cesium may not work correctly.')
}
