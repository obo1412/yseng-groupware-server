// test api using json web token
const express = require("express");
// const { authJwt } = require("../middleware");
const controller = require("../controllers/party.controller");

const router = express.Router();

const authJwt = require("../middleware/authJwt");

router.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

//     /party 라우터

// 회원아이디로 내가 속한 장부 목록 가져오기
router.get(
  "/list/:memberId",
  [authJwt.verifyAccessToken],
  controller.partyBookListByFamilyIdAndMemberId
);

// 장부 새로 추가하기
router.post(
  "/",
  [authJwt.verifyAccessToken],
  controller.makeNewPartyBookByMemberId
);

// 장부에 참여자(회원) 추가하기
router.post(
  "/inviteMember",
  [authJwt.verifyAccessToken],
  controller.inviteMemberToPartyBook
);

// 해당 장부의 참여된 회원 목록 가져오기
router.get(
  "/memberlist/:bookId",
  [authJwt.verifyAccessToken],
  controller.getMemberListByBookId
);

// 장부에 지출 내역 추가하기
router.post(
  "/expense",
  [authJwt.verifyAccessToken],
  controller.makeNewExpenseByBookId
);

// 장부의 지출 목록 불러오기
router.get(
  "/expenselist/:bookId",
  [authJwt.verifyAccessToken],
  controller.getExpenseListByBookId
);

// 장부의 지출 하나 불러오기
router.get(
  "/expense/:expenseId",
  [authJwt.verifyAccessToken],
  controller.getExpenseItemByExpenseId
);

// 해당 지출 하나의 분배(상세)내역 불러오기
router.get(
  "/distlist/:expenseId",
  [authJwt.verifyAccessToken],
  controller.getDistributionListByExpenseId
);

// 공금 처리 목록 불러오기
router.get(
  "/expenselist/public/:partyId",
  [authJwt.verifyAccessToken],
  controller.getExpensePublicByPartyId
);

// 비용 분배 처리 목록 불러오기
router.get(
  "/expenselist/dist/:partyId",
  [authJwt.verifyAccessToken],
  controller.getTotalDistForStatsByPartyId
);

router.delete(
  "/expense-id/:expenseId",
  [authJwt.verifyAccessToken],
  controller.deleteExpenseAndDistByExpenseId
);

module.exports = router;
