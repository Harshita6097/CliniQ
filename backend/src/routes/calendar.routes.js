const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth.middleware");
const { getAuthUrl, exchangeCodeForTokens } = require("../config/googleOAuth");
const User = require("../models/User");
const logger = require("../utils/logger");

// ─── GET /api/calendar/connect ────────────────────────────────────────────────
// Returns the Google OAuth consent URL for the authenticated user.
// Frontend redirects the user to this URL to grant calendar access.
router.get("/connect", verifyToken, (req, res) => {
  const url = getAuthUrl(req.user.id);
  res.status(200).json({ url });
});

// ─── GET /api/calendar/oauth/callback ────────────────────────────────────────
// Google redirects here after the user grants consent.
// Exchanges the auth code for tokens and saves them on the user document.
// Then redirects the user back to the frontend.
router.get("/oauth/callback", async (req, res) => {
  const { code, state: userId, error } = req.query;

  if (error) {
    logger.warn(`Google OAuth denied by user ${userId}: ${error}`);
    return res.redirect(
      `${process.env.CLIENT_URL}/settings?calendar=denied`
    );
  }

  if (!code || !userId) {
    return res.status(400).json({ message: "Missing code or state parameter." });
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    // Merge tokens — Google only returns refresh_token on first consent,
    // so preserve the existing one if the new response omits it.
    const existingUser = await User.findById(userId).select("googleTokens").lean();
    await User.findByIdAndUpdate(userId, {
      googleTokens: {
        access_token:  tokens.access_token,
        refresh_token: tokens.refresh_token ?? existingUser?.googleTokens?.refresh_token ?? null,
        expiry_date:   tokens.expiry_date,
      },
    });

    logger.info(`Google Calendar connected for user ${userId}`);
    res.redirect(`${process.env.CLIENT_URL}/settings?calendar=connected`);
  } catch (err) {
    logger.error(`Google OAuth callback error for user ${userId}: ${err.message}`);
    res.redirect(`${process.env.CLIENT_URL}/settings?calendar=error`);
  }
});

// ─── DELETE /api/calendar/disconnect ─────────────────────────────────────────
// Removes stored Google tokens — user's calendar will no longer be updated.
router.delete("/disconnect", verifyToken, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      googleTokens: { access_token: null, refresh_token: null, expiry_date: null },
    });
    logger.info(`Google Calendar disconnected for user ${req.user.id}`);
    res.status(200).json({ message: "Google Calendar disconnected." });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/calendar/status ─────────────────────────────────────────────────
// Returns whether the current user has connected their Google Calendar.
router.get("/status", verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("googleTokens").lean();
    const connected = !!user?.googleTokens?.access_token;
    res.status(200).json({ connected });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
