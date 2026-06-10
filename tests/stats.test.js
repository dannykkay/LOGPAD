require("dotenv").config();

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
const Note = require("../models/Note");
const { connectTestDB, disconnectTestDB, clearDB } = require("./helpers/setup");
const { createVerifiedUser, createNote } = require("./helpers/factories");

// Helper — creates user, logs in, returns cookies and userId
const loginUser = async () => {
  const user = await createVerifiedUser({
    email: "daniel@test.com",
    password: "test1234",
  });

  const loginRes = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "daniel@test.com", password: "test1234" });

  const cookies = loginRes.headers["set-cookie"];
  return { user, cookies };
};

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe("Stats Routes", () => {
  // ---- NOTE STATS ----
  describe("GET /api/v1/notes/stats", () => {
    test("should return correct total notes count", async () => {
      const { user, cookies } = await loginUser();

      await createNote(user._id, { title: "Note 1" });
      await createNote(user._id, { title: "Note 2" });
      await createNote(user._id, { title: "Note 3" });

      const response = await request(app)
        .get("/api/v1/notes/stats")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.totalNotes).toBe(3);
    });

    test("should return correct pinned notes count", async () => {
      const { user, cookies } = await loginUser();

      await createNote(user._id, { title: "Pinned 1", isPinned: true });
      await createNote(user._id, { title: "Pinned 2", isPinned: true });
      await createNote(user._id, { title: "Not pinned", isPinned: false });

      const response = await request(app)
        .get("/api/v1/notes/stats")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.pinnedNotes).toBe(2);
    });

    test("should return correct priority breakdown", async () => {
      const { user, cookies } = await loginUser();

      await createNote(user._id, { title: "Low 1", priority: "low" });
      await createNote(user._id, { title: "Low 2", priority: "low" });
      await createNote(user._id, { title: "High 1", priority: "high" });
      await createNote(user._id, { title: "Medium 1", priority: "medium" });

      const response = await request(app)
        .get("/api/v1/notes/stats")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.priorityStats.low).toBe(2);
      expect(response.body.priorityStats.high).toBe(1);
      expect(response.body.priorityStats.medium).toBe(1);
    });

    test("should return correct category breakdown", async () => {
      const { user, cookies } = await loginUser();

      await createNote(user._id, { title: "Backend 1", category: "backend" });
      await createNote(user._id, { title: "Backend 2", category: "backend" });
      await createNote(user._id, { title: "Personal 1", category: "personal" });

      const response = await request(app)
        .get("/api/v1/notes/stats")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.categoryStats.backend).toBe(2);
      expect(response.body.categoryStats.personal).toBe(1);
    });

    test("should exclude deleted notes from stats", async () => {
      const { user, cookies } = await loginUser();

      await createNote(user._id, { title: "Active note" });
      await createNote(user._id, {
        title: "Deleted note",
        isDeleted: true,
        deletedAt: new Date(),
      });

      const response = await request(app)
        .get("/api/v1/notes/stats")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      // deleted note should not be counted
      expect(response.body.totalNotes).toBe(1);
    });

    test("should only return stats for logged in user", async () => {
      const { user, cookies } = await loginUser();

      // create notes for logged in user
      await createNote(user._id, { title: "My note 1" });
      await createNote(user._id, { title: "My note 2" });

      // create notes for another user
      const otherUser = await createVerifiedUser({ email: "other@test.com" });
      await createNote(otherUser._id, { title: "Other note 1" });
      await createNote(otherUser._id, { title: "Other note 2" });
      await createNote(otherUser._id, { title: "Other note 3" });

      const response = await request(app)
        .get("/api/v1/notes/stats")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      // should only count logged in users 2 notes
      expect(response.body.totalNotes).toBe(2);
    });

    test("should return 401 without auth", async () => {
      const response = await request(app).get("/api/v1/notes/stats");
      expect(response.status).toBe(401);
    });

    test("should return zeros when user has no notes", async () => {
      const { cookies } = await loginUser();

      const response = await request(app)
        .get("/api/v1/notes/stats")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.totalNotes).toBe(0);
      expect(response.body.pinnedNotes).toBe(0);
    });
  });

  // ---- MONTHLY STATS ----
  describe("GET /api/v1/notes/stats/monthly", () => {
    test("should return monthly breakdown", async () => {
      const { user, cookies } = await loginUser();

      // create notes with specific dates using direct DB insert
      // to control the createdAt timestamp
      await Note.create({
        title: "January note 1",
        content: "Content",
        createdBy: user._id,
        createdAt: new Date("2024-01-15"),
      });
      await Note.create({
        title: "January note 2",
        content: "Content",
        createdBy: user._id,
        createdAt: new Date("2024-01-20"),
      });
      await Note.create({
        title: "February note",
        content: "Content",
        createdBy: user._id,
        createdAt: new Date("2024-02-10"),
      });

      const response = await request(app)
        .get("/api/v1/notes/stats/monthly")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.monthlyStats).toHaveLength(2);
      expect(response.body.monthlyStats[0].month).toBe("2024-01");
      expect(response.body.monthlyStats[0].count).toBe(2);
      expect(response.body.monthlyStats[1].month).toBe("2024-02");
      expect(response.body.monthlyStats[1].count).toBe(1);
    });

    test("should exclude deleted notes from monthly stats", async () => {
      const { user, cookies } = await loginUser();

      await Note.create({
        title: "Active note",
        content: "Content",
        createdBy: user._id,
        createdAt: new Date("2024-01-15"),
      });
      await Note.create({
        title: "Deleted note",
        content: "Content",
        createdBy: user._id,
        createdAt: new Date("2024-01-20"),
        isDeleted: true,
        deletedAt: new Date(),
      });

      const response = await request(app)
        .get("/api/v1/notes/stats/monthly")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.monthlyStats[0].count).toBe(1);
    });

    test("should return 401 without auth", async () => {
      const response = await request(app).get("/api/v1/notes/stats/monthly");
      expect(response.status).toBe(401);
    });

    test("should return empty array when user has no notes", async () => {
      const { cookies } = await loginUser();

      const response = await request(app)
        .get("/api/v1/notes/stats/monthly")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.monthlyStats).toHaveLength(0);
    });
  });
});
