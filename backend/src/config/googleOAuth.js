const { google } = require("googleapis");

/**
 * Creates a per-user OAuth2 client loaded with that user's stored tokens.
 * Returns null if the user has no tokens (not yet connected to Google Calendar).
 */
const getOAuthClient = (googleTokens) => {
  if (!googleTokens?.access_token) return null;

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  client.setCredentials(googleTokens);

  // Auto-refresh: when the access token expires, the client uses the
  // refresh token automatically. We persist the new tokens back to the DB
  // via the "tokens" event so the next request doesn't need a re-auth.
  client.on("tokens", async (newTokens) => {
    try {
      const User = require("../models/User");
      const updatedTokens = { ...googleTokens, ...newTokens };
      await User.findOneAndUpdate(
        { "googleTokens.refresh_token": googleTokens.refresh_token },
        { googleTokens: updatedTokens }
      );
    } catch (e) {
      const logger = require("../utils/logger");
      logger.error(`Failed to persist refreshed Google tokens: ${e.message}`);
    }
  });

  return client;
};

/**
 * Generates the Google OAuth consent URL for a given user.
 * The state param carries the userId so the callback knows who to save tokens for.
 */
const getAuthUrl = (userId) => {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  return client.generateAuthUrl({
    access_type: "offline",   // needed to get a refresh_token
    prompt: "consent",        // forces refresh_token on every consent (avoids missing refresh_token on re-auth)
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    state: userId,
  });
};

/**
 * Exchanges an auth code for tokens and returns them.
 */
const exchangeCodeForTokens = async (code) => {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  const { tokens } = await client.getToken(code);
  return tokens;
};

module.exports = { getOAuthClient, getAuthUrl, exchangeCodeForTokens };
