const { User } = require("../models/References");

class UserController {
  async check(req, res) {
    res.json({ message: "fwfewfwgwg" });
  }
}

module.exports = new UserController();
