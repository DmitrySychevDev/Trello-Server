class ApiError extends Error {
  constructor(message, status) {
    super();
    this.status = status;
    this.message = message;
  }

  static notFound(message) {
    return new ApiError(message, 404);
  }
  static badRequest(message) {
    return new ApiError(message, 400);
  }
  static forbidden(message) {
    return new ApiError(message, 403);
  }
  static internal(message) {
    return new ApiError(message, 500);
  }
}

module.exports = ApiError;
