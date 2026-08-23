import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || "streaming_app");
    const movies = await db.collection("movies").find({}).toArray();
    console.log("All Movies in DB:");
    movies.forEach(m => {
      console.log(`ID: ${m.id}, Title: ${m.title}, hlsUrl: ${m.hlsUrl}, transcodingStatus: ${m.transcodingStatus}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
