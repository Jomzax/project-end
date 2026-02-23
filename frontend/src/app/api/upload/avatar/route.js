import { GetObjectCommand, S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const MAX_AVATAR_SIZE = 1024 * 1024
const BUCKET_NAME = process.env.MINIO_BUCKET || 'projectend4'
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'http://127.0.0.1:9000'
const MINIO_PUBLIC_BASE_URL = process.env.MINIO_PUBLIC_BASE_URL || MINIO_ENDPOINT

const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY
  || process.env.MINIO_ROOT_USER
  || ''
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY
  || process.env.MINIO_ROOT_PASSWORD
  || ''

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg'
}

const ALLOWED_IMAGE_TYPES = new Set(Object.keys(MIME_TO_EXT))

const createS3Client = () => new S3Client({
  endpoint: MINIO_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: MINIO_ACCESS_KEY,
    secretAccessKey: MINIO_SECRET_KEY
  },
  forcePathStyle: true
})

export const runtime = 'nodejs'

const streamToBuffer = async (stream) => {
  const chunks = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export async function GET(request) {
  try {
    if (!MINIO_ACCESS_KEY || !MINIO_SECRET_KEY) {
      return Response.json(
        { error: 'ยังไม่ได้ตั้งค่า MINIO_ACCESS_KEY หรือ MINIO_SECRET_KEY' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return Response.json({ error: 'ไม่พบ key ของไฟล์รูป' }, { status: 400 })
    }

    const s3Client = createS3Client()
    const result = await s3Client.send(new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    }))

    const buffer = await streamToBuffer(result.Body)
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': result.ContentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error) {
    return Response.json(
      { error: error?.message || 'โหลดรูปไม่สำเร็จ' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    if (!MINIO_ACCESS_KEY || !MINIO_SECRET_KEY) {
      return Response.json(
        { error: 'ยังไม่ได้ตั้งค่า MINIO_ACCESS_KEY หรือ MINIO_SECRET_KEY' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return Response.json({ error: 'ไม่พบไฟล์รูปภาพ' }, { status: 400 })
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return Response.json(
        { error: 'อนุญาตเฉพาะไฟล์รูปภาพ (jpg, png, webp, gif, svg)' },
        { status: 400 }
      )
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return Response.json({ error: 'ขนาดรูปต้องไม่เกิน 1MB' }, { status: 400 })
    }

    const extension = MIME_TO_EXT[file.type]
    const objectKey = `avatars/${Date.now()}.${extension}`
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    const s3Client = createS3Client()
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: file.type
    }))

    const objectUrl = `${MINIO_PUBLIC_BASE_URL.replace(/\/$/, '')}/${BUCKET_NAME}/${objectKey}`

    return Response.json({
      ok: true,
      key: objectKey,
      url: objectUrl,
      displayUrl: `/api/upload/avatar?key=${encodeURIComponent(objectKey)}`
    })
  } catch (error) {
    return Response.json(
      { error: error?.message || 'อัปโหลดรูปไม่สำเร็จ' },
      { status: 500 }
    )
  }
}
