import rateLimit from "express-rate-limit";

export const makeLimiter = ({
  windowMs,
  max,
  skipSuccessfulRequests = false,
  message,
}) =>
  rateLimit({
    windowMs,
    limit: max,
    standardHeaders: "draft-7", // sends RateLimit-* headers so clients can see their budget
    legacyHeaders: false,
    skipSuccessfulRequests, // true: only FAILED requests count towards the limit
    handler: (_req, res) => {
      res.status(429).json({
        message: message || "Too many requests. Please try again later.",
        success: false,
      });
    },
  });

const positive = (value, fallback) =>
  Number(value) > 0 ? Number(value) : fallback;

// login / register: slows down password guessing. Only failed attempts count.
export const authLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: positive(process.env.AUTH_RATE_LIMIT_MAX, 10),
  skipSuccessfulRequests: true,
  message: "Too many failed attempts. Please try again in 15 minutes.",
});

// whole API: a generous ceiling that stops abusive clients
export const apiLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: positive(process.env.API_RATE_LIMIT_MAX, 500),
});
