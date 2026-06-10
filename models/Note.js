const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide title"],
      trim: true,

      maxlength: 100,
    },

    content: {
      type: String,
      required: [true, "Please provide content"],
    },

    category: {
      type: String,
      default: "general",
    },

    tags: {
      type: [String],
      default: [],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    isPinned: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    attachments: [
      {
        publicId: {
          type: String,
          required: true,
        },

        url: {
          type: String,
          required: true,
        },

        fileName: {
          type: String,
          required: true,
        },

        fileType: {
          type: String,
          required: true,
        },
        fileSize: {
          type: Number,
          required: true, // size in bytes
        },
        resourceType: { type: String, required: true },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);
NoteSchema.index({
  createdBy: 1,
  category: 1,
  isPinned: 1,
  isDeleted: 1,
  createdAt: -1,
});

NoteSchema.index({
  title: "text",
  content: "text",
  tags: "text",
});
NoteSchema.index({ title: 1, createdBy: 1 }, { unique: true });
module.exports = mongoose.model("Note", NoteSchema);
