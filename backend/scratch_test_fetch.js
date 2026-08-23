// Native fetch used

async function run() {
  const url = "https://dc45a8dfecc086ec55f90b54f2bc9ba4.r2.cloudflarestorage.com/streaming-app/movies/9/video_1787505987961_generate_scene__(1).mp4";
  try {
    const res = await fetch(url);
    console.log("Status:", res.status);
    console.log("Status Text:", res.statusText);
    const body = await res.text();
    console.log("Body:", body.substring(0, 500));
  } catch (err) {
    console.error(err);
  }
}

run();
