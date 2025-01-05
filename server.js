const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
// const authJwt = require("./middleware/authJwt");

//cross-env를 이용하여 prod상태인지 dev 상태인지 판별
//배포상태면 prod
const PRODUCTION = process.env.NODE_ENV === "development" ? false : true;

const domainList = PRODUCTION
  ? ["https://system.yseng.net"]
  : [
      "http://localhost:3000",
      "http://192.168.0.30:3000",
      "http://192.168.0.32:3000",
    ];

const corsOptions = {
  origin: (origin, callback) => {
    let checkCors = domainList.indexOf(origin) !== -1;
    callback(null, checkCors);
  },
  //서버에서 쿠키를 header에 넣어주는 옵션
  credentials: true,
};

//web CORS
app.use(cors(corsOptions));

// req body body-parser 내장되어 express로 적으면 됨.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cookie
app.use(cookieParser());

// 자동로그인 미들웨어
// app.use(authJwt.autoLogin);

app.listen(8535);

// const memberRouter = require("./routes/member.routes");
// app.use("/member", memberRouter);

// const bbsRouter = require("./routes/bbs.routes");
// app.use("/bbs", bbsRouter);

// const partyRouter = require("./routes/party.routes");
// app.use("/party", partyRouter);

app.get("/", [], function (req, res) {
  res.send("Hello YSENG GROUPWARE SERVER");
});
