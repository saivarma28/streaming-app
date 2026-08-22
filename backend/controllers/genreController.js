import { getDb, getNextSequenceValue } from "../config/mongodb.js";

/**
 * Retrieves all genres from the database.
 * GET /api/genres
 */
export async function getGenres(req, res) {
  try {
    const db = getDb();
    const genres = await db.collection("genres")
      .find({})
      .sort({ name: 1 })
      .toArray();

    return res.status(200).json({
      success: true,
      genres
    });
  } catch (error) {
    console.error("getGenres Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching genres catalog."
    });
  }
}

/**
 * Creates a new genre. (Admin only)
 * POST /api/genres
 */
export async function createGenre(req, res) {
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Genre name is required."
    });
  }

  const normalizedName = name.trim();

  try {
    const db = getDb();
    const genreCollection = db.collection("genres");

    // Check if the genre already exists
    const existingGenre = await genreCollection.findOne({ name: normalizedName });

    if (existingGenre) {
      return res.status(400).json({
        success: false,
        message: "Genre with this name already exists."
      });
    }

    const newId = await getNextSequenceValue("genres");
    const newGenreDoc = {
      id: newId,
      name: normalizedName,
      createdAt: new Date()
    };

    await genreCollection.insertOne(newGenreDoc);

    return res.status(201).json({
      success: true,
      genre: newGenreDoc
    });
  } catch (error) {
    console.error("createGenre Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create new genre."
    });
  }
}

/**
 * Updates an existing genre. (Admin only)
 * PUT /api/genres/:id
 */
export async function updateGenre(req, res) {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Genre name is required."
    });
  }

  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid genre ID."
    });
  }

  try {
    const db = getDb();
    const genreCollection = db.collection("genres");
    const normalizedName = name.trim();

    // Check if another genre exists with this name
    const existingGenre = await genreCollection.findOne({
      name: normalizedName,
      id: { $ne: parsedId }
    });

    if (existingGenre) {
      return res.status(400).json({
        success: false,
        message: "Another genre with this name already exists."
      });
    }

    await genreCollection.updateOne(
      { id: parsedId },
      { $set: { name: normalizedName } }
    );

    const updatedGenre = await genreCollection.findOne({ id: parsedId });

    return res.status(200).json({
      success: true,
      genre: updatedGenre
    });
  } catch (error) {
    console.error("updateGenre Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update genre."
    });
  }
}

/**
 * Deletes an existing genre. (Admin only)
 * DELETE /api/genres/:id
 */
export async function deleteGenre(req, res) {
  const { id } = req.params;

  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid genre ID."
    });
  }

  try {
    const db = getDb();
    const genreCollection = db.collection("genres");

    const deletedGenre = await genreCollection.findOne({ id: parsedId });

    if (!deletedGenre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found."
      });
    }

    await genreCollection.deleteOne({ id: parsedId });

    // Remove this genre association from any movies
    await db.collection("movies").updateMany(
      { genreIds: parsedId },
      { $pull: { genreIds: parsedId } }
    );

    return res.status(200).json({
      success: true,
      message: "Genre deleted successfully.",
      genre: deletedGenre
    });
  } catch (error) {
    console.error("deleteGenre Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete genre."
    });
  }
}
