import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// 테스트는 TEST_DATABASE_URL(테스트 전용 Neon 브랜치)에만 연결한다.
// 앱 코드는 DATABASE_URL을 읽으므로, 테스트 프로세스에서는 그 자리에 테스트 DB를 넣는다.
const env = { ...loadEnv("test", process.cwd(), ""), ...process.env };
const testDatabaseUrl = env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL이 없습니다. 테스트 전용 Neon 브랜치의 연결 문자열을 .env.local에 넣어 주세요. (README의 '테스트' 참고)",
  );
}
if (testDatabaseUrl === env.DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL이 DATABASE_URL과 같습니다. 테스트는 운영 DB와 다른 DB에서만 돌립니다.");
}

// globalSetup은 메인 프로세스에서 돌기 때문에 test.env가 아니라 process.env로 넘겨야 한다.
process.env.TEST_DATABASE_URL = testDatabaseUrl;

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    env: { DATABASE_URL: testDatabaseUrl, TEST_DATABASE_URL: testDatabaseUrl },
    // 모든 테스트가 같은 DB를 쓰므로 파일 단위 병렬 실행은 끈다. 데이터는 접두사로 분리한다.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
