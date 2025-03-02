const jwt = require("jsonwebtoken");
// const { ROLES, HTTPCODE } = require("../config/Constant.js");
const jwtConfig = require("../config/jwt.config.js");
const bcrypt = require("bcryptjs");
const memberService = require("../service/member.service.js");
const uploadHelper = require("../config/upload.config.js");

// accessToken 검증 함수
exports.verifyAccessToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  const refreshToken = req.cookies.refreshToken;

  const files = req.files;

  try {
    if (!token || !refreshToken) {
      //아예 액세스 토큰이 없을 경우 강제 로그아웃 처리하기.
      // refresh 토큰도 삭제하는 즉시 액세스 토큰도 효력을 잃어야만 한다.
      //로그아웃 시킬 대상을 알 수 없음. return 값 msg만 혹은, 클라이언트의 userInfo 초기화
      throw new Error("토큰 없음 No Tokens.");
    }
    //refreshToken이 DB에 있는지 검증
    //refreshToken이 클라이언트에 존재하는데, DB에 없다면 그것은 탈취된 토큰임
    const results = await memberService.selectMemberByRefreshToken({
      refreshToken,
    });

    if (results.length === 0) {
      // DB에 맞는 리프레시토큰이 없음.
      // 토큰 삭제
      res.clearCookie("refreshToken");
      throw new Error("토큰 검증 에러 No DB RToken.");
    }

    // 여기서 리프레시 토큰을 검증하면 안된다. 이것은 오로지 엑세스토큰만을 검증해야한다.
    // 1. 액세스 토큰이 정상 상태이고, 만료되기 전이면 디코딩 값을 넘기고 정상 처리.
    // 2. 액세스 토큰이 비정상 상태이면, 잘못된 토큰으로 로그아웃 처리.
    // 3. 액세스 토큰이 정상 상태이고, 만료되었으면 만료 신호 보내기.
    // 이후 클라이언트 단에서 위 상태를 받아서 반응 처리.
    // 1 -> 정상 진행
    // 2 -> 로그아웃
    // 3 -> 리프레시 토큰을 보내어 리프레시토큰 검증 후 액세스토큰 재발급 요청 보내기.
    //      재발급 받은 액세스 토큰으로 다시 액세스 토큰 검증 후 정상 반응처리
    //refresh token 실검증 처리
    jwt.verify(refreshToken, jwtConfig.refreshSecret, (err, decodedRefresh) => {
      if (err) {
        //리프레시 토큰이 만료 쿠키 삭제도 여기서 해버려
        res.clearCookie("refreshToken");
        throw new Error("토큰 만료 No more RToken.");
      } else {
        //액세스 토큰 검증 처리
        jwt.verify(token, jwtConfig.secret, (err, decoded) => {
          if (err) {
            // access token이 만료된 경우
            throw new Error("토큰 만료 No more AToken");
          } else {
            //검증이 완료 되었을 경우 body에 값을 넣어서 전달한다.
            req.body.account = decoded.account;
            req.body.myMemberId = decoded.id;
            next();
          }
        });
        //액세스 토큰 검증 처리 끝.
      }
    });
    //refresh token 실검증 처리 끝.
  } catch (error) {
    console.log(error);
    // 파일 삭제하기
    await uploadHelper.unlinkFilesByRollback(files);
    return res.status(403).send(error);
  }

  //refreshToken이 DB에 있는지 검증 끝.
};

//로그인시 리프레시토큰 재활용 기능
exports.checkRefreshTokenInDB = async (req, res, next) => {
  const userAccount = req.body.userAccount;
  const userPw = req.body.userPw;

  let exsRefreshToken = null;

  let result = {
    result: false,
    msg: "refreshToken DB 체크에 문제가 발생하였습니다.",
  };

  const err = new Error();
  err.message = "서버 에러 발생(checkRefreshTokenInDB)";

  try {
    const resultRefreshToken = await memberService.selectRefreshTokenByAccount({
      userAccount,
    });

    if (resultRefreshToken.length === 0) {
      // account값의 계정이 존재하지 않음.
      err.message = "계정 또는 비밀번호를 확인하여 주세요.(checkRefreshToken1)";
      throw err;
    } else {
      const hash = resultRefreshToken[0].password;
      if (!bcrypt.compareSync(userPw, hash)) {
        // console.log("비밀번호 다름.");
        err.message =
          "계정 또는 비밀번호를 확인하여 주세요.(checkRefreshToken2)";
        throw err;
      }

      //계정이 존재할때, refreshToken 여부 확인하기
      if (resultRefreshToken[0].refreshToken) {
        exsRefreshToken = resultRefreshToken[0].refreshToken;
      } else {
        exsRefreshToken = jwtConfig.signRefreshToken(
          userAccount,
          resultRefreshToken[0].id
        );
      }

      req.body.refreshToken = exsRefreshToken;
      next();
    }
  } catch (error) {
    console.log(error);
    return res.status(403).send(error);
  }
};

// 새로운 액세스토큰 발급을 위한 리프레시토큰 검증
exports.checkRefreshTokenForNewAccessToken = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  try {
    // DB에 정상적으로 refresh Token이 존재하는지 체크하기
    const resultRefresh = await memberService.selectMemberByRefreshToken({
      refreshToken,
    });
    if (resultRefresh.length === 0) {
      res.clearCookie("refreshToken");
      // const err = new Error("비정상적인 토큰입니다.");
      // err.status = 403;
      // throw err;
      throw new Error("비정상적인 토큰입니다.");
    }
    // DB에 정상적으로 등록된 리프레시토큰이라면, 리프레시토큰검증
    jwt.verify(refreshToken, jwtConfig.refreshSecret, (err, decodedRefresh) => {
      if (err) {
        console.log(err);
        // 쿠키 삭제
        res.clearCookie("refreshToken");
        throw new Error("유효하지 않은 토큰입니다.");
      } else {
        req.body.account = decodedRefresh.account;
        req.body.myMemberId = decodedRefresh.id;
        next();
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(403).send(error);
  }
};
