const express = require("express");
const router = express.Router();

const {
  register,
  login,
  verifyEmail,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.get("/refresh-token", refreshToken);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);

router.patch("/reset-password", resetPassword);
module.exports = router;
