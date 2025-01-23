const multer = require("multer");
const customUtils = require("../utils/customUtils");
const sharp = require("sharp");
const fs = require("fs");

//cross-env를 이용하여 prod상태인지 dev 상태인지 판별
//배포상태면 prod
const PRODUCTION = process.env.NODE_ENV === "development" ? false : true;

// /files 까지는 공통이고, 각 프로젝트마다 프로젝트키값 뒤에 붙여주기
// 파일서버 경로 중앙관리
exports.uploadUrl = "https://deka.co.kr:8527/files/wolf/";

// 파일 경로 세팅
exports.fileDir = "../wolf-files/";
// if (PRODUCTION) {
//   fileDir = "/home/files";
// }

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, this.fileDir); // 파일이 저장될 경로 설정
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname;
    const fileExtLoc = originalName.lastIndexOf(".");
    const fileExt = originalName.substring(fileExtLoc);
    cb(null, Date.now() + customUtils.makeRandomPw(4) + fileExt); // 파일명 설정
  },
  fileFilter: (req, file, cb) => {
    cb(null, true); // 파일 저장 전 업로드된 파일의 이름을 바꿀 때 사용.
  },
});

// 업로드 multer 객체
exports.upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 10, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    cb(null, true); // 업로드 되는 파일의 유효성 검사
  },
});

// sharp 패키지 썸네일 만들어주기
exports.makeThumbnail = async function (imagePath) {
  const fileDotIndex = imagePath.lastIndexOf(".");
  const fileName = imagePath.substring(0, fileDotIndex);
  const fileExt = imagePath.substring(fileDotIndex);

  sharp(this.fileDir + imagePath)
    .rotate()
    .resize(100)
    .toFile(this.fileDir + fileName + "_thumbnail" + fileExt, (err, info) => {
      if (err) console.log(err);
      // console.log(info);
      // 원본 삭제 필요시 처리 코드
      // fs.unlink("삭제할파일경로",(err)=>{
      //   if(err) console.log(err)
      // })
    })
    .toBuffer();

  return;
};

// 썸네일포함 업로드된 파일 지우기
exports.unlinkFilesByRollback = async function (files) {
  let isFirst = true;
  if (files?.length > 0) {
    for (const file of files) {
      fs.unlinkSync(this.fileDir + file.filename);
      if (isFirst) {
        const firstFile = customUtils.seperateFileNameAndExt(file.filename);
        const thumbnailFilePath =
          this.fileDir + firstFile[0] + "_thumbnail" + firstFile[1];
        if (fs.existsSync(thumbnailFilePath)) {
          fs.unlinkSync(thumbnailFilePath);
        }
        isFirst = false;
      }
    }
  }
  return;
};
