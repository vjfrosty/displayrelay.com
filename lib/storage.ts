import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const BUCKET = process.env.MINIO_BUCKET as string;

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY as string,
    secretAccessKey: process.env.MINIO_SECRET_KEY as string,
  },
});

function publicReadPolicy(bucket: string) {
  return JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: "*",
        Action: "s3:GetObject",
        Resource: `arn:aws:s3:::${bucket}/*`,
      },
    ],
  });
}

let bucketReady: Promise<void> | null = null;

// Lazily creates the bucket and sets a public-read policy on first use, so
// nginx's unsigned /assets/ proxy (docker/nginx/nginx.conf) can serve objects
// directly. No separate bootstrap container needed.
async function ensureBucket(): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      try {
        await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
      } catch {
        await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
        await s3.send(new PutBucketPolicyCommand({ Bucket: BUCKET, Policy: publicReadPolicy(BUCKET) }));
      }
    })();
  }
  return bucketReady;
}

export async function upload(buffer: Buffer, mimeType: string, key: string): Promise<void> {
  await ensureBucket();
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: mimeType }));
}

export async function deleteFile(key: string): Promise<void> {
  await ensureBucket();
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function listFiles(prefix: string): Promise<string[]> {
  await ensureBucket();
  const res = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }));
  return (res.Contents ?? []).map((object) => object.Key).filter((key): key is string => Boolean(key));
}

export function getPublicUrl(key: string): string {
  return `${process.env.MINIO_PUBLIC_URL}/${key}`;
}
