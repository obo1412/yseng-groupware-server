const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = {
  signAccessToken: function (account, id) {
    return (result = jwt.sign({ account, id }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: "10m",
    }));
  },
  signRefreshToken: function (account, id) {
    return (result = jwt.sign({ account, id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "30d",
    }));
  },
  signAutoLoginToken: function (id, account) {
    return (result = jwt.sign(
      { id, account },
      process.env.JWT_AUTOLOGIN_SECRET,
      {
        expiresIn: "30d",
      }
    ));
  },
};
