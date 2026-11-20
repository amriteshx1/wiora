import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function client(): S3Client {
  return new S3Client({
    region: required("S3_REGION"),
    endpoint: required("S3_ENDPOINT"),
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: required("S3_ACCESS_KEY_ID"),
      secretAccessKey: required("S3_SECRET_ACCESS_KEY"),
    },
  });
}

function bucket(): string {
  return required("S3_BUCKET");
}

export async function presignUpload(input: {
  key: string;
  contentType: string;
  byteSize: number;
}): Promise<string> {
  return getSignedUrl(
    client(),
    new PutObjectCommand({
      Bucket: bucket(),
      Key: input.key,
      ContentType: input.contentType,
      ContentLength: input.byteSize,
    }),
    { expiresIn: 60 },
  );
}

export async function presignDownload(key: string): Promise<string> {
  return getSignedUrl(
    client(),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: key,
    }),
    { expiresIn: 60 },
  );
}

export async function headObject(key: string): Promise<{ byteSize: number }> {
  const result = await client().send(
    new HeadObjectCommand({
      Bucket: bucket(),
      Key: key,
    }),
  );

  return { byteSize: result.ContentLength ?? 0 };
}

export async function getObjectBytes(key: string): Promise<Uint8Array> {
  const result = await client().send(
    new GetObjectCommand({
      Bucket: bucket(),
      Key: key,
    }),
  );
  const bytes = await result.Body?.transformToByteArray();
  if (!bytes) {
    throw new Error("The stored file is empty");
  }
  return bytes;
}

export async function deleteObject(key: string): Promise<void> {
  await client().send(
    new DeleteObjectCommand({
      Bucket: bucket(),
      Key: key,
    }),
  );
}
