exports.cookieOptHitsAndThumbs = {
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000, // 24시간
  //secure: true, // HTTPS만 허용
  // sameSite: "none", // 쿠키 전송 제한 없음
};

exports.cookieRefreshTokenOpt = {
  httpOnly: true,
  maxAge: 365 * 24 * 60 * 60 * 1000, // 365일
  //secure: true, // HTTPS만 허용
  // sameSite: "none", // 쿠키 전송 제한 없음
};

// 중앙 설정 게시판의 listCount, groupCount
exports.listCount = 20;
exports.groupCount = 5;
