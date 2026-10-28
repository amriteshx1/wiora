process.env.AWS_REQUEST_CHECKSUM_CALCULATION = "WHEN_REQUIRED";
process.env.AWS_RESPONSE_CHECKSUM_VALIDATION = "WHEN_REQUIRED";

const {
  CreateBucketCommand,
  HeadBucketCommand,
  S3Client,
  S3ServiceException,
} = await import("@aws-sdk/client-s3");

const endpoint = process.env.S3_ENDPOINT;
const bucket = process.env.S3_BUCKET;
const client = new S3Client({
  region: process.env.S3_REGION,
  endpoint,
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

async function waitForServer() {
  const started = Date.now();
  while (Date.now() - started < 30000) {
    try {
      const response = await fetch(`${endpoint}/minio/health/live`);
      if (response.ok) return;
    } catch {
      // MinIO is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("MinIO did not become ready");
}

await waitForServer();

try {
  await client.send(new CreateBucketCommand({ Bucket: bucket }));
} catch (error) {
  const name = error instanceof S3ServiceException ? error.name : "";
  if (name !== "BucketAlreadyOwnedByYou" && name !== "BucketAlreadyExists") {
    throw error;
  }
}

await client.send(new HeadBucketCommand({ Bucket: bucket }));
console.log("private bucket ready");
