const service = require("../service/party.service.js");
const customUtils = require("../utils/customUtils.js");

// 나의 모임장부 목록 가져오기
exports.partyBookListByFamilyIdAndMemberId = async (req, res) => {
  const memberId = req.params.memberId;
  const params = {
    memberId,
  };
  try {
    const result = await service.selectPartyBookListByFamilyIdAndMemberId(
      params
    );
    return res.send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

// 모임장부 새로 생성하기
exports.makeNewPartyBookByMemberId = async (req, res) => {
  const { memberId, bookName } = req.body;
  const params = {
    memberId,
    bookName,
  };
  try {
    await service.beginTransaction();
    // 장부 생성하고
    const result = await service.insertNewPartyBookByMemberId(params);
    console.log(result.insertId);
    const memberResult = await service.insertNewPartyBookMemberByMemberId({
      bookId: result.insertId,
      memberId,
    });
    await service.commit();
    return res.send(memberResult);
  } catch (error) {
    await service.rollback();
    console.log(error);
    return res.status(500).send(error);
  }
};

// 모임장부에 회원 참여자로 추가하기
exports.inviteMemberToPartyBook = async (req, res) => {
  const { bookId, partyMember } = req.body;
  let params = { bookId };
  let result;
  try {
    await service.beginTransaction();
    if (partyMember.length === 0) {
      throw new Error("회원 데이터가 없습니다.(inviteMemberToPartyBook)");
    }
    for (const member of partyMember) {
      params = { bookId, memberId: member.id };
      const checkCount = await service.selectCountMemberIdByPartyIdAndMemberId(
        params
      );
      if (checkCount[0].count === 0) {
        result = await service.insertNewPartyBookMemberByMemberId(params);
      }
    }
    await service.commit();
    return res.send(result);
  } catch (error) {
    await service.rollback();
    console.log(error);
    return res.status(500).send(error);
  }
};

// 해당 모임의 참여자 목록 불러오기
exports.getMemberListByBookId = async (req, res) => {
  const bookId = req.params.bookId;
  try {
    const result = await service.selectPartyMemberListByPartyId({ bookId });
    return res.send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

// 모임 장부에 지출 내역 생성하기
exports.makeNewExpenseByBookId = async (req, res) => {
  const {
    bookId,
    memberId,
    description,
    amount,
    currencyId,
    date,
    time,
    inOrEx,
    method,
    distribution,
    myMemberId,
  } = req.body;

  try {
    await service.beginTransaction();
    // 숫자가 아니면 처리 취소
    if (isNaN(amount)) {
      throw new Error("지출 비용에 숫자값을 입력하세요");
    }

    // 분배방식 처리와 분배 회원 가변 변수 선언
    let methodControl = method;
    let distControl = distribution;

    // 지불 회원id값이 없으면, 공금사용처리
    // 공금 사용 처리는 분배 처리가 불필요함.
    if (memberId === null) {
      methodControl = 0;
      distControl = [];
    }

    // 지출 메인 파라미터
    let params = {
      bookId,
      memberId,
      dateTime: `${date} ${time}`,
      description,
      currencyId,
      amount: amount * inOrEx,
      method: methodControl,
      myMemberId,
    };
    const result = await service.insertNewExpenseByBookId(params);

    let distParams = {
      bookId,
      expenseId: result.insertId,
    };
    // 분배 회원 배열에 인원이 없으면 처리 하지 않음.
    for (const distMember of distControl) {
      distParams = {
        ...distParams,
        memberId: distMember.memberId,
        distVar: distMember.distVar,
      };
      await service.insertNewDistributionByExpenseId(distParams);
    }

    await service.commit();
    return res.send(result);
  } catch (error) {
    await service.rollback();
    console.log(error);
    return res.status(500).send(error);
  }
};

// 모임 지출내역 목록 불러오기
exports.getExpenseListByBookId = async (req, res) => {
  const bookId = req.params.bookId;
  const params = {
    bookId,
  };
  try {
    const result = await service.selectPartyExpenseListByBookId(params);
    return res.send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

// 모임 지출내역 하나 불러오기
exports.getExpenseItemByExpenseId = async (req, res) => {
  const expenseId = req.params.expenseId;
  const params = {
    expenseId,
  };
  try {
    const result = await service.selectPartyExpenseItemByExpenseId(params);
    return res.send(result[0]);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

// 공금 처리 목록 불러오기
exports.getExpensePublicByPartyId = async (req, res) => {
  const partyId = req.params.partyId;
  const params = {
    partyId,
  };
  try {
    const result = await service.selectExpensePublicByPartyId(params);
    return res.send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

// 해당 지출의 분배(상세)내역 불러오기
exports.getDistributionListByExpenseId = async (req, res) => {
  const expenseId = req.params.expenseId;
  const params = {
    expenseId,
  };
  try {
    const result = await service.selectExpenseDistListByExpenseId(params);
    return res.send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

// 회원사용 지출분배 현황정리를 위한 내역 불러오기
exports.getTotalDistForStatsByPartyId = async (req, res) => {
  const bookId = req.params.partyId;
  const params = {
    bookId,
  };
  try {
    const result = await service.selectTotalDistForStats(params);
    return res.send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

// 지출 내용 삭제 처리
exports.deleteExpenseAndDistByExpenseId = async (req, res) => {
  const expenseId = req.params.expenseId;
  const params = {
    expenseId,
  };
  try {
    await service.beginTransaction();
    await service.deleteDistByExpenseId(params);
    const result = await service.deleteExpenseByExpenseId(params);
    await service.commit();
    return res.send(result);
  } catch (error) {
    console.log(error);
    await service.rollback();
    return res.status(500).send(error);
  }
};
