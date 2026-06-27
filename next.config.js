const { i18n } = require('./next-i18next.config')

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,

  // pdf-parse depends on pdfjs-dist, which *optionally* tries to load
  // @napi-rs/canvas (a native binary for rendering PDF pages as images).
  // We only need text extraction, not rendering, and that optional
  // dependency isn't installed — without this, it crashes the
  // /api/parse-form16 and /api/upload-document serverless functions
  // at runtime with "Cannot find module '@napi-rs/canvas'".
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), '@napi-rs/canvas']
    }
    return config
  },

  // Tell Next.js we're aware of Turbopack and don't need special config
  turbopack: {},
}

module.exports = nextConfig