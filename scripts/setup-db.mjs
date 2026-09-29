// 사용법: npm run db:setup  (DATABASE_URL은 .env.local에서 읽음)
import { applySchema } from "../db/apply-schema.mjs";

const count = await applySchema(process.env.DATABASE_URL);
console.log(`스키마 적용 완료 (${count}개 구문)`);
