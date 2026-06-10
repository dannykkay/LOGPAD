/**
 * @swagger
 * tags:
 *   name: Attachments
 *   description: File attachments for notes
 */

/**
 * @swagger
 * /api/v1/attachments/{noteId}:
 *   post:
 *     summary: Upload up to 5 files to a note
 *     tags: [Attachments]
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *         description: The note to attach files to
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 5 files. Max total attachments per note is 10.
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 attachments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Attachment'
 *       400:
 *         description: No file provided or attachment limit reached
 *       404:
 *         description: Note not found
 */

/**
 * @swagger
 * /api/v1/attachments/{attachmentId}:
 *   get:
 *     summary: Get a single attachment's details
 *     tags: [Attachments]
 *     parameters:
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The attachment ID
 *     responses:
 *       200:
 *         description: Attachment details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 attachment:
 *                   $ref: '#/components/schemas/Attachment'
 *       404:
 *         description: Attachment not found
 */

/**
 * @swagger
 * /api/v1/attachments/{noteId}/{attachmentId}:
 *   delete:
 *     summary: Delete an attachment from a note
 *     tags: [Attachments]
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *         description: The note ID
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The attachment ID
 *     responses:
 *       200:
 *         description: Attachment deleted from Cloudinary and note
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
 *                   example: Attachment deleted successfully
 *       404:
 *         description: Note or attachment not found
 */

/**
 * @swagger
 * /api/v1/attachments/{attachmentId}/download:
 *   get:
 *     summary: Get download URL for an attachment
 *     tags: [Attachments]
 *     parameters:
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Download URL returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 attachment:
 *                   type: object
 *                   properties:
 *                     fileName:
 *                       type: string
 *                       example: document.pdf
 *                     fileType:
 *                       type: string
 *                       example: application/pdf
 *                     downloadUrl:
 *                       type: string
 *                       example: https://res.cloudinary.com/logpad/document.pdf
 *       404:
 *         description: Attachment not found
 */
