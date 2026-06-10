const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError } = require("../errors");
const crypto = require("crypto");
const createVerificationToken = require("../utils/createVerificationToken");
const sendVerificationEmail = require("../utils/sendVerificationEmail");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

const register = async (req, res) => {
  const { name, email, password } = req.body;

  const emailAlreadyExists = await User.findOne({ email });

  if (emailAlreadyExists) {
    throw new BadRequestError("Email already exists");
  }

  const verificationCode = createVerificationToken();

  const hashedToken = crypto
    .createHash("sha256")
    .update(verificationCode)
    .digest("hex");

  const verificationTokenExpires = Date.now() + 10 * 60 * 1000;

  await User.create({
    name,
    email,
    password,
    verificationToken: hashedToken,
    verificationTokenExpires,
  });

  await sendVerificationEmail({
    name,
    email,
    verificationCode,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    msg: "Verification code sent to email",
  });
};

const verifyEmail = async (req, res) => {
  const { email, verificationCode } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new BadRequestError("User not found");
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(verificationCode)
    .digest("hex");

  if (user.verificationToken !== hashedToken) {
    throw new BadRequestError("Invalid verification code");
  }

  if (user.verificationTokenExpires < Date.now()) {
    throw new BadRequestError("Verification code expired");
  }

  user.isVerified = true;
  user.verifiedAt = Date.now();
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;

  await user.save();

  res.status(StatusCodes.OK).json({
    success: true,
    msg: "Email verified successfully",
  });
};
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError("Provide email and password");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new UnauthenticatedError("Invalid credentials");
  }
  if (!user.isVerified) {
    throw new UnauthenticatedError("Please verify your email first");
  }
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Invalid credentials");
  }

  const accessToken = user.createAccessToken();
  const refreshToken = user.createRefreshToken();
  user.refreshToken = refreshToken;
  await user.save();
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.status(StatusCodes.OK).json({
    user: { name: user.name, role: user.role },
    accessToken,
    msg: `login successful `,
  });
};
const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    throw new UnauthenticatedError("No refresh token");
  }

  const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

  const user = await User.findById(payload.userId);

  if (!user || user.refreshToken !== token) {
    throw new UnauthenticatedError("Invalid refresh token");
  }

  const newAccessToken = user.createAccessToken();

  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    msg: "Access token refreshed",
  });
};
const logout = async (req, res) => {
  const token = req.cookies.refreshToken;
  try {
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(payload.userId);
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.log(error);
    }
  }
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.status(StatusCodes.OK).json({
    success: true,
    msg: "Logged out successfully",
  });
};
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new BadRequestError("Please provide email");
  }

  const user = await User.findOne({
    email,
  });

  // Don't reveal if user exists
  if (!user) {
    return res.status(StatusCodes.OK).json({
      success: true,
      msg: "If an account exists, a reset link has been sent",
    });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.passwordResetToken = hashedToken;

  user.passwordResetExpires = Date.now() + 15 * 60 * 1000;

  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const html = `
    <h2>Password Reset Request</h2>
    <p>Click the link below to reset your password.</p>

    <a href="${resetUrl}">
      Reset Password
    </a>

    <p>This link expires in 15 minutes.</p>

    <p>If you did not request this, ignore this email.</p>
  `;

  await sendEmail({
    to: user.email,
    subject: "Reset Your Password",
    html,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    msg: "If an account exists, a reset link has been sent",
    //resetToken,
  });
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw new BadRequestError("Token and password required");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,

    passwordResetExpires: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    throw new BadRequestError("Invalid or expired reset token");
  }

  user.password = password;

  user.passwordResetToken = undefined;

  user.passwordResetExpires = undefined;

  // Invalidate all sessions
  user.refreshToken = undefined;

  await user.save();

  res.status(StatusCodes.OK).json({
    success: true,
    msg: "Password reset successful",
  });
};

module.exports = {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
};
