import { uploadToR2 } from "./services/cloudflareR2.js";

async function run() {
  const dummyBuffer = Buffer.from("Hello Cloudflare R2 from Hotstar Clone! Test upload timestamp: " + Date.now());
  const destinationPath = `test/hello-r2-${Date.now()}.txt`;
  
  try {
    console.log("Attempting to upload test file to Cloudflare R2...");
    const url = await uploadToR2(dummyBuffer, destinationPath, "text/plain");
    console.log("SUCCESS! Test file uploaded to R2.");
    console.log("Generated URL:", url);
  } catch (err) {
    console.error("FAILED! R2 upload error:", err);
  }
}

run();
