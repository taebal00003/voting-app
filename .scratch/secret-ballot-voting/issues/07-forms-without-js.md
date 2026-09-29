# 07: JavaScript가 막혀도 폼이 조용히 실패하지 않게 한다

**What to build:** 투표 만들기, 명부 등록, 투표하기 폼은 지금 클라이언트 JavaScript가 있어야만 제출된다. 제출 흐름에 입력값 유지, 확인 창, "내 선택" 저장이 들어 있기 때문이다. JavaScript가 로드되지 않으면 버튼을 눌러도 페이지만 새로고침되고, 아무 안내 없이 저장되지 않는다.

실제로 개발 중에 IP 주소(`10.107.1.3`)로 접속했을 때 이 일이 있었다. Next 개발 서버가 JavaScript 파일을 막아서 명부 등록이 안 됐는데, 화면에는 아무 표시가 없었다.

사용자가 "눌렀는데 아무 일도 없음"을 겪지 않게 한다. 최소한 JavaScript 없이는 동작하지 않는다는 안내를 보여주고, 가능하면 JavaScript 없이도 제출되게 한다.

**Blocked by:** None (can start immediately)

**Status:** needs-triage

- [ ] JavaScript가 없을 때 세 폼의 동작을 정한다: 안내만 보여줄지, JavaScript 없이도 제출되게 할지
- [ ] 정한 방식대로 구현하고, JavaScript를 끈 브라우저에서 확인한다
- [x] 개발 중 IP 접속은 `allowedDevOrigins`로 허용해야 한다는 점을 README에 적는다

## Comments

- 2026-09-29 같은 증상이 세 번 반복되어(10.107.1.3, 10.106.2.230), `allowedDevOrigins: ["10.*.*.*"]`를 추가하고 README에 적었다.
  - 확인 결과: 10.106.2.230 출처는 200, 192.168.0.5 출처는 403.
  - JavaScript 없이 폼이 조용히 실패하는 근본 문제(항목 1, 2)는 아직 남아 있다.
