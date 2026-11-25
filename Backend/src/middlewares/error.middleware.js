// Every error in the API ends up here and leaves as the same JSON shape:
//   { message, success: false, errors?: [...] }
// (Express 5 forwards errors thrown or rejected inside async handlers automatically.)

export const notFound = (req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    success: false,
  });
};

// turns known library errors into a sensible status + message
const normalize = (err) => {
  // invalid ObjectId etc.
  if (err.name === "CastError") {
    return { status: 400, message: `Invalid value for "${err.path}"` };
  }
  // mongoose schema validation
  if (err.name === "ValidationError" && err.errors) {
    return {
      status: 400,
      message: "Validation failed",
      errors: Object.values(err.errors).map((e) => ({
        msg: e.message,
        path: e.path,
      })),
    };
  }
  // unique index violation
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(", ") || "value";
    return {
      status: 409,
      message: `A record with this ${fields} already exists`,
    };
  }
  // bad / expired token
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return { status: 401, message: "Invalid or expired token" };
  }
  // file upload problems (file too large, wrong field name ...)
  if (err.name === "MulterError") {
    return { status: 400, message: err.message };
  }
  // body-parser: broken JSON / body too big
  if (err.type === "entity.parse.failed") {
    return { status: 400, message: "Invalid JSON in request body" };
  }
  if (err.type === "entity.too.large") {
    return { status: 413, message: "Request body is too large" };
  }

  const status = err.status || err.statusCode || 500;
  return { status, message: err.message || "Something went wrong" };
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const isProd = process.env.NODE_ENV === "production";
  const { status, message, errors } = normalize(err);

  if (status >= 500) {
    // server faults are logged with the request that caused them
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(status).json({
    // in production never leak internals of a server error
    message: status >= 500 && isProd ? "Internal server error" : message,
    success: false,
    ...(errors && { errors }),
    ...(status >= 500 && !isProd && { stack: err.stack }),
  });
};
