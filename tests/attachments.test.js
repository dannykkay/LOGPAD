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

// Mock cloudinary — replace upload_stream and destroy with fakes
jest.mock("../config/cloudinary", () => ({
  uploader: {
    upload_stream: jest.fn((options, callback) => {
      // immediately call the callback with a fake cloudinary result
      callback(null, {
        public_id: "logpad/fake-public-id",
        secure_url: "https://res.cloudinary.com/logpad/fake-file.pdf",
        resource_type: "raw",
      });
      // return a writable stream-like object so .pipe() doesn't crash
      return {
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
      };
    }),
    destroy: jest.fn().mockResolvedValue({ result: "ok" }),
  },
}));

// Mock streamifier — replace createReadStream with a fake readable stream
jest.mock("streamifier", () => ({
  createReadStream: jest.fn(() => ({
    pipe: jest.fn(),
  })),
}));

const request = require("supertest");
const app = require("../app");
const { connectTestDB, disconnectTestDB, clearDB } = require("./helpers/setup");
const { createVerifiedUser, createNote } = require("./helpers/factories");

// Helper — creates user, logs in, returns cookies and user
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

describe("Attachment Routes", () => {
  //UPLOAD ATTACHMENT
  describe("POST /api/v1/attachments/:noteId", () => {
    test("should upload a file and return 200", async () => {
      const { user, cookies } = await loginUser();
      const note = await createNote(user._id, {
        title: "Note with attachment",
      });

      const response = await request(app)
        .post(`/api/v1/attachments/${note._id}`)
        .set("Cookie", cookies)
        .attach("files", Buffer.from("fake pdf content"), {
          filename: "test.pdf",
          contentType: "application/pdf",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.attachments).toHaveLength(1);
      expect(response.body.attachments[0].fileName).toBe("test.pdf");
      expect(response.body.attachments[0].url).toBeDefined();
    });

    test("should upload multiple files at once", async () => {
      const { user, cookies } = await loginUser();
      const note = await createNote(user._id, {
        title: "Note with attachments",
      });

      const response = await request(app)
        .post(`/api/v1/attachments/${note._id}`)
        .set("Cookie", cookies)
        .attach("files", Buffer.from("fake pdf content"), {
          filename: "doc1.pdf",
          contentType: "application/pdf",
        })
        .attach("files", Buffer.from("fake image content"), {
          filename: "image.png",
          contentType: "image/png",
        });

      expect(response.status).toBe(200);
      expect(response.body.attachments).toHaveLength(2);
    });

    test("should return 400 if no file is provided", async () => {
      const { user, cookies } = await loginUser();
      const note = await createNote(user._id, { title: "Note" });

      const response = await request(app)
        .post(`/api/v1/attachments/${note._id}`)
        .set("Cookie", cookies);

      expect(response.status).toBe(400);
    });

    test("should return 404 if note does not exist", async () => {
      const { cookies } = await loginUser();
      const fakeId = "64a7f3c2e1b2c3d4e5f6a7b8";

      const response = await request(app)
        .post(`/api/v1/attachments/${fakeId}`)
        .set("Cookie", cookies)
        .attach("files", Buffer.from("fake content"), {
          filename: "test.pdf",
          contentType: "application/pdf",
        });

      expect(response.status).toBe(404);
    });

    test("should return 404 if note belongs to another user", async () => {
      const { cookies } = await loginUser();
      const otherUser = await createVerifiedUser({ email: "other@test.com" });
      const otherNote = await createNote(otherUser._id, {
        title: "Other note",
      });

      const response = await request(app)
        .post(`/api/v1/attachments/${otherNote._id}`)
        .set("Cookie", cookies)
        .attach("files", Buffer.from("fake content"), {
          filename: "test.pdf",
          contentType: "application/pdf",
        });

      expect(response.status).toBe(404);
    });

    test("should return 400 if attachment limit of 10 is exceeded", async () => {
      const { user, cookies } = await loginUser();

      // create a note with 10 existing attachments directly in db
      const note = await createNote(user._id, {
        title: "Full note",
        attachments: Array.from({ length: 10 }, (_, i) => ({
          publicId: `logpad/fake-${i}`,
          url: `https://res.cloudinary.com/logpad/fake-${i}.pdf`,
          fileName: `file-${i}.pdf`,
          fileType: "application/pdf",
          fileSize: 1024,
          resourceType: "raw",
        })),
      });

      const response = await request(app)
        .post(`/api/v1/attachments/${note._id}`)
        .set("Cookie", cookies)
        .attach("files", Buffer.from("fake content"), {
          filename: "overflow.pdf",
          contentType: "application/pdf",
        });

      expect(response.status).toBe(400);
    });

    test("should return 401 if not authenticated", async () => {
      const response = await request(app)
        .post("/api/v1/attachments/fakeid")
        .attach("files", Buffer.from("fake content"), {
          filename: "test.pdf",
          contentType: "application/pdf",
        });

      expect(response.status).toBe(401);
    });
  });

  // ---- GET ATTACHMENT ----
  describe("GET /api/v1/attachments/:attachmentId", () => {
    test("should return attachment details", async () => {
      const { user, cookies } = await loginUser();

      // create a note with an attachment directly in db
      const note = await createNote(user._id, {
        title: "Note with attachment",
        attachments: [
          {
            publicId: "logpad/fake-public-id",
            url: "https://res.cloudinary.com/logpad/fake-file.pdf",
            fileName: "document.pdf",
            fileType: "application/pdf",
            fileSize: 204800,
            resourceType: "raw",
          },
        ],
      });

      const attachmentId = note.attachments[0]._id;

      const response = await request(app)
        .get(`/api/v1/attachments/${attachmentId}`)
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.attachment.fileName).toBe("document.pdf");
      expect(response.body.attachment.url).toBeDefined();
    });

    test("should return 401 if not authenticated", async () => {
      const response = await request(app).get("/api/v1/attachments/fakeid");
      expect(response.status).toBe(401);
    });
  });

  // ---- DELETE ATTACHMENT ----
  describe("DELETE /api/v1/attachments/:noteId/:attachmentId", () => {
    test("should delete an attachment", async () => {
      const { user, cookies } = await loginUser();

      const note = await createNote(user._id, {
        title: "Note with attachment",
        attachments: [
          {
            publicId: "logpad/fake-public-id",
            url: "https://res.cloudinary.com/logpad/fake-file.pdf",
            fileName: "document.pdf",
            fileType: "application/pdf",
            fileSize: 204800,
            resourceType: "raw",
          },
        ],
      });

      const attachmentId = note.attachments[0]._id;

      const response = await request(app)
        .delete(`/api/v1/attachments/${note._id}/${attachmentId}`)
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Attachment deleted successfully");
    });

    test("should return 404 if attachment does not exist", async () => {
      const { user, cookies } = await loginUser();
      const note = await createNote(user._id, { title: "Empty note" });
      const fakeAttachmentId = "64a7f3c2e1b2c3d4e5f6a7b8";

      const response = await request(app)
        .delete(`/api/v1/attachments/${note._id}/${fakeAttachmentId}`)
        .set("Cookie", cookies);

      expect(response.status).toBe(404);
    });

    test("should return 404 if note belongs to another user", async () => {
      const { cookies } = await loginUser();
      const otherUser = await createVerifiedUser({ email: "other@test.com" });

      const otherNote = await createNote(otherUser._id, {
        title: "Other note",
        attachments: [
          {
            publicId: "logpad/fake-public-id",
            url: "https://res.cloudinary.com/logpad/fake-file.pdf",
            fileName: "document.pdf",
            fileType: "application/pdf",
            fileSize: 204800,
            resourceType: "raw",
          },
        ],
      });

      const attachmentId = otherNote.attachments[0]._id;

      const response = await request(app)
        .delete(`/api/v1/attachments/${otherNote._id}/${attachmentId}`)
        .set("Cookie", cookies);

      expect(response.status).toBe(404);
    });

    test("should return 401 if not authenticated", async () => {
      const response = await request(app).delete(
        "/api/v1/attachments/fakeid/fakeattachmentid",
      );
      expect(response.status).toBe(401);
    });
  });

  // ---- DOWNLOAD ATTACHMENT ----
  describe("GET /api/v1/attachments/:attachmentId/download", () => {
    test("should return download url", async () => {
      const { user, cookies } = await loginUser();

      const note = await createNote(user._id, {
        title: "Note with attachment",
        attachments: [
          {
            publicId: "logpad/fake-public-id",
            url: "https://res.cloudinary.com/logpad/fake-file.pdf",
            fileName: "document.pdf",
            fileType: "application/pdf",
            fileSize: 204800,
            resourceType: "raw",
          },
        ],
      });

      const attachmentId = note.attachments[0]._id;

      const response = await request(app)
        .get(`/api/v1/attachments/${attachmentId}/download`)
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.attachment.downloadUrl).toBeDefined();
      expect(response.body.attachment.fileName).toBe("document.pdf");
    });

    test("should return 404 if attachment not found", async () => {
      const { cookies } = await loginUser();
      const fakeId = "64a7f3c2e1b2c3d4e5f6a7b8";

      const response = await request(app)
        .get(`/api/v1/attachments/${fakeId}/download`)
        .set("Cookie", cookies);

      expect(response.status).toBe(404);
    });

    test("should return 401 if not authenticated", async () => {
      const response = await request(app).get(
        "/api/v1/attachments/fakeid/download",
      );
      expect(response.status).toBe(401);
    });
  });
});
