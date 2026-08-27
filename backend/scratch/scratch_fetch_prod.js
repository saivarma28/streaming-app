async function run() {
  const url = "https://streaming-app-nu-seven.vercel.app/api/movies/9";
  try {
    const res = await fetch(url);
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

run();
