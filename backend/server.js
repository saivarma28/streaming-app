import app from "./app.js";
import { connectToDatabase } from "./config/mongodb.js";

const PORT = process.env.PORT || 5000;

connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("FATAL ERROR: Could not start backend server due to MongoDB connection failure:", err.message);
    process.exit(1);
  });
