const ApiError = require("../Error/ApiError");

module.exports = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message });
  } else {
    return res.status(500).json({ message: "Unknown error" });
  }
};
