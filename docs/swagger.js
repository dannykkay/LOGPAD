const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Logpad API",
      version: "1.0.0",
      description:
        "A powerful notes API with authentication, full-text search, attachments, and smart analytics.",
    },
    servers: [
      {
        url: "https://logpad.onrender.com",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            name: { type: "string", example: "John Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            role: { type: "string", enum: ["user", "admin"], example: "user" },
            isVerified: { type: "boolean", example: true },
          },
        },
        Note: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64a7f3c2e1b2c3d4e5f6a7b8" },
            title: { type: "string", example: "My first note" },
            content: { type: "string", example: "This is the note content" },
            category: { type: "string", example: "backend" },
            tags: {
              type: "array",
              items: { type: "string" },
              example: ["nodejs", "mongodb"],
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high"],
              example: "medium",
            },
            isPinned: { type: "boolean", example: false },
            isDeleted: { type: "boolean", example: false },
            deletedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: null,
            },
            attachments: {
              type: "array",
              items: { $ref: "#/components/schemas/Attachment" },
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
        },
        Attachment: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64a7f3c2e1b2c3d4e5f6a7b8" },
            fileName: { type: "string", example: "document.pdf" },
            fileType: { type: "string", example: "application/pdf" },
            fileSize: { type: "number", example: 204800 },
            url: {
              type: "string",
              example: "https://res.cloudinary.com/logpad/document.pdf",
            },
            resourceType: { type: "string", example: "raw" },
            uploadedAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            msg: { type: "string", example: "Something went wrong" },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  apis: ["./docs/swagger/*.js"],
};

module.exports = swaggerJsdoc(options);
