# 투표 앱

동아리·학생회 같은 소규모 조직을 위한 비밀 투표 앱입니다. 운영자가 투표를 올리면 명부에 등록된 투표자가 개인 투표 코드로 들어와 선택지 하나를 고르고, 투표한 뒤 결과를 봅니다.

용어는 [CONTEXT.md](CONTEXT.md), 주요 설계 결정은 [docs/adr/](docs/adr/)에 있습니다.

## 환경변수

| 이름 | 설명 |
| --- | --- |
| `DATABASE_URL` | Neon Postgres 연결 문자열 |
| `ADMIN_PASSWORD` | 운영자 공용 비밀번호. 바꾸면 기존 운영자 로그인이 모두 끊깁니다. |

로컬에서는 `.env.local`에 넣습니다.

## 로컬 실행

```bash
npm install
npm run db:setup   # 테이블 생성 (여러 번 실행해도 안전)
npm run dev
```

## 테스트

투표 도메인 모듈을 실제 Postgres에 대고 테스트합니다. 운영 DB를 건드리지 않도록 **테스트 전용 Neon 브랜치**를 씁니다.

1. Neon 콘솔 → 프로젝트 → Branches → New branch (예: `test`)로 브랜치를 만들고 연결 문자열을 복사합니다.
2. `.env.local`에 `TEST_DATABASE_URL=<연결 문자열>`을 추가합니다. `DATABASE_URL`과 같으면 테스트가 실행되지 않습니다.
3. `npm test`를 실행합니다. 스키마는 테스트 시작 전에 자동으로 적용되고, 테스트가 만든 데이터는 끝나면 지워집니다.

## Vercel 배포

1. 저장소를 Vercel 프로젝트로 가져옵니다.
2. Project Settings → Environment Variables에 `DATABASE_URL`과 `ADMIN_PASSWORD`를 넣습니다.
3. 배포할 DB에 대해 `npm run db:setup`을 한 번 실행합니다.
4. 배포 후 `/admin`에서 로그인하고, 투표자 명부에 이름을 등록해 코드를 나눠줍니다.

> **비밀 투표 주의**: 앱 화면으로는 누가 무엇을 골랐는지 알 수 없습니다. 하지만 데이터베이스에 직접 접속할 수 있는 사람은 일부를 짝지을 수 있습니다. Neon 프로젝트 멤버 권한과 `DATABASE_URL`은 배포 담당 한두 명에게만 주세요. 자세한 내용은 [결정 기록 0002](docs/adr/0002-secret-ballot-separate-participation.md)에 있습니다.

## 사용 흐름

- **운영자**: `/admin` → 투표자 명부에서 이름 등록 → "이름: 코드 전체 복사"로 코드 전달 → 새 투표 만들기
- **투표자**: 링크 접속 → 투표 코드 입력(기기당 한 번) → 투표 선택 → 투표 후 결과 확인
