require("dotenv").config();
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const User = require("./models/User");
const Note = require("./models/Note");

const categories = ["backend", "frontend", "database", "devops", "personal"];
const priorities = ["low", "medium", "high"];
const tagPool = [
  "nodejs",
  "express",
  "mongodb",
  "jwt",
  "docker",
  "api",
  "react",
  "security",
];

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to DB");

    const user = await User.findOne();
    if (!user) {
      console.log("No user found");
      process.exit(1);
    }

    await Note.deleteMany();
    console.log("Old notes removed");

    const notes = [];

    for (let i = 0; i < 50; i++) {
      notes.push({
        title: faker.lorem.words(3),
        content: faker.lorem.paragraph(),
        category: categories[Math.floor(Math.random() * categories.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        isPinned: Math.random() > 0.7,
        tags: faker.helpers.arrayElements(tagPool, 3),
        createdBy: user._id,
        isDeleted: false,
        deletedAt: null,
      });
    }

    await Note.insertMany(notes);
    console.log("50 notes inserted");
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

start();
