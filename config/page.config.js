class PageHelper {
  nowPage = 1;
  listCount = 20; // 한 페이지에 보여질 글의 목록 수 기본값
  groupCount = 5; // 한 화면에 보여질 페이지 개수 기본값

  totalPage = 0; // 전체 페이지 수
  startPage = 0; // 현재 그룹의 시작 페이지
  endPage = 0; // 현재 그룹의 마지막 페이지
  prevPage = 0; // 이전 그룹의 마지막 페이지
  nextPage = 0; // 다음 그룹의 첫 페이지
  limitStart = 0; // DB에서 호출할 limit 시작 위치

  pageProcess(nowPage, totalCount, listCount, groupCount) {
    this.nowPage = nowPage;
    this.totalCount = totalCount;
    this.listCount = listCount;
    this.groupCount = groupCount;

    // 전체 페이지 수
    this.totalPage = parseInt((totalCount - 1) / listCount + 1);

    // 페이지에 대한 오차 조절
    if (nowPage < 0) {
      this.nowPage = 1;
    }
    if (nowPage > this.totalPage) {
      this.nowPage = this.totalPage;
    }

    // 현재 페이징 그룹의 시작 페이지 번호
    this.startPage = parseInt((nowPage - 1) / groupCount) * groupCount + 1;
    this.endPage =
      parseInt((this.startPage - 1 + groupCount) / groupCount) * groupCount;

    // 끝 페이지 번호가 전체 페이지수 초과하면 오차범위 조절
    if (this.endPage > this.totalPage) {
      this.endPage = this.totalPage;
    }

    // 이전 그룹의 마지막 페이지
    if (this.startPage > groupCount) {
      this.prevPage = this.startPage - 1;
    } else {
      this.prevPage = 0;
    }

    // 다음 그룹의 첫 페이지
    if (this.endPage < this.totalPage) {
      this.nextPage = this.endPage + 1;
    } else {
      this.nextPage = 0;
    }

    // 검색 범위의 시작 위치
    this.limitStart = (nowPage - 1) * listCount;
  }

  findCurrentPage(curOrder, listCount) {
    this.curOrder = curOrder;
    this.listCount = listCount;

    this.nowPage = parseInt((curOrder - 1) / listCount) + 1;
  }
}

module.exports = PageHelper;
