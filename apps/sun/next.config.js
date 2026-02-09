/** @type {import('next').NextConfig} */
const nextConfig = {
  // 兼容 Turbopack
  turbopack: {},
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
}

const withMDX = require('@next/mdx')({
  extension: /\.(md|mdx)$/,
})

module.exports = withMDX(nextConfig)
