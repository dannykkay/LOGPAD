const express = require("express");
const router = express.Router();
const authorizePermissions = require("../middleware/authorization");
const {
  uploadAttachment,
  deleteAttachment,
  getAttachment,
  downloadAttachment,
} = require("../controllers/attachmentController");
const upload = require("../middleware/uploadMiddleware");

router.route("/:noteId").post(upload.array("files", 5), uploadAttachment);
router.route("/:noteId/:attachmentId").delete(deleteAttachment);
router.route("/:attachmentId").get(getAttachment);
router.route("/:attachmentId/download").get(downloadAttachment);
module.exports = router;
