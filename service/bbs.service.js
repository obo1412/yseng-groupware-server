const dbConfig = require("../config/db.config.js")();
const pool = dbConfig.initPool();
// const doQuery = util.promisify(pool.query).bind(pool);
// node native mysql2 에서는 사용 필요 없음.
const customUtils = require("../utils/customUtils.js");

// 가족별 게시글 목록 가져오기
exports.selectDocumentListByFamilyId = async (params) => {
  const queryString = `
    SELECT d.*, m.name AS writer,
    COUNT(IF(c.available=1, c.id, NULL)) AS commentCount
    FROM bbs_document d
    LEFT JOIN member m ON d.memberId = m.id
    LEFT JOIN bbs_comment c ON d.id = c.documentId
    WHERE family2ClanId = :targetFamilyId
    AND d.available = 1
    GROUP BY d.id
    ORDER BY d.regDate DESC, d.id DESC
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 게시글 조회
exports.selectDocumentReadByDocId = async (params) => {
  const queryString = `
    SELECT b.*, m.name AS writer FROM bbs_document b
    INNER JOIN member m ON m.id = b.memberId
    WHERE b.id = :docId
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 게시글 작성
exports.insertDocument = async (params) => {
  const queryString = `
    INSERT INTO bbs_document (
      subject, content, regDate, editDate,
      memberId, family2ClanId
    ) VALUES (
      :subject, :content, now(), now(),
      :memberId, :familyId
    )
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 댓글 가져오기
exports.selectCommentListByDocId = async (params) => {
  const queryString = `
  SELECT c.*, m.name FROM bbs_comment c
  INNER JOIN member m ON c.memberId = m.id
  WHERE c.available = 1
  AND documentId = :docId
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};

// 댓글 작성
exports.insertCommentToDocId = async (params) => {
  const queryString = `
    INSERT INTO bbs_comment (
      documentId, memberId, content,
      regDate, editDate
    ) VALUES (
      :documentId, :memberId, :content,
      now(), now()
    )
  `;
  const aQuery = await customUtils.removeSpecialChracters(queryString);
  const result = await pool.query(aQuery, params);
  return result[0];
};
