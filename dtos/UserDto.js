module.exports = class UserDto {
  email;
  name;
  id;
  isActivate;

  constructor(model) {
    this.email = model.email;
    this.name = model.name;
    this.id = model.id;
    this.isActivate = model.isActivate;
  }
};
