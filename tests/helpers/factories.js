const User = require("../../models/User");
const Note = require("../../models/Note");

const createVerifiedUser = async (overrides = {}) => {
  const user = await User.create({
    name: "Test User",
    email: "test@example.com",
    password: "test1234",
    isVerified: true,
    ...overrides,
  });
  return user;
};

const createNote = async (userId, overrides = {}) => {
  const note = await Note.create({
    title: "Test Note",
    content: "Test content",
    createdBy: userId,
    ...overrides,
  });
  return note;
};

module.exports = { createVerifiedUser, createNote };
