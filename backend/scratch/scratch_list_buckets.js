import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: "https://dc45a8dfecc086ec55f90b54f2bc9ba4.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "892248788956691fe02d3aa630e3cf15",
    secretAccessKey: "78a260ba482b35176ab48fb523af5aeca514d1658ee45ad4513e3c61b5c88b0b",
  },
  region: "auto",
});

async function run() {
  try {
    const response = await s3.send(new ListBucketsCommand({}));
    console.log("=== BUCKETS ===");
    console.log(response.Buckets);
    console.log("===============");
  } catch (err) {
    console.error("Error listing buckets:", err);
  }
}

run();
