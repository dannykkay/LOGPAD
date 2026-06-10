const { StatusCodes } = require("http-status-codes");
const Note = require("../models/Note.js");
const { NotFoundError, BadRequestError } = require("../errors");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const uploadAttachment = async (req, res) => {
  const note = await Note.findOne({
    _id: req.params.noteId,
    createdBy: req.user.userId,
    isDeleted: false,
  });

  if (!note) {
    throw new NotFoundError("Note not found");
  }

  if (!req.files || req.files.length === 0) {
    throw new BadRequestError("Please upload a file");
  }

  if (note.attachments.length + req.files.length > 10) {
    throw new BadRequestError("Maximum attachment limit reached");
  }
  for (const file of req.files) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "notes-api", resource_type: "auto" },
        (error, result) => {
          if (error) reject(error);
          resolve(result);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(stream);
    });

    note.attachments.push({
      publicId: result.public_id,
      url: result.secure_url,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      resourceType: result.resource_type,
    });
  }
  await note.save();
  res.status(StatusCodes.OK).json({
    success: true,
    attachments: note.attachments,
  });
};

const deleteAttachment = async (req, res) => {
  const note = await Note.findOne({
    _id: req.params.noteId,
    createdBy: req.user.userId,
    isDeleted: false,
  });

  if (!note) {
    throw new NotFoundError("Note not found");
  }
  // Locates a single attachment object within the array using its unique Mongoose sub-document ID
  const attachment = note.attachments.id(req.params.attachmentId);

  if (!attachment) {
    throw new NotFoundError("Attachment not found");
  }
  await cloudinary.uploader.destroy(attachment.publicId, {
    resource_type: attachment.resourceType,
  });
  note.attachments.pull(req.params.attachmentId);
  await note.save();
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Attachment deleted successfully",
  });
};

const getAttachment = async (req, res) => {
  const note = await Note.findOne({
    createdBy: req.user.userId,

    isDeleted: false,

    "attachments._id": req.params.attachmentId,
  });
  const attachment = note.attachments.id(req.params.attachmentId);
  res.status(StatusCodes.OK).json({
    success: true,

    attachment: {
      id: attachment._id,

      fileName: attachment.fileName,

      fileType: attachment.fileType,

      fileSize: attachment.fileSize,

      url: attachment.url,

      uploadedAt: attachment.uploadedAt,
      resourceType: attachment.resourceType,
    },
  });
};

const downloadAttachment = async (req, res) => {
  const note = await Note.findOne({
    createdBy: req.user.userId,

    isDeleted: false,

    "attachments._id": req.params.attachmentId,
  });

  if (!note) {
    throw new NotFoundError("Attachment not found");
  }

  const attachment = note.attachments.id(req.params.attachmentId);

  if (!attachment) {
    throw new NotFoundError("Attachment not found");
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    attachment: {
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      downloadUrl: attachment.url,
    },
  });
};
module.exports = {
  uploadAttachment,
  deleteAttachment,
  getAttachment,
  downloadAttachment,
};
