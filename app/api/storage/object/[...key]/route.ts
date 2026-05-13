import { NextResponse } from 'next/server'
import { Readable } from 'node:stream'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { SessionData, SESSION_OPTIONS } from '@/lib/session'
import {
  ensureBucketExists,
  getObjectStorageBucket,
  getObjectStorageClient,
} from '@/lib/objectStorage'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ key: string[] }>
}

function decodeObjectKey(parts: string[]) {
  return parts.map((segment) => decodeURIComponent(segment)).join('/')
}

export async function GET(_request: Request, context: RouteContext) {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, SESSION_OPTIONS)

  if (!session.accessToken || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key: keyParts } = await context.params
  if (!keyParts || keyParts.length === 0) {
    return NextResponse.json({ error: 'Object key is required' }, { status: 400 })
  }

  const objectKey = decodeObjectKey(keyParts)
  const bucketName = getObjectStorageBucket()
  const objectStorageClient = getObjectStorageClient()

  await ensureBucketExists()

  try {
    const [stat, stream] = await Promise.all([
      objectStorageClient.statObject(bucketName, objectKey),
      objectStorageClient.getObject(bucketName, objectKey),
    ])

    const contentType = stat.metaData?.['content-type'] || 'application/octet-stream'
    const fileName = objectKey.split('/').pop() || 'document'

    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': stat.size.toString(),
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('[Object Storage] Failed to fetch object', error)
    return NextResponse.json({ error: 'Object not found' }, { status: 404 })
  }
}

