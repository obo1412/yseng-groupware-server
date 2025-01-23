const jwt = require("jsonwebtoken");

module.exports = {
  secret:
    "VOVtgbXfodHt3Pw5YMC5953vUAIuDkSxeBvuUg9ELTuQB4UKuHDtY2VU2okhYhwvEYc7jJlSfHqv78tTb5KtnsGhgpImnxZn5Fx",
  refreshSecret:
    "Fr9n21Ad1INVZbvJV1kfIMKTu4qebbUG6fukPLvSgZVqPxYiZy2NezlPRedT6CbHM7fPgJqqgy9xMx56HKgjyUbWvoMPldZF9bp5",
  autoLoginSecret:
    "uKMcP6jDxlSOGKooQYYlLiSVP5l0xQ58k1c5FDnOCVZIrIUbhqzOM0f0kr8kVd1ZYNXnk7xKrFIPMYmVnSBQOY410miLk18GBE",
  signAccessToken: function (account, id) {
    return (result = jwt.sign({ account, id }, this.secret, {
      expiresIn: "3m",
    }));
  },
  signRefreshToken: function (account, id) {
    return (result = jwt.sign({ account, id }, this.refreshSecret, {
      expiresIn: "365d",
    }));
  },
  signAutoLoginToken: function (id, account) {
    return (result = jwt.sign({ id, account }, this.autoLoginSecret, {
      expiresIn: "14d",
    }));
  },
};
