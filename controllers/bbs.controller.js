const dbConfig = require("../config/db.config.js")();
const connection = dbConfig.initPool();
const util = require("util");
const service = require("../service/bbs.service.js");
// 아래 사용하는지 안하는지 판단해서 정리하기
const query = util.promisify(connection.query).bind(connection); // node native promisify
const fs = require("fs");
// const winston = require("../winston");
// const { ROLES, HTTPCODE } = require("../config/Constant.js");
const bcrypt = require("bcryptjs");
const jwtConfig = require("../config/jwt.config.js");
const optionConfig = require("../config/option.config.js");
const { makeThumbnail } = require("../config/upload.config.js");
const customUtils = require("../utils/customUtils.js");

// 가족별 게시글 목록 가져오기
exports.documentListByFamilyId = async (req, res) => {
  const targetFamilyId = req.params.familyId;
  const params = {
    targetFamilyId,
  };
  try {
    const result = await service.selectDocumentListByFamilyId(params);
    return res.send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

// 게시글 조회 & 댓글(게시글에 댓글포함) 조회
exports.documentReadByDocId = async (req, res) => {
  const docId = req.params.docId;
  const params = {
    docId,
  };
  try {
    let result = await service.selectDocumentReadByDocId(params);
    const commentList = await service.selectCommentListByDocId(params);
    result[0].commentListResult = commentList;
    return res.send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

// 게시글 쓰기
exports.documentWrite = async (req, res) => {
  let { subject, content, familyId, memberId } = req.body;
  content = customUtils.contentMakeHtmlDocument(content);
  const params = {
    subject,
    content,
    memberId,
    familyId,
  };
  try {
    const result = await service.insertDocument(params);
    return res.send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

// 댓글 쓰기
exports.commentWriteToDocId = async (req, res) => {
  let { documentId, memberId, content } = req.body;
  content = customUtils.contentMakeHtmlDocument(content);
  const params = {
    documentId,
    memberId,
    content,
  };
  try {
    const result = await service.insertCommentToDocId(params);
    return res.send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};
