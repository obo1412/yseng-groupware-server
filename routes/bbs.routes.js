// test api using json web token
const express = require("express");
// const { authJwt } = require("../middleware");
const controller = require("../controllers/bbs.controller");

const router = express.Router();

const authJwt = require("../middleware/authJwt");

router.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

//     /bbs 라우터

// 가족별 게시글 목록
router.get(
  "/family/:familyId",
  [authJwt.verifyAccessToken],
  controller.documentListByFamilyId
);

// 게시글 하나 조회
router.get(
  "/:docId",
  [authJwt.verifyAccessToken],
  controller.documentReadByDocId
);

// 게시글 쓰기
router.post("/", [authJwt.verifyAccessToken], controller.documentWrite);

// 댓글 쓰기
router.post(
  "/comment",
  [authJwt.verifyAccessToken],
  controller.commentWriteToDocId
);

module.exports = router;
