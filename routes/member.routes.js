// test api using json web token
const express = require("express");
// const { authJwt } = require("../middleware");
const controller = require("../controllers/member.controller");

const router = express.Router();

const authJwt = require("../middleware/authJwt");

router.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

//     /user 라우터

// 가족 구성원 목록
// router.get("/family/:familyId", [], controller.memberList);
router.get("/list", [], controller.memberList);

//회원 가입
router.post("/signup", [], controller.memberSignup);

//회원가입 유저 아이디 중복 체크
router.post("/dupCheckUserAccount", [], controller.dupCheckUserAccount);

//회원 로그인
router.post("/login", [authJwt.checkRefreshTokenInDB], controller.memberLogin);

//회원 로그아웃
router.patch("/logout", [], controller.memberLogout);

// 삭제 예정
// router.patch("/password", [], controller.changePassword);

// 새로운 액세스 토큰 발급용
router.post(
  "/newAccess",
  [authJwt.checkRefreshTokenForNewAccessToken],
  controller.getNewAccessToken
);

router.patch("/edit", [authJwt.verifyAccessToken], controller.editMemberInfoOk);

// 모임장부에 참여자 추가를 위한 회원검색
router.get(
  "/search",
  [authJwt.verifyAccessToken],
  controller.searchMemberOneByAccount
);

// 가족 정보 연결처리
router.post(
  "/connect-family",
  [authJwt.verifyAccessToken],
  controller.connectFamilyRelations
);

// 부모님 연결을 위한 부모님 검색처리
router.get(
  "/connect-parent/search",
  [authJwt.verifyAccessToken],
  controller.searchParentAccountBySearchKey
);

// 부모님 연결 처리
router.patch(
  "/connect-parent",
  [authJwt.verifyAccessToken],
  controller.connectParentRelation
);

// 테스트 펑션 계속 바꿔가면서 사용 예정
router.get("/testFunc", [authJwt.verifyAccessToken], controller.testFunction);

module.exports = router;
