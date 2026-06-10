# Logpad API

A production-grade REST API for a smart notes application. Built with Node.js, Express, and MongoDB — featuring secure authentication, full-text search, file attachments, analytics, a trash system with auto-cleanup, and full Swagger documentation.

## Live Documentation

> API docs available at `/api-docs` after running the server locally.

---

## Features

- **Authentication** — Register, email verification, login, logout, refresh token, forgot/reset password. Dual token system (access + refresh) stored as httpOnly cookies.
- **Notes** — Create, read, update, soft delete. Filter by category, priority, and pinned status. Full-text search with relevance scoring across title, content, and tags. Pagination and sorting.
- **Trash System** — Soft delete moves notes to trash. Notes can be restored or permanently deleted. Auto-cleanup cron job permanently removes notes older than 30 days.
- **File Attachments** — Upload up to 5 files per request (max 10 per note). Stored on Cloudinary. Supports images, PDFs, Word, and Excel files.
- **Analytics** — Stats endpoint returns total notes, pinned count, priority breakdown, and category breakdown in a single query using MongoDB `$facet`. Monthly stats endpoint for activity charts.
- **Security** — Helmet, XSS protection, MongoDB sanitization, rate limiting, cookie-based auth.
- **API Documentation** — Full Swagger UI docs with request/response schemas for every endpoint.
- **Testing** — Jest + Supertest test suite with MongoDB Memory Server for isolated test runs. Resend mocked to prevent real emails during tests.

---

## Tech Stack

| Layer         | Technology                                                    |
| ------------- | ------------------------------------------------------------- |
| Runtime       | Node.js                                                       |
| Framework     | Express.js                                                    |
| Database      | MongoDB + Mongoose                                            |
| Auth          | JWT (access + refresh tokens)                                 |
| File Storage  | Cloudinary                                                    |
| Email         | Resend                                                        |
| Documentation | Swagger UI + swagger-jsdoc                                    |
| Testing       | Jest + Supertest + MongoDB Memory Server                      |
| Security      | Helmet, xss-clean, express-mongo-sanitize, express-rate-limit |

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account
- Cloudinary account
- Resend account with a verified domain

### Installation

```bash
git clone https://github.com/dannykkay/logpad-api.git
cd logpad-api
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_LIFETIME=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_LIFETIME=7d
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
PORT=5000
```

### Run

```bash
# Development
npm run dev

# Production
npm start

# Tests
npm test
```

---

## API Endpoints

### Auth — `/api/v1/auth`

| Method | Endpoint           | Description               | Auth |
| ------ | ------------------ | ------------------------- | ---- |
| POST   | `/register`        | Register new user         | No   |
| POST   | `/verify-email`    | Verify email with code    | No   |
| POST   | `/login`           | Login and receive tokens  | No   |
| GET    | `/refresh-token`   | Refresh access token      | No   |
| POST   | `/logout`          | Logout and clear cookies  | Yes  |
| POST   | `/forgot-password` | Request password reset    | No   |
| PATCH  | `/reset-password`  | Reset password with token | No   |

### Notes — `/api/v1/notes`

| Method | Endpoint             | Description                              |
| ------ | -------------------- | ---------------------------------------- |
| GET    | `/`                  | Get all notes (filter, search, paginate) |
| POST   | `/`                  | Create a note                            |
| GET    | `/:noteId`           | Get a single note                        |
| PATCH  | `/:noteId`           | Update a note                            |
| DELETE | `/:noteId`           | Soft delete (move to trash)              |
| GET    | `/trash`             | Get trashed notes                        |
| PATCH  | `/:noteId/restore`   | Restore from trash                       |
| DELETE | `/:noteId/permanent` | Permanently delete                       |
| GET    | `/stats`             | Note statistics                          |
| GET    | `/stats/monthly`     | Monthly activity stats                   |
| GET    | `/admin`             | All notes — admin only                   |

### Attachments — `/api/v1/attachments`

| Method | Endpoint                  | Description            |
| ------ | ------------------------- | ---------------------- |
| POST   | `/:noteId`                | Upload up to 5 files   |
| GET    | `/:attachmentId`          | Get attachment details |
| GET    | `/:attachmentId/download` | Get download URL       |
| DELETE | `/:noteId/:attachmentId`  | Delete attachment      |

---

## Query Parameters

`GET /api/v1/notes` supports:

| Param      | Type                        | Description                                                   |
| ---------- | --------------------------- | ------------------------------------------------------------- |
| `search`   | string                      | Full-text search (title, content, tags)                       |
| `category` | string                      | Filter by category                                            |
| `priority` | `low` \| `medium` \| `high` | Filter by priority                                            |
| `isPinned` | boolean                     | Filter pinned notes                                           |
| `page`     | number                      | Page number (default: 1)                                      |
| `limit`    | number                      | Results per page (default: 10)                                |
| `sort`     | string                      | Sort field, prefix `-` for descending (default: `-createdAt`) |

---

## Project Structure

```
├── controllers/        # Route handlers
├── middleware/         # Auth, error handling, file upload
├── models/             # Mongoose schemas
├── routes/             # Express routers
├── utils/              # Email helpers
├── docs/               # Swagger config and docs
├── config/             # Cloudinary config
├── errors/             # Custom error classes
├── db/                 # Database connection
├── tests/              # Jest test suites
│   └── helpers/        # Test setup and factories
├── app.js              # Express app
├── server.js           # Server entry point
└── cronJobs.js         # Scheduled trash cleanup
```

---

## Testing

```bash
npm test
```

Tests use MongoDB Memory Server — no real database connection needed. Resend is mocked so no emails are sent during test runs.

Current coverage: **Auth**, **Notes**, **Stats**

---

## Security Measures

- httpOnly cookies prevent XSS token theft
- Helmet sets secure HTTP headers
- express-mongo-sanitize prevents NoSQL injection
- xss-clean sanitizes user input
- Rate limiting on all routes (stricter on auth routes)
- `isDeleted` guard on all note queries prevents data leaks
- Passwords hashed with bcrypt
- Refresh tokens invalidated on logout

---

## License

MIT
