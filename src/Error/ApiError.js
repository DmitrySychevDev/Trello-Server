class ApiError extends Error {
  /**
   * Класс для обработки ошибок, при вызове этого конструктора ошибка возвращается на клиент с переданным статусом и сообщением
   * @constructors
   * @param {string} message - Сообщение об ошибке.
   * @param {string} message - Сообщение передаваемое на клиент.
   */
  constructor(message, status) {
    super();
    this.status = status;
    this.message = message;
  }
  /**
   * Метод отправляет на клиент ошибку с кодом 404
   * @static
   * @param {string} message - Сообщение передаваемое на клиент.
   */
  static notFound(message) {
    return new ApiError(message, 404);
  }
  /**
   * Метод отправляет на клиент ошибку с кодом 400
   * @static
   * @param {string} message - Сообщение передаваемое на клиент.
   */
  static badRequest(message) {
    return new ApiError(message, 400);
  }
  /**
   * Метод отправляет на клиент ошибку с кодом 403
   * @static
   * @param {string} message - Сообщение передаваемое на клиент.
   */
  static forbidden(message) {
    return new ApiError(message, 403);
  }
  /**
   * Метод отправляет на клиент ошибку с кодом 500
   * @static
   * @param {string} message - Сообщение передаваемое на клиент.
   */
  static internal(message) {
    return new ApiError(message, 500);
  }
}

module.exports = ApiError;
