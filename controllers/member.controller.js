const dbConfig = require("../config/db.config.js")();
const connection = dbConfig.initPool();
const util = require("util");
const query = util.promisify(connection.query).bind(connection); // node native promisify
const fs = require("fs");
// const winston = require("../winston");
// const { ROLES, HTTPCODE } = require("../config/Constant.js");
const bcrypt = require("bcryptjs");
const jwtConfig = require("../config/jwt.config.js");
const authJwt = require("../middleware/authJwt.js");
const memberService = require("../service/member.service.js");
const optionConfig = require("../config/option.config.js");
const { makeThumbnail } = require("../config/upload.config.js");
const customUtils = require("../utils/customUtils.js");

// 멤버(가족구성원) 목록
exports.memberList = async (req, res) => {
  // const targetFamilyId = req.params.familyId;
  // const params = {
  //   targetFamilyId,
  // };
  try {
    const result = await memberService.selectMemberList();
    return res.send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

// 회원가입
exports.memberSignUp = async (req, res) => {
  // 데이터 받아오기
  const { account, password, confirmPassword, name } = req.body;

  const err = new Error();
  err.message = "회원가입 서버 에러 발생.";

  try {
    const pattern = /\s/g;
    //공백체크
    if (account.match(pattern)) {
      err.message = "아이디에 공백이 포함되어 있습니다.";
      throw err;
    }

    if (name === "") {
      err.message = "이름을 기입하세요.";
      throw err;
    }

    // if (email === "") {
    //   err.message = "이메일 정보를 확인해주세요.";
    //   throw err;
    // }

    if (password !== confirmPassword) {
      err.message = "확인 비밀번호가 서로 다릅니다.";
      throw err;
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const params = {
      account,
      password: hash,
      name,
    };

    const result = await memberService.insertMemberOne(params);
    return res.send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

// 삭제 예정 비밀번호 전체 변경 함수
// exports.changePassword = async (req, res) => {
//   const userPw = "123";

//   const salt = bcrypt.genSaltSync(10);
//   const hash = bcrypt.hashSync(userPw, salt);

//   const params = {
//     hash,
//   };
//   const result = await memberService.updatePasswordAll(params);
//   return res.send(result);
// };

//회원가입 아이디 중복 체크 기능
exports.dupCheckUserAccount = async (req, res) => {
  let body = req.body;
  let userAccount = body.userAccount;

  try {
    let result = {
      state: false,
      msg: "사용 불가능한 아이디입니다.",
    };

    if (userAccount === "") {
      throw new Error("아이디를 입력 후 중복 체크 해주세요.");
    }

    const pattern = /\s/g;
    if (userAccount.match(pattern)) {
      throw new Error("아이디에 공백이 포함되어서는 안됩니다.");
    }

    const resultCount = await memberService.selectUserIdCountByAccount({
      userAccount,
    });
    if (resultCount[0].count !== 0) {
      throw new Error("이미 등록된 아이디가 존재 합니다.");
    }
    return res.send(resultCount[0]);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

//로그인 처리
exports.memberLogin = async (req, res) => {
  const body = req.body;
  const userAccount = body.account;
  const userPw = body.password;

  let result = {
    result: false,
    msg: "로그인에 실패하였습니다. 아이디 또는 비밀번호를 확인하여주세요.",
  };

  const err = new Error();
  err.message = "서버 문제 발생.";

  try {
    const resultAccount = await memberService.selectMemberByAccount({
      account: userAccount,
    });

    if (resultAccount.length === 0) {
      // console.log("회원아이디 없음.");
      return res.send(result);
    }

    const hash = resultAccount[0].password;
    if (!bcrypt.compareSync(userPw, hash)) {
      // console.log("비밀번호 다름.");
      err.message = "아이디 또는 비밀번호가 맞지 않습니다.";
      throw err;
    }

    const { password, ...returnMemberInfo } = resultAccount[0];
    let refreshToken = returnMemberInfo.refreshToken;

    const id = resultAccount[0].id;
    const account = resultAccount[0].account;
    const accessToken = jwtConfig.signAccessToken(account, id);
    // return 용 userInfo 에 accessToken 담기
    returnMemberInfo.accessToken = accessToken;

    // refreshToken 이 없을 경우 생성.
    if (refreshToken === null) {
      refreshToken = jwtConfig.signRefreshToken(account, id);
    } else {
      // refreshToken 검증
      authJwt.verifyRefreshTokenForMultiLogin(refreshToken);
    }

    // Refresh Token을 HttpOnly 쿠키에 담아서 클라이언트에게 전달
    res.cookie(
      "refreshToken",
      refreshToken,
      optionConfig.cookieRefreshTokenOpt
    );

    // 리프레시 토큰 업데이트
    await memberService.updateRefreshTokenByIdAndAccount({
      refreshToken,
      id,
      account,
    });

    result.result = true;
    result.msg = "로그인 되었습니다.";
    result.memberInfo = returnMemberInfo;
    return res.send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(result);
  }
};

//회원 로그아웃
exports.memberLogout = async (req, res) => {
  let result = {
    result: false,
    msg: "로그아웃 처리에 문제가 있습니다.",
  };
  const refreshToken = req.cookies.refreshToken;
  // 변수 세팅
  const params = {
    refreshToken,
  };
  //http only 쿠키에서 토큰 삭제
  res.clearCookie("refreshToken");

  try {
    result = await memberService.updateUserRefreshTokenByRefreshTokenOrUserId(
      params
    );
    return res.send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(result);
  }
};

// 새로운 액세스 토큰 발급
exports.getNewAccessToken = async (req, res) => {
  const account = req.body.account;
  const id = req.body.myMemberId;

  try {
    const accessToken = jwtConfig.signAccessToken(account, id);
    return res.send(accessToken);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

exports.searchMemberOneByAccount = async (req, res) => {
  const account = req.query.searchKey;

  try {
    const result = await memberService.selectMemberOneByAccount({ account });
    return res.send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

// 회원정보 수정
exports.editMemberInfoOk = async (req, res) => {
  const {
    userName,
    nickName,
    phone,
    email,
    addr,
    password,
    newPassword,
    newPasswordRe,
    account,
    myMemberId,
  } = req.body;

  // 에러 핸들링을 위한 객체
  const err = new Error();
  err.message = "에러발생(editMemberInfoOk) 관리자에게 문의 하여주세요.";

  try {
    let params = {
      account,
      myMemberId,
      nickName,
      phone,
      email,
      addr,
    };

    const checkAccount = await memberService.selectMemberOneByAccoundAndId(
      params
    );

    // 정확한 회원정보 있는지 확인
    if (checkAccount.length === 0) {
      err.message = "회원 정보를 찾을 수 없습니다.";
      throw err;
    }

    // 변경 처리를 위한 비밀번호 확인
    const pwHash = checkAccount[0].password;
    if (!bcrypt.compareSync(password, pwHash)) {
      err.message = "비밀번호가 맞지 않습니다.";
      throw err;
    }

    if (newPassword !== newPasswordRe) {
      err.message = "새로운 비밀번호 확인이 올바르지 않습니다.";
      throw err;
    }

    const pattern = /\s/g;
    if (newPassword.match(pattern)) {
      err.message = "비밀번호에 공백이 들어가선 안됩니다.";
      throw err;
    }

    // 트랜지션 생성
    await memberService.beginTransaction();

    const updateResult = await memberService.updateMemberInfo(params);
    if (updateResult.affectedRows === 0) {
      throw err;
    }

    if (newPassword !== "") {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(newPassword, salt);
      params.hash = hash;
      await memberService.updateNewPasswordByAccountAndId(params);
    }

    // 커밋
    await memberService.commit();
    return res.send(updateResult);
  } catch (error) {
    console.log(error);
    // 롤백
    await memberService.rollback();
    return res.status(500).send(error);
  }
};

exports.connectFamilyRelations = async (req, res) => {
  let {
    familyType,
    familyName,
    clanName,
    branchName,
    familyGeneration,
    account,
    myMemberId,
  } = req.body;

  if (familyGeneration.trim() === "") {
    familyGeneration = null;
  }

  const err = new Error();
  err.message =
    "가족 연결 도중 오류가 발생하였습니다. 관리자에게 문의하여주세요.";

  let familyNameId = 0;
  let clanNameId = 0;
  let branchNameId = 0;

  try {
    familyName = familyName.trim();
    clanName = clanName.trim();
    branchName = branchName.trim();

    if (
      customUtils.isContainSpace(familyName) ||
      customUtils.isContainSpace(clanName) ||
      customUtils.isContainSpace(branchName)
    ) {
      err.message = "성씨, 본관, 공파에는 공백이 포함될 수 없습니다.";
      throw err;
    }

    // 위 공백 체크 이후 공파 이름은 빈칸일 경우 null 처리
    if (branchName === "") {
      branchName = null;
    }

    const params = {
      familyName,
      clanName,
      branchName,
      account,
      myMemberId,
    };

    await memberService.beginTransaction();
    // 성씨 등록되어 있는지 체크
    const findFamilyName = await memberService.findFamilyName(params);
    if (findFamilyName[0].count === 0) {
      // 등록된 성씨가 없을 경우
      const newFamilyNameResult = await memberService.insertNewFamilyName(
        params
      );
      familyNameId = newFamilyNameResult.insertId;
    } else {
      // 성씨가 등록되어 있을 경우
      familyNameId = findFamilyName[0].id;
    }

    // 본관 등록되어 있는지 체크
    const findClanName = await memberService.findClanNameByFamilyId({
      familyNameId,
      clanName,
    });
    if (findClanName[0].count === 0) {
      const newClanNameResult = await memberService.insertNewClanName({
        familyNameId,
        clanName,
      });
      clanNameId = newClanNameResult.insertId;
    } else {
      clanNameId = findClanName[0].id;
    }

    // 공파 등록되어 있는지 체크 - 공파는 모를 수도 있으니 null 조건 처리
    if (branchName !== null) {
      const findBranchName = await memberService.findBranchNameByClanId({
        familyNameId,
        clanName,
      });
      if (findBranchName[0].count === 0) {
        const newBranchNameResult = await memberService.insertNewBranchName({
          clanNameId,
          branchName,
        });
        branchNameId = newBranchNameResult.insertId;
      } else {
        branchNameId = findBranchName[0].id;
      }
    }

    // 가족 연결 정보 가져오기
    let memberRelationId = 0;
    const relationInfo = await memberService.selectMemberRelationByMyMemberId({
      myMemberId,
    });
    if (relationInfo.length === 0) {
      const newRelation = await memberService.insertNewMemberRelation({
        myMemberId,
      });
      memberRelationId = newRelation.insertId;
    } else {
      memberRelationId = relationInfo[0].id;
    }

    // familyType 0 이면 친가, 1 이면 외가
    const relationParams = {
      familyType,
      myMemberId,
      clanNameId,
      memberRelationId,
      familyGeneration,
    };

    // 가족 연결정보 업데이트 하기
    await memberService.updateMemberRelationFamilyClanByMyMemberId(
      relationParams
    );

    const returnData = {
      familyNameId,
      familyName,
      clanNameId,
      clanName,
      branchNameId,
      branchName,
    };

    await memberService.commit();
    return res.send(returnData);
  } catch (error) {
    console.log(error);
    // 롤백
    await memberService.rollback();
    return res.status(500).send(error);
  }
};

exports.searchParentAccountBySearchKey = async (req, res) => {
  const searchKey = req.query.searchKey;
  const familyType = req.query.familyType;
  const { account, myMemberId } = req.body;

  // familyType 0 이면 친가 아버지
  // familyType 1 이면 외가 어머니 검색

  let params = {
    searchKey,
    account,
    myMemberId,
    familyType,
  };

  try {
    const relationResult = await memberService.selectMemberRelationByMyMemberId(
      params
    );

    const idFamily2ClanFather = relationResult[0].idFamily2ClanFather;
    const idFamily2ClanMother = relationResult[0].idFamily2ClanMother;
    // 친가, 외가 id 불러와서 params 주입.
    params.idFamily2ClanFather = idFamily2ClanFather;
    params.idFamily2ClanMother = idFamily2ClanMother;

    const memberList = await memberService.selectParentMemberBySearchKey(
      params
    );

    // 검색 결과에 혹시 모를 내가 포함되어있을 경우 필터 처리
    const filteredNotMe = await memberList.filter((member) => {
      return member.id !== myMemberId;
    });

    for (const member of filteredNotMe) {
      member.phone = customUtils.hidePhoneNumberMiddlePart(member.phone);
    }

    return res.send(filteredNotMe);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

// 부모님 계정 연결하기
exports.connectParentRelation = async (req, res) => {
  const { pickParent, familyType, account, myMemberId } = req.body;

  const parentId = pickParent.id;
  console.log(pickParent.id);

  // 에러 핸들링을 위한 객체
  const err = new Error();
  err.message = "에러발생(connectParentRelation) 관리자에게 문의 하여주세요.";

  try {
    // 내 관계도 불러오기
    const relationResult = await memberService.selectMemberRelationByMyMemberId(
      {
        myMemberId,
      }
    );

    if (relationResult.length === 0) {
      throw err;
    }

    // 부모님 id 값 기입
    if (familyType === 0) {
      relationResult[0].idMemberFather = parentId;
    } else {
      relationResult[0].idMemberMother = parentId;
    }

    const params = relationResult[0];

    // 업데이트 처리
    await memberService.updateMemberParentRelation(params);

    const returnResult = await memberService.selectMemberRelationByMyMemberId({
      myMemberId,
    });

    return res.send(returnResult[0]);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

exports.testFunction = async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  console.log("***********테스트펑션*****************");
  console.log(token);
  console.log("****************************");
  return res.send();
};
