import { createReadStream, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const mimeTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.avif': 'image/avif',
}

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')
  const file = getRouterParam(event, 'file')

  if (!uuid || !file) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request' })
  }

  // Prevent path traversal
  if (uuid.includes('..') || file.includes('..') || uuid.includes('/') || file.includes('/')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid path' })
  }

  const filePath = join(process.cwd(), 'public', uuid, file)

  let stat: ReturnType<typeof statSync>
  try {
    stat = statSync(filePath)
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code !== 'ENOENT') {
      console.error('[file-serve] Unexpected error reading file:', filePath, err)
    }
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  if (!stat.isFile()) {
    throw createError({ statusCode: 404, statusMessage: 'Not a file' })
  }

  const ext = extname(file).toLowerCase()
  const contentType = mimeTypes[ext] ?? 'application/octet-stream'

  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Content-Length', stat.size)
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

  return sendStream(event, createReadStream(filePath))
})
