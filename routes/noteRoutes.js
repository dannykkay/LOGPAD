const express = require("express");
const router = express.Router();
const authorizePermissions = require("../middleware/authorization");
const {
  getAllNotes,
  getSIngleNote,
  createNote,
  updateNote,
  deleteNote,
  getAllNotesAdmin,
  getTrash,
  restoreNote,
  permanentlyDeleteNote,
} = require("../controllers/noteController");
const {
  getNoteStats,
  getMonthlyStats,
} = require("../controllers/statsController");

router.route("/admin").get(authorizePermissions("admin"), getAllNotesAdmin);

router.route("/").get(getAllNotes).post(createNote);
router.route("/trash").get(getTrash);
router.route("/stats").get(getNoteStats);
router.route("/stats/monthly").get(getMonthlyStats);

router
  .route("/:noteId")
  .get(getSIngleNote)
  .patch(updateNote)
  .delete(deleteNote);
router.route("/:noteId/restore").patch(restoreNote);
router.route("/:noteId/permanent").delete(permanentlyDeleteNote);
module.exports = router;
