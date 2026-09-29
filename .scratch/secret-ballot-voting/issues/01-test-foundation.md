# 01: 기반 설정: 도메인 테스트 하네스

**What to build:** 개발자가 명령 하나로 투표 도메인 모듈 테스트를 실제 Postgres(테스트 전용 Neon 브랜치)에 대고 돌릴 수 있게 한다. 이후 티켓들이 이 하네스 위에서 각 사용자 여정의 동작을 테스트로 고정한다. 스펙: `.scratch/secret-ballot-voting/spec.md`, Testing Decisions.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Vitest가 설치되어 있고, 테스트 실행 스크립트가 있다.
- [ ] 테스트는 `TEST_DATABASE_URL`로 연결한다. 이 값이 없으면 운영 DB에 붙지 않고, 분명한 메시지와 함께 실패한다.
- [ ] 테스트 시작 전에 스키마 설정이 테스트 DB에 적용된다. 여러 번 적용해도 안전하다.
- [ ] 테스트마다 고유 접두사로 데이터를 만들고, 끝나면 정리하는 도우미가 있다. 테스트끼리 서로 영향을 주지 않는다.
- [ ] 스모크 테스트 하나가 DB에 연결해 스키마의 테이블이 있는지 확인하고 통과한다.
- [ ] README에 테스트 DB 준비와 실행 방법이 적혀 있다.
- [ ] 타입 검사, lint, 빌드가 통과한다.
