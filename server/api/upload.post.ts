import { writeFile, mkdir } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { randomBytes } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const form = await readFormData(event)
  const file = form.get('file') as File | null

  if (!file || !(file instanceof File)) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/avif']
  if (!allowedTypes.includes(file.type)) {
    throw createError({ statusCode: 400, statusMessage: 'Only image files are allowed' })
  }

  const maxSize = 20 * 1024 * 1024 // 20 MB
  if (file.size > maxSize) {
    throw createError({ statusCode: 400, statusMessage: 'File size exceeds 20 MB limit' })
  }

  // Generate timestamp-based UUID
  const timestamp = Date.now()
  const random = randomBytes(4).toString('hex')
  const imageUUID = `${timestamp}-${random}`

  // Sanitize the original filename
  const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const ext = extname(originalName).toLowerCase()
  const baseName = originalName.slice(0, originalName.length - ext.length)
  const safeFileName = `${baseName.slice(0, 64)}${ext}`

  // Resolve the public directory path
  const publicDir = join(process.cwd(), 'public', imageUUID)
  await mkdir(publicDir, { recursive: true })

  const filePath = join(publicDir, safeFileName)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filePath, buffer)

  const imageUrl = `/${imageUUID}/${safeFileName}`

  return { url: imageUrl }
})
