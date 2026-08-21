import { prisma } from "../config/db.js";

/**
 * Retrieves all genres from the database.
 * GET /api/genres
 */
export async function getGenres(req, res) {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { name: "asc" }
    });

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
    // Check if the genre already exists
    const existingGenre = await prisma.genre.findUnique({
      where: { name: normalizedName }
    });

    if (existingGenre) {
      return res.status(400).json({
        success: false,
        message: "Genre with this name already exists."
      });
    }

    const genre = await prisma.genre.create({
      data: { name: normalizedName }
    });

    return res.status(201).json({
      success: true,
      genre
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
    const normalizedName = name.trim();

    // Check if another genre exists with this name
    const existingGenre = await prisma.genre.findFirst({
      where: {
        name: normalizedName,
        NOT: { id: parsedId }
      }
    });

    if (existingGenre) {
      return res.status(400).json({
        success: false,
        message: "Another genre with this name already exists."
      });
    }

    const updatedGenre = await prisma.genre.update({
      where: { id: parsedId },
      data: { name: normalizedName }
    });

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
    const deletedGenre = await prisma.genre.delete({
      where: { id: parsedId }
    });

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
