require("express-async-errors");
require("dotenv").config();
const express = require("express");
const app = express();

const cors = require("cors");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const cookieParser = require("cookie-parser");
const rateLimiter = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");

const noteRouter = require("./routes/noteRoutes");
const attachmentRouter = require("./routes/attachmentRoutes");
const notFoundMiddleware = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");
const authMiddleware = require("./middleware/authentication");
const authRouter = require("./routes/authRoutes");
// after connectDB()

app.set("trust proxy", 1);
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, //15 minutes
    max: 60, //limit each IP to 60 requests per windowMs
  }),
);
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "http://localhost:5000",
    credentials: true,
  }),
);
app.use(mongoSanitize());

app.use(morgan("tiny"));
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(xss());
app.use(express.json());
app.use(cookieParser());

const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10, // only 10 attempts per 15 minutes
  skip: () => process.env.NODE_ENV === "test",
  message: "Too many attempts, please try again later",
});

// 1. The Welcome Page
// This shows up when you go to http://localhost:5000
app.get("/", (req, res) => {
  res.send(
    '<h1>Logpad</h1><p>Welcome! Use the link below to see the docs.</p><a href="/api-docs">Documentation</a>',
  );
});

// 2. The API Health Check
// This is useful for testing if  API versioning is working
app.get("/api/v1", (req, res) => {
  res.status(200).json({ msg: "API is active", version: "v1" });
});

app.use("/api/v1/auth", authLimiter, authRouter);
app.use("/api/v1/notes", authMiddleware, noteRouter);
app.use("/api/v1/attachments", authMiddleware, attachmentRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(notFoundMiddleware);
app.use(errorHandler);

module.exports = app;
