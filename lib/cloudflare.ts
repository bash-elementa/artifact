import { S3Client, PutObjectCommand, DeleteObjectCommand, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME ?? "artifact-media";
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL ?? "";

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return `${PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

/** Extract the R2 object key from a public R2 URL, or null if it's not an R2 URL. */
export function r2KeyFromUrl(url: string): string | null {
  if (!PUBLIC_URL || !url.startsWith(PUBLIC_URL + "/")) return null;
  return url.slice(PUBLIC_URL.length + 1);
}

/** Delete a video from Cloudflare Stream by its UID. */
export async function deleteFromStream(uid: string): Promise<void> {
  const accountId = process.env.CLOUDFLARE_STREAM_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_STREAM_TOKEN;
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${uid}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`CF Stream delete failed: ${text}`);
  }
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

// Cloudflare Stream helpers
export async function uploadVideoToStream(formData: FormData): Promise<{ uid: string; playback: { hls: string } }> {
  const accountId = process.env.CLOUDFLARE_STREAM_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_STREAM_TOKEN;

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Stream upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result;
}

let r2CorsConfigured = false;

/** Configure R2 CORS to allow direct browser uploads via presigned PUT URLs. Idempotent. */
export async function ensureR2Cors(): Promise<void> {
  if (r2CorsConfigured) return;
  await r2Client.send(
    new PutBucketCorsCommand({
      Bucket: BUCKET,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["Content-Type", "Content-Length"],
            AllowedMethods: ["PUT"],
            AllowedOrigins: ["*"],
            ExposeHeaders: [],
            MaxAgeSeconds: 86400,
          },
        ],
      },
    })
  );
  r2CorsConfigured = true;
}

/** Get a Cloudflare Stream one-time direct upload URL so the browser can upload large videos without proxying through Next.js. */
export async function getCFStreamDirectUploadUrl(): Promise<{ uploadUrl: string; uid: string }> {
  const accountId = process.env.CLOUDFLARE_STREAM_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_STREAM_TOKEN;

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ maxDurationSeconds: 3600 }),
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`CF Stream direct upload failed: ${text}`);
  }

  const data = await response.json();
  return { uploadUrl: data.result.uploadURL, uid: data.result.uid };
}
