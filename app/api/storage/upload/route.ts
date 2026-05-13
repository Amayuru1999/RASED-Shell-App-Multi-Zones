import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { SessionData, SESSION_OPTIONS } from '@/lib/session'
import {
  ensureBucketExists,
  getObjectStorageBucket,
  getObjectStorageClient,
} from '@/lib/objectStorage'

export const runtime = 'nodejs'

function sanitizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._/-]/g, '-').replace(/\/+/g, '/').replace(/^\/|\/$/g, '')
}

function buildObjectKey(originalName: string, folder?: string) {
  const safeFileName = sanitizePathSegment(originalName || 'document.pdf')
  const folderPrefix = folder ? `${sanitizePathSegment(folder)}/` : ''
  return `${folderPrefix}${Date.now()}-${randomUUID()}-${safeFileName}`
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, SESSION_OPTIONS)

  if (!session.accessToken || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  const folderValue = formData.get('folder')
  const folder = typeof folderValue === 'string' ? folderValue : undefined

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'file must not be empty' }, { status: 400 })
  }

  const objectKey = buildObjectKey(file.name, folder)
  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const contentType = file.type || 'application/octet-stream'
  const bucketName = getObjectStorageBucket()
  const objectStorageClient = getObjectStorageClient()

  await ensureBucketExists()
  await objectStorageClient.putObject(bucketName, objectKey, fileBuffer, fileBuffer.length, {
    'Content-Type': contentType,
    'X-Amz-Meta-Uploaded-By': session.user.username,
  })

  const encodedKey = objectKey
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return NextResponse.json(
    {
      bucket: bucketName,
      key: objectKey,
      fileName: file.name,
      size: file.size,
      contentType,
      url: `/api/storage/object/${encodedKey}`,
    },
    { status: 201 },
  )
}

