async function run() {
  const accountId = "dc45a8dfecc086ec55f90b54f2bc9ba4";
  const token = "cfat_R3nh3wvNnWRHHb9MDkYSvgdMIPuuiMb3bg5QwNfIb76b2b7f";
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    console.log("=== CLOUDFLARE R2 BUCKETS ===");
    console.log(JSON.stringify(data, null, 2));
    console.log("=============================");
  } catch (err) {
    console.error("Error fetching Cloudflare API:", err);
  }
}

run();
