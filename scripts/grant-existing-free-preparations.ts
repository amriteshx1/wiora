import { sql } from "./sql";
import { sql as appSql } from "../src/db";
import { grantFreePreparationCredits } from "../src/modules/preparations/server/preparation-credits";

async function main() {
  const users = await sql`select id from "user"`;
  let granted = 0;
  for (const user of users) {
    if (await grantFreePreparationCredits(String(user.id))) {
      granted += 1;
    }
  }
  console.log(`granted=${granted} users=${users.length}`);
}

async function close() {
  await Promise.all([
    sql.end({ timeout: 1 }).catch(() => undefined),
    appSql.end({ timeout: 1 }).catch(() => undefined),
  ]);
}

main()
  .then(async () => {
    await close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await close();
    process.exit(1);
  });
