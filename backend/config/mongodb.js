import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.warn("WARNING: MONGODB_URI environment variable is missing. Database operations will fail unless set.");
}

let client = null;
let db = null;
let connectionPromise = null;

/**
 * Connects to MongoDB Atlas and caches the db instance.
 */
export async function connectToDatabase() {
  if (db) return db;

  if (connectionPromise) {
    return connectionPromise;
  }

  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables.");
  }

  const dbName = process.env.MONGODB_DB_NAME || "streaming_app";

  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
    });
    
    connectionPromise = client.connect().then(() => {
      db = client.db(dbName);
      console.log(`SUCCESS: Connected to MongoDB Atlas database: ${dbName}`);
      return db;
    });

    await connectionPromise;
    return db;
  } catch (error) {
    connectionPromise = null;
    client = null;
    db = null;
    console.error("CRITICAL ERROR: Failed to connect to MongoDB Atlas:", error.message);
    throw error;
  }
}

/**
 * Retrieves the cached db instance.
 */
export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call connectToDatabase first.");
  }
  return db;
}

/**
 * Returns the next auto-increment sequence value for numeric IDs.
 * Uses a 'counters' collection to implement auto-increment in MongoDB.
 * 
 * @param {string} sequenceName - Sequence name (e.g. 'users', 'movies')
 * @returns {Promise<number>} - The next integer ID
 */
export async function getNextSequenceValue(sequenceName) {
  const database = getDb();
  const counterCollection = database.collection("counters");
  
  const result = await counterCollection.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { sequence_value: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  
  return result.sequence_value;
}

/**
 * Closes the active MongoDB connection.
 */
export async function closeDatabaseConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    connectionPromise = null;
    console.log("MongoDB connection closed.");
  }
}
