import { applySchema } from "../db/apply-schema.mjs";

export default async function setup() {
  await applySchema(process.env.TEST_DATABASE_URL!);
}
