import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  const publicPrefix = process.env.R2_PUBLIC_URL_PREFIX;
  if (!publicPrefix) {
    console.error("ERROR: R2_PUBLIC_URL_PREFIX is not set in backend/.env!");
    console.error("Please add R2_PUBLIC_URL_PREFIX=https://pub-xxxxxx.r2.dev to your backend/.env before running this script.");
    process.exit(1);
  }

  const cleanPrefix = publicPrefix.replace(/\/$/, "");
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || "streaming_app");
    const movieCollection = db.collection("movies");

    const movies = await movieCollection.find({}).toArray();
    console.log(`Found ${movies.length} movies in the database.`);

    for (const movie of movies) {
      if (movie.hlsUrl && movie.hlsUrl.includes("r2.cloudflarestorage.com")) {
        // Extract the bucket folder path from the old URL
        // Old URL format: https://<account_id>.r2.cloudflarestorage.com/<bucket_name>/movies/<id>/...
        const parts = movie.hlsUrl.split("/streaming-app/");
        if (parts.length > 1) {
          const relativePath = parts[1];
          const newUrl = `${cleanPrefix}/${relativePath}`;

          console.log(`Updating Movie ID ${movie.id}:`);
          console.log(`  Old: ${movie.hlsUrl}`);
          console.log(`  New: ${newUrl}`);

          await movieCollection.updateOne(
            { id: movie.id },
            { $set: { hlsUrl: newUrl } }
          );
        }
      }
    }
    console.log("Database update completed successfully!");
  } catch (err) {
    console.error("Error updating database:", err);
  } finally {
    await client.close();
  }
}

run();
