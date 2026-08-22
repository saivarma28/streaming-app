import { prisma } from "./config/db.js";
import { connectToDatabase, closeDatabaseConnection } from "./config/mongodb.js";
import dotenv from "dotenv";

dotenv.config();

async function migrate() {
  console.log("Starting PostgreSQL to MongoDB Migration...");
  
  if (!process.env.MONGODB_URI) {
    console.error("CRITICAL ERROR: MONGODB_URI environment variable is missing.");
    process.exitCode = 1;
    return;
  }

  let migrationFailed = false;

  try {
    // Connect to MongoDB
    const db = await connectToDatabase();
    
    // 1. Migrate Users
    console.log("Migrating users...");
    const users = await prisma.user.findMany();
    if (users.length > 0) {
      for (const user of users) {
        await db.collection("users").replaceOne({ id: user.id }, user, { upsert: true });
      }
      console.log(`Successfully migrated/synced ${users.length} users.`);
    } else {
      console.log("No users found to migrate.");
    }
    
    // 2. Migrate Genres
    console.log("Migrating genres...");
    const genres = await prisma.genre.findMany();
    if (genres.length > 0) {
      for (const genre of genres) {
        await db.collection("genres").replaceOne({ id: genre.id }, genre, { upsert: true });
      }
      console.log(`Successfully migrated/synced ${genres.length} genres.`);
    } else {
      console.log("No genres found to migrate.");
    }
    
    // 3. Migrate Movies
    console.log("Migrating movies...");
    const movies = await prisma.movie.findMany({
      include: {
        genres: true
      }
    });
    if (movies.length > 0) {
      const moviesToInsert = movies.map(movie => {
        // Capture genreIds and remove nested genres representation for flat document insertion
        const genreIds = movie.genres.map(g => g.id);
        const { genres, ...movieData } = movie;
        return {
          ...movieData,
          genreIds // Storing array of genre ID integers
        };
      });
      
      for (const movieDoc of moviesToInsert) {
        await db.collection("movies").replaceOne({ id: movieDoc.id }, movieDoc, { upsert: true });
      }
      console.log(`Successfully migrated/synced ${movies.length} movies.`);
    } else {
      console.log("No movies found to migrate.");
    }
    
    // 4. Migrate Watch Histories
    console.log("Migrating watch history...");
    const watchHistories = await prisma.watchHistory.findMany();
    if (watchHistories.length > 0) {
      for (const history of watchHistories) {
        await db.collection("watch_histories").replaceOne({ id: history.id }, history, { upsert: true });
      }
      console.log(`Successfully migrated/synced ${watchHistories.length} watch histories.`);
    } else {
      console.log("No watch histories found to migrate.");
    }
    
    // 5. Initialize Counters Safely
    console.log("Initializing auto-increment counters...");
    
    const maxUserId = users.reduce((max, u) => Math.max(max, u.id), 0);
    const maxGenreId = genres.reduce((max, g) => Math.max(max, g.id), 0);
    const maxMovieId = movies.reduce((max, m) => Math.max(max, m.id), 0);
    const maxHistoryId = watchHistories.reduce((max, w) => Math.max(max, w.id), 0);
    
    const updateCounter = async (sequenceName, value) => {
      const counterCollection = db.collection("counters");
      const current = await counterCollection.findOne({ _id: sequenceName });
      if (!current || current.sequence_value < value) {
        await counterCollection.replaceOne(
          { _id: sequenceName },
          { _id: sequenceName, sequence_value: value },
          { upsert: true }
        );
      }
    };

    await updateCounter("users", maxUserId);
    await updateCounter("genres", maxGenreId);
    await updateCounter("movies", maxMovieId);
    await updateCounter("watch_histories", maxHistoryId);
    
    console.log("Auto-increment counters initialized/synced:");
    console.log(`- Users: ${maxUserId}`);
    console.log(`- Genres: ${maxGenreId}`);
    console.log(`- Movies: ${maxMovieId}`);
    console.log(`- Watch Histories: ${maxHistoryId}`);
    
    console.log("\nMIGRATION COMPLETED SUCCESSFULLY!");
  } catch (error) {
    console.error("Migration failed:", error);
    migrationFailed = true;
    process.exitCode = 1;
  } finally {
    try {
      await prisma.$disconnect();
    } catch (dbErr) {
      console.error("Failed to disconnect from Prisma/PostgreSQL:", dbErr.message);
    }
    try {
      await closeDatabaseConnection();
    } catch (mongoErr) {
      console.error("Failed to close MongoDB connection:", mongoErr.message);
    }
    console.log(`Migration utility terminated with status: ${migrationFailed ? "FAILED" : "SUCCESS"}`);
  }
}

migrate();
