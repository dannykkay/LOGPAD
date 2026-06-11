require("dotenv").config();
const app = require("./app");
const connectDB = require("./db/connect");

const autoCleanTrash = require("./cronJobs");

const port = process.env.PORT || 5000;
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL);
    autoCleanTrash();
    app.listen(port, () => {
      console.log(`server is listening on ${port} `);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
