import { GenreService } from "../services/genreService.js";

/**
 * Controller for genre catalog operations
 */

export async function getGenres(req, res) {
  try {
    const genres = await GenreService.getAllGenres();
    return res.status(200).json({ success: true, genres });
  } catch (error) {
    console.error("getGenres Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching genres catalog."
    });
  }
}

export async function createGenre(req, res) {
  const { name } = req.body;

  try {
    const genre = await GenreService.createGenre(name);
    return res.status(201).json({ success: true, genre });
  } catch (error) {
    console.error("createGenre Controller Error:", error.message);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to create new genre."
    });
  }
}

export async function updateGenre(req, res) {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const genre = await GenreService.updateGenre(id, name);
    return res.status(200).json({ success: true, genre });
  } catch (error) {
    console.error("updateGenre Controller Error:", error.message);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to update genre."
    });
  }
}

export async function deleteGenre(req, res) {
  const { id } = req.params;

  try {
    const genre = await GenreService.deleteGenre(id);
    return res.status(200).json({
      success: true,
      message: "Genre deleted successfully.",
      genre
    });
  } catch (error) {
    console.error("deleteGenre Controller Error:", error.message);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to delete genre."
    });
  }
}
