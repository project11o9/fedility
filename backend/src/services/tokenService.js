const jwt = require("jsonwebtoken");
const config = require("../config/env");

function signUserToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

module.exports = {
  signUserToken
};
