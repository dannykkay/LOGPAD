require("dotenv").config();

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue({ id: "fake-email-id" }) },
  })),
}));

const request = require("supertest");
const app = require("../app");
const { connectTestDB, disconnectTestDB, clearDB } = require("./helpers/setup");
const { createVerifiedUser, createNote } = require("./helpers/factories");

// helper that creates a user and logs them in
// returns the cookies to use on authenticated requests
const loginUser = async (overrides = {}) => {
  const email = overrides.email || "daniel@test.com";
  const password = overrides.password || "test1234";

  const user = await createVerifiedUser({ email, password, ...overrides });

  const loginRes = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });

  const cookies = loginRes.headers["set-cookie"];
  return { user, cookies };
};

beforeAll(async () => await connectTestDB());
afterEach(async () => await clearDB());
afterAll(async () => await disconnectTestDB());

describe("Note Routes", () => {
  //  CREATE NOTE
  describe("POST /api/v1/notes", () => {
    test("should create a note and return 201", async () => {
      const { cookies } = await loginUser();

      const response = await request(app)
        .post("/api/v1/notes")
        .set("Cookie", cookies)
        .send({
          title: "My Note",
          content: "Some content",
          category: "backend",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.note.title).toBe("My Note");
      expect(response.body.note.category).toBe("backend");
    });

    test("should return 400 if title is missing", async () => {
      const { cookies } = await loginUser();

      const response = await request(app)
        .post("/api/v1/notes")
        .set("Cookie", cookies)
        .send({ content: "Some content" });

      expect(response.status).toBe(400);
    });

    test("should return 400 if content is missing", async () => {
      const { cookies } = await loginUser();

      const response = await request(app)
        .post("/api/v1/notes")
        .set("Cookie", cookies)
        .send({ title: "My Note" });

      expect(response.status).toBe(400);
    });

    test("should return 401 if not authenticated", async () => {
      const response = await request(app)
        .post("/api/v1/notes")
        .send({ title: "My Note", content: "Some content" });

      expect(response.status).toBe(401);
    });
  });

  //  GET ALL NOTES
  describe("GET /api/v1/notes", () => {
    test("should return only the logged in users notes", async () => {
      const { user, cookies } = await loginUser();

      // create another user with their own note
      const otherUser = await createVerifiedUser({ email: "other@test.com" });
      await createNote(otherUser._id, { title: "Other user note" });

      // create 2 notes for our user
      await createNote(user._id, { title: "My note 1" });
      await createNote(user._id, { title: "My note 2" });

      const response = await request(app)
        .get("/api/v1/notes")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      // should only see their own 2 notes, not the other user's
      expect(response.body.totalNotes).toBe(2);
      expect(response.body.notes).toHaveLength(2);
    });

    test("should filter notes by category", async () => {
      const { user, cookies } = await loginUser();

      await createNote(user._id, {
        title: "Backend note",
        category: "backend",
      });
      await createNote(user._id, {
        title: "Frontend note",
        category: "frontend",
      });

      const response = await request(app)
        .get("/api/v1/notes?category=backend")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.totalNotes).toBe(1);
      expect(response.body.notes[0].category).toBe("backend");
    });

    test("should filter notes by priority", async () => {
      const { user, cookies } = await loginUser();

      await createNote(user._id, { title: "High note", priority: "high" });
      await createNote(user._id, { title: "Low note", priority: "low" });

      const response = await request(app)
        .get("/api/v1/notes?priority=high")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.totalNotes).toBe(1);
      expect(response.body.notes[0].priority).toBe("high");
    });

    test("should filter pinned notes", async () => {
      const { user, cookies } = await loginUser();

      await createNote(user._id, { title: "Pinned note", isPinned: true });
      await createNote(user._id, { title: "Normal note", isPinned: false });

      const response = await request(app)
        .get("/api/v1/notes?isPinned=true")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.totalNotes).toBe(1);
      expect(response.body.notes[0].isPinned).toBe(true);
    });

    test("should not return deleted notes", async () => {
      const { user, cookies } = await loginUser();

      await createNote(user._id, { title: "Active note" });
      await createNote(user._id, { title: "Deleted note", isDeleted: true });

      const response = await request(app)
        .get("/api/v1/notes")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.totalNotes).toBe(1);
    });

    test("should paginate results", async () => {
      const { user, cookies } = await loginUser();

      // create 3 notes
      await createNote(user._id, { title: "Note 1" });
      await createNote(user._id, { title: "Note 2" });
      await createNote(user._id, { title: "Note 3" });

      const response = await request(app)
        .get("/api/v1/notes?limit=2&page=1")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.notes).toHaveLength(2);
      expect(response.body.numOfPages).toBe(2);
      expect(response.body.totalNotes).toBe(3);
    });
  });

  // ---- GET SINGLE NOTE ----
  describe("GET /api/v1/notes/:noteId", () => {
    test("should return a single note", async () => {
      const { user, cookies } = await loginUser();
      const note = await createNote(user._id, { title: "My note" });

      const response = await request(app)
        .get(`/api/v1/notes/${note._id}`)
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.note._id).toBe(note._id.toString());
    });

    test("should return 404 for another users note", async () => {
      const { cookies } = await loginUser();
      const otherUser = await createVerifiedUser({ email: "other@test.com" });
      const otherNote = await createNote(otherUser._id, {
        title: "Other note",
      });

      const response = await request(app)
        .get(`/api/v1/notes/${otherNote._id}`)
        .set("Cookie", cookies);

      expect(response.status).toBe(404);
    });

    test("should return 404 for deleted note", async () => {
      const { user, cookies } = await loginUser();
      const note = await createNote(user._id, {
        title: "Deleted",
        isDeleted: true,
      });

      const response = await request(app)
        .get(`/api/v1/notes/${note._id}`)
        .set("Cookie", cookies);

      expect(response.status).toBe(404);
    });
  });

  // ---- UPDATE NOTE ----
  describe("PATCH /api/v1/notes/:noteId", () => {
    test("should update a note", async () => {
      const { user, cookies } = await loginUser();
      const note = await createNote(user._id, { title: "Old title" });

      const response = await request(app)
        .patch(`/api/v1/notes/${note._id}`)
        .set("Cookie", cookies)
        .send({ title: "New title" });

      expect(response.status).toBe(200);
      expect(response.body.note.title).toBe("New title");
    });

    test("should return 404 for another users note", async () => {
      const { cookies } = await loginUser();
      const otherUser = await createVerifiedUser({ email: "other@test.com" });
      const otherNote = await createNote(otherUser._id, {
        title: "Other note",
      });

      const response = await request(app)
        .patch(`/api/v1/notes/${otherNote._id}`)
        .set("Cookie", cookies)
        .send({ title: "Hacked title" });

      expect(response.status).toBe(404);
    });
  });

  // ---- DELETE NOTE (soft) ----
  describe("DELETE /api/v1/notes/:noteId", () => {
    test("should soft delete a note and move it to trash", async () => {
      const { user, cookies } = await loginUser();
      const note = await createNote(user._id, { title: "To delete" });

      const deleteResponse = await request(app)
        .delete(`/api/v1/notes/${note._id}`)
        .set("Cookie", cookies);

      expect(deleteResponse.status).toBe(200);

      // confirm it no longer appears in main notes
      const getResponse = await request(app)
        .get("/api/v1/notes")
        .set("Cookie", cookies);

      expect(getResponse.body.totalNotes).toBe(0);

      // confirm it appears in trash
      const trashResponse = await request(app)
        .get("/api/v1/notes/trash")
        .set("Cookie", cookies);

      expect(trashResponse.body.count).toBe(1);
    });
  });

  // ---- TRASH ----
  describe("GET /api/v1/notes/trash", () => {
    test("should return only deleted notes", async () => {
      const { user, cookies } = await loginUser();

      await createNote(user._id, { title: "Active note" });
      await createNote(user._id, {
        title: "Deleted note",
        isDeleted: true,
        deletedAt: new Date(),
      });

      const response = await request(app)
        .get("/api/v1/notes/trash")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(response.body.notes[0].title).toBe("Deleted note");
    });
  });

  // ---- RESTORE ----
  describe("PATCH /api/v1/notes/:noteId/restore", () => {
    test("should restore a note from trash", async () => {
      const { user, cookies } = await loginUser();
      const note = await createNote(user._id, {
        title: "Deleted note",
        isDeleted: true,
        deletedAt: new Date(),
      });

      const response = await request(app)
        .patch(`/api/v1/notes/${note._id}/restore`)
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.note.isDeleted).toBe(false);

      // confirm it's back in main notes
      const getResponse = await request(app)
        .get("/api/v1/notes")
        .set("Cookie", cookies);

      expect(getResponse.body.totalNotes).toBe(1);
    });
  });

  // ---- PERMANENT DELETE ----
  describe("DELETE /api/v1/notes/:noteId/permanent", () => {
    test("should permanently delete a note from trash", async () => {
      const { user, cookies } = await loginUser();
      const note = await createNote(user._id, {
        title: "To permanently delete",
        isDeleted: true,
        deletedAt: new Date(),
      });

      const response = await request(app)
        .delete(`/api/v1/notes/${note._id}/permanent`)
        .set("Cookie", cookies);

      expect(response.status).toBe(200);

      // confirm it's gone from trash too
      const trashResponse = await request(app)
        .get("/api/v1/notes/trash")
        .set("Cookie", cookies);

      expect(trashResponse.body.count).toBe(0);
    });

    test("should return 404 if note is not in trash", async () => {
      const { user, cookies } = await loginUser();
      // active note, not deleted
      const note = await createNote(user._id, { title: "Active note" });

      const response = await request(app)
        .delete(`/api/v1/notes/${note._id}/permanent`)
        .set("Cookie", cookies);

      expect(response.status).toBe(404);
    });
  });
});
