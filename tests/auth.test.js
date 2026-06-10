require("dotenv").config();
// Mock Resend BEFORE any imports that use it
// Jest replaces the real Resend with a fake version
// that does nothing but return success
jest.mock("resend", () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({ id: "fake-email-id" }),
      },
    })),
  };
});

const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const { connectTestDB, disconnectTestDB, clearDB } = require("./helpers/setup");
const { createVerifiedUser } = require("./helpers/factories");

// runs once before all tests — connects to memory db
beforeAll(async () => {
  await connectTestDB();
}, 6000);

// runs after every single test — wipes db clean
// so each test starts with empty collections
afterEach(async () => {
  await clearDB();
});

// runs once after all tests — disconnects and stops memory server
afterAll(async () => {
  await disconnectTestDB();
});

describe("Auth Routes", () => {
  // REGISTER
  describe("POST /api/v1/auth/register", () => {
    test("should register a new user and return 201", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        name: "Daniel",
        email: "daniel@test.com",
        password: "test1234",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.msg).toBe("Verification code sent to email");
    });

    test("should return 400 if email already exists", async () => {
      // create a user first
      await createVerifiedUser({ email: "daniel@test.com" });

      const response = await request(app).post("/api/v1/auth/register").send({
        name: "Daniel",
        email: "daniel@test.com",
        password: "test1234",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should return 400 if required fields are missing", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({ email: "daniel@test.com" }); // missing name and password

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/auth/verify-email", () => {
    test("should verify email with correct code", async () => {
      // register first to get a real verification token in db
      const crypto = require("crypto");
      const code = "123456";
      const hashedToken = crypto
        .createHash("sha256")
        .update(code)
        .digest("hex");

      await User.create({
        name: "Daniel",
        email: "daniel@test.com",
        password: "test1234",
        isVerified: false,
        verificationToken: hashedToken,
        verificationTokenExpires: Date.now() + 10 * 60 * 1000,
      });

      const response = await request(app)
        .post("/api/v1/auth/verify-email")
        .send({ email: "daniel@test.com", verificationCode: code });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should return 400 for invalid verification code", async () => {
      await User.create({
        name: "Daniel",
        email: "daniel@test.com",
        password: "test1234",
        isVerified: false,
        verificationToken: "somehashedtoken",
        verificationTokenExpires: Date.now() + 10 * 60 * 1000,
      });

      const response = await request(app)
        .post("/api/v1/auth/verify-email")
        .send({ email: "daniel@test.com", verificationCode: "000000" });

      expect(response.status).toBe(400);
    });
  });

  //  LOGIN
  describe("POST /api/v1/auth/login", () => {
    test("should login verified user and return 200 with accessToken", async () => {
      await createVerifiedUser({
        email: "daniel@test.com",
        password: "test1234",
      });

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "daniel@test.com", password: "test1234" });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.name).toBeDefined();
    });

    test("should return 401 for wrong password", async () => {
      await createVerifiedUser({ email: "daniel@test.com" });

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "daniel@test.com", password: "wrongpassword" });

      expect(response.status).toBe(401);
    });

    test("should return 401 for unverified user", async () => {
      await User.create({
        name: "Daniel",
        email: "daniel@test.com",
        password: "test1234",
        isVerified: false,
      });

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "daniel@test.com", password: "test1234" });

      expect(response.status).toBe(401);
    });
  });

  //  LOGOUT
  describe("POST /api/v1/auth/logout", () => {
    test("should logout and clear cookies", async () => {
      // login first to get cookies
      await createVerifiedUser({
        email: "daniel@test.com",
        password: "test1234",
      });

      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "daniel@test.com", password: "test1234" });

      // use the cookies from login in the logout request
      const cookies = loginResponse.headers["set-cookie"];

      const response = await request(app)
        .post("/api/v1/auth/logout")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
