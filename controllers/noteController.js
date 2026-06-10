const { StatusCodes } = require("http-status-codes");
const Note = require("../models/Note.js");
const { NotFoundError, BadRequestError } = require("../errors");

const getAllNotes = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = req.query.sort || "-createdAt";
  // 1. Initialize the query object with mandatory user protection
  const queryObject = {
    createdBy: req.user.userId,
    isDeleted: false,
  };

  // 2. Extract your parameters from req.query
  const { search, category, priority, isPinned } = req.query;

  // 3. Conditionally ADD search conditions BEFORE executing Note.find()
  if (search) {
    queryObject.$text = {
      $search: search,
    };
  }
  if (category) {
    queryObject.category = category;
  }
  if (priority) {
    queryObject.priority = priority;
  }
  if (isPinned !== undefined) {
    queryObject.isPinned = isPinned === "true";
  }
  // 4. Pass the FULLY BUILT queryObject into Note.find()
  let result = Note.find(queryObject);

  // 5. Chain your sorting and scoring criteria onto the result instance
  if (search) {
    result = result
      .select({
        score: { $meta: "textScore" },
      })
      .sort({
        score: { $meta: "textScore" },
      });
  } else {
    result = result.sort(sort);
  }

  result = result.skip(skip).limit(limit);

  // 7. Finally execute the database query
  const notes = await result;
  const totalNotes = await Note.countDocuments(queryObject);
  const numOfPages = Math.ceil(totalNotes / limit);
  res.status(StatusCodes.OK).json({
    success: true,
    totalNotes,
    numOfPages,
    currentPage: page,
    notes,
    count: notes.length,
  });
};
const getAllNotesAdmin = async (req, res) => {
  const notes = await Note.find({ isDeleted: false });

  res.status(StatusCodes.OK).json({
    success: true,
    count: notes.length,
    notes,
  });
};
const getSIngleNote = async (req, res) => {
  const note = await Note.findOne({
    _id: req.params.noteId,
    createdBy: req.user.userId,
    isDeleted: false,
  });
  if (!note) {
    throw new NotFoundError("Note not found");
  }
  res.status(StatusCodes.OK).json({ success: true, note });
};

const createNote = async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    throw new BadRequestError("provide title and content");
  }
  req.body.createdBy = req.user.userId;
  const note = await Note.create(req.body);
  res.status(StatusCodes.CREATED).json({ success: true, note });
};

const updateNote = async (req, res) => {
  const { noteId } = req.params;
  const note = await Note.findOneAndUpdate(
    { _id: noteId, createdBy: req.user.userId, isDeleted: false },
    req.body,
    {
      returnDocument: "after",
      runValidators: true,
    },
  );
  if (!note) {
    throw new NotFoundError("note not found");
  }

  res.status(StatusCodes.OK).json({ success: true, note });
};
const deleteNote = async (req, res) => {
  const { noteId } = req.params;
  const note = await Note.findOneAndUpdate(
    {
      _id: noteId,
      createdBy: req.user.userId,
      isDeleted: false,
    },
    { isDeleted: true, deletedAt: new Date() },
    { returnDocument: "after" },
  );

  if (!note) {
    throw new NotFoundError("note not found");
  }
  res.status(StatusCodes.OK).json({ success: true, msg: "note deleted" });
};
const restoreNote = async (req, res) => {
  const { noteId } = req.params;

  const note = await Note.findOneAndUpdate(
    { _id: noteId, createdBy: req.user.userId, isDeleted: true },
    { isDeleted: false, deletedAt: null },
    { returnDocument: "after" },
  );

  if (!note) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, message: "Note not found in trash" });
  }

  res
    .status(StatusCodes.OK)
    .json({ success: true, message: "Note restored", note });
};
const permanentlyDeleteNote = async (req, res) => {
  const { noteId } = req.params;

  const note = await Note.findOneAndDelete({
    _id: noteId,
    createdBy: req.user.userId,
    isDeleted: true, // can only permanently delete from trash
  });

  if (!note) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, message: "Note not found in trash" });
  }

  res
    .status(StatusCodes.OK)
    .json({ success: true, message: "Note permanently deleted" });
};
const getTrash = async (req, res) => {
  const notes = await Note.find({
    createdBy: req.user.userId,
    isDeleted: true,
  }).sort("-deletedAt");
  res.status(StatusCodes.OK).json({
    success: true,
    count: notes.length,
    notes,
  });
};

module.exports = {
  getAllNotes,
  getSIngleNote,
  createNote,
  updateNote,
  deleteNote,
  getAllNotesAdmin,
  getTrash,
  restoreNote,
  permanentlyDeleteNote,
};
