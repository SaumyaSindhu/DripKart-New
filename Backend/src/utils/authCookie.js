// One place that decides how the login cookie is set and cleared.
//
//  httpOnly  : JavaScript in the browser can never read the token (protects against XSS theft)
//  secure    : only sent over HTTPS (switched on automatically in production)
//  sameSite  : "lax" by default. If the frontend and API live on different sites in production,
//              set COOKIE_SAMESITE=none (this forces secure on, browsers require that).

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // matches the JWT expiry ("7d")

// read at call time (not import time) so the behaviour follows the current environment
const baseOptions = () => {
  const sameSite = (process.env.COOKIE_SAMESITE || "lax").toLowerCase();
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || sameSite === "none",
    sameSite,
  };
};

export const setAuthCookie = (res, token) => {
  res.cookie("token", token, { ...baseOptions(), maxAge: SEVEN_DAYS_MS });
};

// the options must match the ones used when the cookie was set, or browsers keep it
export const clearAuthCookie = (res) => {
  res.clearCookie("token", baseOptions());
};
