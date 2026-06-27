import { readFileSync } from "node:fs";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    console.error("✗ Could not read .env (run this from migraine-backend/)");
    process.exit(1);
  }
  return env;
}

const env = loadEnv();
const {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_BUCKET,
  R2_PUBLIC_URL,
} = env;

const missing = [
  ["R2_ACCESS_KEY_ID", R2_ACCESS_KEY_ID],
  ["R2_SECRET_ACCESS_KEY", R2_SECRET_ACCESS_KEY],
  ["R2_ENDPOINT", R2_ENDPOINT],
  ["R2_BUCKET", R2_BUCKET],
].filter(([, v]) => !v).map(([k]) => k);

if (missing.length) {
  console.error("✗ Missing in .env: " + missing.join(", "));
  console.error("  Fill these (from the client's R2 keys) and re-run.");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const key = `__r2_test__/healthcheck-${Date.now()}.txt`;
const body = "R2 connectivity OK";

async function streamToString(stream) {
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8");
}

console.log(`\nTesting R2 → bucket "${R2_BUCKET}" at ${R2_ENDPOINT}\n`);

try {
  await s3.send(
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: body, ContentType: "text/plain" }),
  );
  console.log("✓ Upload   — wrote test file");

  const got = await s3.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  const text = await streamToString(got.Body);
  console.log(text === body ? "✓ Download — read it back correctly" : "✗ Download — content mismatch");

  await s3.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  console.log("✓ Delete   — cleaned up the test file");

  console.log("\n✅ R2 credentials WORK. Strapi uploads will go to this bucket.");
  if (R2_PUBLIC_URL) {
    console.log(`   Public URL configured: ${R2_PUBLIC_URL}`);
  } else {
    console.log("   ⚠ R2_PUBLIC_URL is empty — set it so uploaded media is publicly viewable.");
  }
} catch (err) {
  console.error("\n❌ R2 test FAILED:");
  console.error("   " + (err?.name || "Error") + ": " + (err?.message || err));
  console.error("\n   Common causes:");
  console.error("   · Wrong Access Key / Secret");
  console.error("   · Endpoint account-id is wrong (https://<account-id>.r2.cloudflarestorage.com)");
  console.error("   · Bucket name typo, or the token lacks Object Read & Write on this bucket");
  process.exit(1);
}
