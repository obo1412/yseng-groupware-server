const customUtils = {
  // 랜덤 숫자 만들어주기 함수
  makeRandomPw: function (length) {
    var result = "";
    var characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  },

  // query 사용할 때, 엔터 \n 없애주기
  removeSpecialChracters: function (value) {
    let result = value.replaceAll("\n", " ");
    return result;
  },

  // ip값에 ::ffff: 이거 포함되어있으면 삭제
  extractIPv4Address: function (value) {
    if (!value) {
      return null;
    }
    const lastIndex = value.lastIndexOf(":");
    let result = value;
    if (lastIndex !== -1) {
      result = value.slice(lastIndex + 1);
    }
    return result;
  },

  // 게시글 textarea에 줄바꿈 태그처리
  contentMakeHtmlDocument: function (value) {
    if (!value) {
      return null;
    }
    const result = value.replace(/\n/g, "<br />");
    return result;
  },

  // 파일명과 확장자명 분리
  seperateFileNameAndExt: function (fileFullName) {
    if (!fileFullName) {
      return;
    }
    const fileDotIndex = fileFullName.lastIndexOf(".");
    const fileName = fileFullName.substring(0, fileDotIndex);
    const fileExt = fileFullName.substring(fileDotIndex);

    return (result[2] = [fileName, fileExt]);
  },

  // 공백 체크 기능 - 왜 이렇게 만들었지? 확인 필요
  checkEmptyOrSpace: function (value) {
    if (value === undefined || value === null) return true;

    let valueLength = value.length;
    let spaceMatch = value.match(/ /g);
    let spaceLength = 0;

    if (spaceMatch !== null)
      spaceLength = spaceMatch.filter((item) => item !== "").length;

    if (valueLength === spaceLength) return true;

    return false;
  },

  // 공백체크
  isContainSpace: function (value) {
    if (value === undefined || value === null) return true;

    const pattern = /\s/g;

    if (value.match(pattern)) {
      // 공백 있음
      return true;
    } else {
      return false;
    }
  },

  // 0 붙여주는 함수
  padZero: function (num) {
    return num.toString().padStart(2, "0");
  },

  // 날짜 형태 YYYY-MM-DD HH-mm-ss 형태로 바꿔주기
  dateFormatter: function (oriDate) {
    if (!oriDate) {
      return;
    }
    const date = new Date(oriDate);
    const result = `${date.getFullYear()}-${this.padZero(
      date.getMonth() + 1
    )}-${this.padZero(date.getDate())} ${this.padZero(
      date.getHours()
    )}:${this.padZero(date.getMinutes())}:${this.padZero(date.getSeconds())}`;
    return result;
  },

  // area code 1-1을 이용하여 지명 이름 가져오기
  getAreaNameByAreaCode: function (ac) {
    let result = [];

    if (ac === undefined || ac === "undefined" || ac === null) {
      return result;
    }

    const addrCode = ac.split("-");
    let addr1Idx = 0;
    let addr2Idx = 0;
    let addr3Idx = 0;
    addrCode.map((addr, index) => {
      if (index === 0) {
        addr1Idx = Number(addr - 1);
        result.push(Areas.Area[addr1Idx].name);
      } else if (index === 1) {
        addr2Idx = Number(addr - 1);
        result.push(Areas.Area[addr1Idx].districts[addr2Idx].name);
      } else if (index === 2) {
        addr3Idx = Number(addr - 1);
        result.push(
          Areas.Area[addr1Idx].districts[addr2Idx].districts[addr3Idx].name
        );
      }
    });

    return result;
  },

  hidePhoneNumberMiddlePart: function (phone) {
    if (phone === null || phone.trim() === "") {
      return null;
    }

    if (phone.length > 4) {
      let hiddenPart = "";
      for (let i = 0; i < phone.length - 4; i++) {
        hiddenPart += "*";
      }
      return hiddenPart + phone.slice(-4);
    } else {
      return phone;
    }
  },
};

module.exports = customUtils;
