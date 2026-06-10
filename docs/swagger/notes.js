/**
 * @swagger
 * tags:
 *   name: Notes
 *   description: Note management
 */

/**
 * @swagger
 * /api/v1/notes:
 *   get:
 *     summary: Get all notes for the logged-in user
 *     tags: [Notes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Notes per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *         description: Sort field (prefix with - for descending)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Full-text search across title, content, and tags. Results ranked by relevance score.
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by priority
 *       - in: query
 *         name: isPinned
 *         schema:
 *           type: boolean
 *         description: Filter by pinned status
 *     responses:
 *       200:
 *         description: Notes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 totalNotes:
 *                   type: integer
 *                   example: 50
 *                 numOfPages:
 *                   type: integer
 *                   example: 5
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 notes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Note'
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a new note
 *     tags: [Notes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *                 example: My note title
 *               content:
 *                 type: string
 *                 example: This is the note content
 *               category:
 *                 type: string
 *                 example: backend
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["nodejs", "mongodb"]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 example: medium
 *               isPinned:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Note created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 note:
 *                   $ref: '#/components/schemas/Note'
 *       400:
 *         description: Missing title or content
 */

/**
 * @swagger
 * /api/v1/notes/admin:
 *   get:
 *     summary: Get all notes from all users (admin only)
 *     tags: [Notes]
 *     responses:
 *       200:
 *         description: All notes retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 200
 *                 notes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Note'
 *       403:
 *         description: Forbidden — admin access only
 */

/**
 * @swagger
 * /api/v1/notes/trash:
 *   get:
 *     summary: Get all soft-deleted notes (trash)
 *     tags: [Notes]
 *     responses:
 *       200:
 *         description: Trashed notes retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 notes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Note'
 */

/**
 * @swagger
 * /api/v1/notes/stats:
 *   get:
 *     summary: Get note statistics (total, pinned, priority breakdown, category breakdown)
 *     tags: [Notes]
 *     responses:
 *       200:
 *         description: Stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 totalNotes:
 *                   type: integer
 *                   example: 50
 *                 pinnedNotes:
 *                   type: integer
 *                   example: 5
 *                 priorityStats:
 *                   type: object
 *                   example: { low: 10, medium: 30, high: 10 }
 *                 categoryStats:
 *                   type: object
 *                   example: { backend: 20, frontend: 15, personal: 15 }
 */

/**
 * @swagger
 * /api/v1/notes/stats/monthly:
 *   get:
 *     summary: Get monthly note creation stats
 *     tags: [Notes]
 *     responses:
 *       200:
 *         description: Monthly stats retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 monthlyStats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                         example: "2024-01"
 *                       count:
 *                         type: integer
 *                         example: 12
 */

/**
 * @swagger
 * /api/v1/notes/{noteId}:
 *   get:
 *     summary: Get a single note by ID
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *         description: The note ID
 *     responses:
 *       200:
 *         description: Note retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 note:
 *                   $ref: '#/components/schemas/Note'
 *       404:
 *         description: Note not found
 *   patch:
 *     summary: Update a note
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated title
 *               content:
 *                 type: string
 *                 example: Updated content
 *               category:
 *                 type: string
 *                 example: frontend
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               isPinned:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Note updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 note:
 *                   $ref: '#/components/schemas/Note'
 *       404:
 *         description: Note not found
 *   delete:
 *     summary: Soft delete a note (moves to trash)
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Note moved to trash
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 msg:
 *                   type: string
 *                   example: note deleted
 *       404:
 *         description: Note not found
 */

/**
 * @swagger
 * /api/v1/notes/{noteId}/restore:
 *   patch:
 *     summary: Restore a note from trash
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Note restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Note restored
 *                 note:
 *                   $ref: '#/components/schemas/Note'
 *       404:
 *         description: Note not found in trash
 */

/**
 * @swagger
 * /api/v1/notes/{noteId}/permanent:
 *   delete:
 *     summary: Permanently delete a note from trash
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Note permanently deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Note permanently deleted
 *       404:
 *         description: Note not found in trash
 */
