const dbConfig = require("../config/db.config.js")();
const pool = dbConfig.initPool();
// const doQuery = util.promisify(pool.query).bind(pool);
// node native mysql2 에서는 사용 필요 없음.
const customUtils = require("../utils/customUtils.js");

// 트랜잭션을 위한 함수쿼리
exports.beginTransaction = async function () {
  try {
    await pool.query("START TRANSACTION");
    // console.log("Document Transaction started");
  } catch (error) {
    throw new Error(`Error starting transaction: ${error.message}`);
  }
};
exports.commit = async function () {
  try {
    await pool.query("COMMIT");
    // console.log("Document Transaction committed");
  } catch (error) {
    throw new Error(`Error committing transaction: ${error.message}`);
  }
};
exports.rollback = async function () {
  try {
    await pool.query("ROLLBACK");
    // console.log("Document Transaction rolled back");
  } catch (error) {
    throw new Error(`Error rolling back transaction: ${error.message}`);
  }
};

// 가족 목록 가져오기 테스트
exports.selectMemberList = async (params) => {
  const queryString = `
    SELECT * FROM member
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 가족 목록 가져오기 테스트
exports.selectFamilyMemberList = async (params) => {
  const queryString = `
    SELECT r.*, m.name as name1, s.name as name2 FROM member_relation r
    LEFT JOIN member m ON r.idMemberMe = m.id
    LEFT JOIN member s ON r.idMemberSpouse = s.id
    WHERE idFamily2ClanFather = :targetFamilyId
      OR idFamily2ClanMother = :targetFamilyId
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 회원 가입
exports.insertMemberOne = async function (params) {
  const queryString = `INSERT INTO member (
    account, password, name
    ) VALUES (
    :account, :password, :name
    )`;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 로그인 - 회원정보 불러오기 Account로
exports.selectMemberByAccount = async function (params) {
  const queryString = `
  SELECT *
    FROM member
    WHERE account = :account`;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 회원 로그아웃
exports.updateUserRefreshTokenByRefreshTokenOrUserId = async function (params) {
  const queryString = `
    UPDATE member
    SET refreshToken = null
    WHERE refreshToken = ? OR id = ?
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, [
    params.refreshToken,
    params.memberId,
  ]);
  return result[0];
};

// 회원 아이디 중복체크
const querySelectUserIdCountByAccount = `SELECT COUNT(id) AS count FROM member WHERE account = ?`;
exports.selectUserIdCountByAccount = async function (params) {
  const aQuery = await customUtils.removeSpecialChracters(
    querySelectUserIdCountByAccount
  );
  const result = await pool.query(aQuery, [params.userAccount]);
  return result[0];
};

// 리프레시 토큰 가져오기 account로
exports.selectRefreshTokenByAccount = async function (params) {
  const queryString = `SELECT id, account, password, name, phone, email, refreshToken FROM member WHERE account = :userAccount`;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 리프레시 토큰으로 회원정보 가져오기
// 액세스토큰검증 등 리프레시토큰이 DB에 정상적으로 있는지 확인에 필요
const querySelectUserItemByRefreshToken = `
SELECT m.*,
r.idFamily2ClanFather as fam1, r.idFamily2ClanMother as fam2,
rs.idFamily2ClanFather as fam3, rs.idFamily2ClanMother as fam4
FROM member m
LEFT JOIN member_relation r ON m.id = r.idMemberMe
LEFT JOIN member_relation rs ON r.idMemberSpouse = rs.idMemberMe
WHERE refreshToken = ?`;
exports.selectMemberByRefreshToken = async function (params) {
  const aQuery = await customUtils.removeSpecialChracters(
    querySelectUserItemByRefreshToken
  );
  const result = await pool.query(aQuery, [params.refreshToken]);
  return result[0];
};

// 리프레시토큰 회원정보 업데이트 로그인처리시
const queryUpdateRefreshTokenByIdAndAccount = `UPDATE member SET refreshToken = ? WHERE id=? AND account = ?`;
exports.updateRefreshTokenByIdAndAccount = async function (params) {
  const aQuery = await customUtils.removeSpecialChracters(
    queryUpdateRefreshTokenByIdAndAccount
  );
  const result = await pool.query(aQuery, [
    params.refreshToken,
    params.id,
    params.account,
  ]);
  return result[0];
};

// 비밀번호 변경
exports.updateNewPasswordByAccountAndId = async function (params) {
  const queryString = `
    UPDATE member SET password = :hash
    WHERE account = :account
      AND id = :myMemberId
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 회원 검색을 위한 쿼리 비밀번호 절대 호출 금지
exports.selectMemberOneByAccount = async function (params) {
  const queryString = `
    SELECT id, account, name, email, gender
    FROM member
    WHERE account = :account
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 부모님 연결을 위한 부모님회원 검색 쿼리
exports.selectParentMemberBySearchKey = async function (params) {
  const queryString = `
    SELECT m.id, m.account, m.name, m.email, m.gender,
      m.phone
    FROM member m
    LEFT JOIN member_relation r ON m.id = r.idMemberMe
    WHERE (
        m.account = :searchKey
        OR m.name = :searchKey
        OR m.email = :searchKey
      )
      AND (
        IF(:familyType = 0, m.gender = 1, m.gender=2)
      )
      AND (
        IF(:familyType = 0,
          r.idFamily2ClanFather = :idFamily2ClanFather,
          r.idFamily2ClanFather = :idFamily2ClanMother)
      )
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 정보 변경을 위한 비밀번호 값 호출
exports.selectMemberOneByAccoundAndId = async function (params) {
  const queryString = `
    SELECT
      id, account, password, name, phone, email
    FROM member
    WHERE account = :account
      AND id = :myMemberId
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 정보 변경
exports.updateMemberInfo = async function (params) {
  const queryString = `
    UPDATE member
    SET phone = :phone, email = :email, addr = :addr, nickName = :nickName
    WHERE account = :account
      AND id = :myMemberId
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 성씨 검색
exports.findFamilyName = async function (params) {
  const queryString = `
    SELECT COUNT(id) AS count, id
    FROM family1_name
    WHERE name1Family = :familyName
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 성씨가 없을 경우, 새로운 성씨 생성.
exports.insertNewFamilyName = async function (params) {
  const queryString = `
    INSERT INTO family1_name (
      name1Family
    ) VALUES (
      :familyName
    )
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 본관 검색
exports.findClanNameByFamilyId = async function (params) {
  const queryString = `
    SELECT COUNT(id) AS count, id
    FROM family2_clan
    WHERE idFamily1Name = :familyNameId
      AND name2Clan = :clanName
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 본관이 없을 경우, 새로운 본관 생성.
exports.insertNewClanName = async function (params) {
  const queryString = `
    INSERT INTO family2_clan (
      idFamily1Name, name2Clan
    ) VALUES (
      :familyNameId, :clanName
    )
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 공파 검색
exports.findBranchNameByClanId = async function (params) {
  const queryString = `
    SELECT COUNT(id) AS count, id
    FROM family3_branch
    WHERE idFamily2Clan = :clanNameId
      AND name3Branch = :branchName
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 공파가 없을 경우, 새로운 공파 생성.
exports.insertNewBranchName = async function (params) {
  const queryString = `
    INSERT INTO family3_branch (
      idFamily2Clan, name3Branch
    ) VALUES (
      :clanNameId, :branchName
    )
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 내 가족 연결 정보 불러오기
exports.selectMemberRelationByMyMemberId = async function (params) {
  const queryString = `
    SELECT *
    FROM member_relation
    WHERE idMemberMe = :myMemberId
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 새로운 가족 연결정보 생성하기
exports.insertNewMemberRelation = async function (params) {
  const queryString = `
    INSERT INTO member_relation (
      idMemberMe
    ) VALUES (
      :myMemberId
    )
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 가족 연결 정보 업데이트하기
exports.updateMemberRelationFamilyClanByMyMemberId = async function (params) {
  const queryString = `
    UPDATE member_relation SET
      idFamily2ClanFather = 
      IF(:familyType = 0, :clanNameId, idFamily2ClanFather),
      idFamily2ClanMother = 
      IF(:familyType <> 0, :clanNameId, idFamily2ClanMother),
      familyGeneration = IF(:familyGeneration IS NOT NULL AND :familyType = 0, :familyGeneration, familyGeneration)
    WHERE idMemberMe = :myMemberId
      AND id = :memberRelationId
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 부모님 연결 정보 업데이트하기
exports.updateMemberParentRelation = async function (params) {
  const queryString = `
    UPDATE member_relation SET
      idMemberFather = :idMemberFather,
      idMemberMother = :idMemberMother
    WHERE idMemberMe = :idMemberMe
      AND id = :id
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};
