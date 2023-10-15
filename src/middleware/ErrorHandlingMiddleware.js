const ApiError = require("../Error/ApiError");

/**
 * MiddleWare для обработки ошибок запросов
 * @param {ApiError} err - Обьект класса ApiError.
 * @param {Request} req - Запрос клиента.
 * @param {Response} res - Ответ сервера.
 * @param {Function} next - Функция которая будет вызванна после обработки ошибки.
 */
module.exports = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message });
  } else {
    return res.status(500).json({ message: "Unknown error" });
  }
};
