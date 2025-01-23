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

// 장부 가져오기 정산완료되지 않은 장부 가져오기
exports.selectPartyBookListByFamilyIdAndMemberId = async (params) => {
  const queryString = `
    SELECT p.* FROM party_book p
    LEFT JOIN member m ON p.memberId = m.id
    LEFT JOIN party_member pm ON p.id = pm.partyId
    WHERE p.endDate IS NULL 
      AND (
        pm.memberId = :memberId 
        OR p.memberId = :memberId
      )
    GROUP BY p.id
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 장부 새로 등록하기
exports.insertNewPartyBookByMemberId = async (params) => {
  const queryString = `
    INSERT INTO party_book (
      name, regDate, idFamily2Clan, memberId
    ) VALUES (
      :bookName, now(), :familyId, :memberId
    )
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 모임장부에 회원 참여자 추가하기
exports.insertNewPartyBookMemberByMemberId = async (params) => {
  const queryString = `
    INSERT INTO party_member (
      partyId, memberId
    ) VALUES (
      :bookId, :memberId
    )
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 모임에 이미 해당 회원 참여 되어 있는지 체크
exports.selectCountMemberIdByPartyIdAndMemberId = async (params) => {
  const queryString = `
    SELECT COUNT(memberId) AS count FROM party_member
    WHERE partyId = :bookId
      AND memberId = :memberId
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 모임에 속한 회원 목록 불러오기
exports.selectPartyMemberListByPartyId = async (params) => {
  const queryString = `
    SELECT p.*, m.name, m.account, m.email
    FROM party_member p
    INNER JOIN member m ON p.memberId = m.id
    WHERE partyId = :bookId
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 모임에 지출 내역 생성하기
exports.insertNewExpenseByBookId = async (params) => {
  const queryString = `
    INSERT INTO party_expense (
      partyId, memberId, description,
      currencyId, amount, regDate, editDate,
      method, writeMemberId
    ) VALUES (
      :bookId, :memberId, :description,
      :currencyId, :amount, :dateTime, now(),
      :method, :myMemberId
    )
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 모임 지출내역expense 목록 불러오기
exports.selectPartyExpenseListByBookId = async (params) => {
  const queryString = `
    SELECT e.*, m.name, m.account,
    c.currencySymbol, c.currencyName,
    wm.name AS writer, wm.account AS writerAccount
    FROM party_expense e
    LEFT JOIN member m ON e.memberId = m.id
    LEFT JOIN member wm ON e.writeMemberId = wm.id
    LEFT JOIN currency c ON e.currencyId = c.id
    WHERE partyId = :bookId
    ORDER BY e.regDate DESC, e.id DESC
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 모임 지출내역expense 하나 불러오기
exports.selectPartyExpenseItemByExpenseId = async (params) => {
  const queryString = `
    SELECT e.*, m.name, m.account,
    c.currencySymbol, c.currencyName,
    wm.name AS writer, wm.account AS writerAccount
    FROM party_expense e
    LEFT JOIN member m ON e.memberId = m.id
    LEFT JOIN member wm ON e.writeMemberId = wm.id
    LEFT JOIN currency c ON e.currencyId = c.id
    WHERE e.id = :expenseId
    ORDER BY e.regDate DESC, e.id DESC
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 모임 지출내역 분배(디테일) 내역 생성하기
exports.insertNewDistributionByExpenseId = async (params) => {
  const queryString = `
    INSERT INTO party_distribution (
      bookId, expenseId, memberId, distVar
    ) VALUES (
      :bookId, :expenseId, :memberId, :distVar
    )
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 모임 지출 분배내역 distribution 불러오기
exports.selectExpenseDistListByExpenseId = async (params) => {
  const queryString = `
    SELECT d.*, m.name, m.account, e.amount,
      (ROUND(e.amount/COUNT(d.id) OVER(),1)) AS distValue
    FROM party_distribution d
    LEFT JOIN member m ON d.memberId = m.id
    LEFT JOIN party_expense e ON d.expenseId = e.id
    WHERE d.expenseId = :expenseId
    ORDER BY m.name ASC
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 공금 처리 목록 불러오기
exports.selectExpensePublicByPartyId = async (params) => {
  const queryString = `
    SELECT e.*, c.currencySymbol, c.currencyName
    FROM party_expense e
    LEFT JOIN currency c ON e.currencyId = c.id
    WHERE e.partyId = :partyId
      AND e.memberId IS NULL
    ORDER BY e.regDate DESC
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 지출 내역 전체현황(통계)정리를 위한 지출값 불러오기
exports.selectTotalDistForStats = async (params) => {
  const queryString = `
  SELECT d.*, dm.name AS distMemberName,
    dm.account AS distMemberAccount,
    CASE
      WHEN e.method = 1 THEN (round(e.amount/count(d.expenseId) over(partition by e.id),1))
      WHEN e.method = 2 THEN (round(e.amount/count(d.expenseId) over(partition by e.id),1))
      WHEN e.method = 3 THEN (round(e.amount/count(d.expenseId) over(partition by e.id),1))
      WHEN e.method = 4 THEN (round(e.amount/count(d.expenseId) over(partition by e.id),1))
      WHEN e.method = 5 THEN (round(e.amount/count(d.expenseId) over(partition by e.id),1))
      ELSE 0 
    END AS distValue,
    e.currencyId, c.currencyName, c.currencySymbol, 
    e.memberId AS payMemberId, em.name AS payMemberName, em.account AS payMemberAccount,
    e.amount, e.description
  FROM FAMILYTREE.party_distribution d
  LEFT JOIN FAMILYTREE.member dm ON d.memberId = dm.id
  LEFT JOIN FAMILYTREE.party_expense e ON e.id = d.expenseId
  LEFT JOIN FAMILYTREE.member em ON e.memberId = em.id
  LEFT JOIN FAMILYTREE.currency c ON e.currencyId = c.id
  WHERE d.bookId = :bookId
  ORDER BY d.id DESC
`;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 지출 내역 삭제를 위한 분배 삭제 delete distribution
exports.deleteDistByExpenseId = async (params) => {
  const queryString = `
    DELETE FROM party_distribution
    WHERE expenseId = :expenseId
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 지출 내역 삭제 delete expense
exports.deleteExpenseByExpenseId = async (params) => {
  const queryString = `
    DELETE FROM party_expense
    WHERE id = :expenseId
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  if (result[0].affectedRows === 0) {
    throw new Error("이미 삭제된 지출 내역입니다.");
  }
  return result[0];
};
