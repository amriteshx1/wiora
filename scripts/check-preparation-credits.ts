import { sql } from "./sql";
import { grantCredits } from "../src/modules/preparations/server/credits";
import {
  consumePreparationCredit,
  grantFreePreparationCredits,
  grantPreparationPurchase,
  preparationCreditBalance,
  reservePreparationCredit,
  restorePreparationCredit,
} from "../src/modules/preparations/server/preparation-credits";

const userId = `prepcred${Date.now().toString(36)}`;
const productPro = process.env.POLAR_PRODUCT_PRO!;
const productPlus = process.env.POLAR_PRODUCT_PLUS!;
const productSuper = process.env.POLAR_PRODUCT_SUPER!;

async function insertPrep(id: string) {
  await sql`
    insert into preparations (id, user_id, conversation_type, title, status, context, situation_version, created_at, updated_at)
    values (${id}, ${userId}, ${"custom"}, ${"Prep credit check"}, ${"draft"}, ${"{}"}::jsonb, 1, now(), now())
  `;
}

async function main() {
  await sql`
    insert into "user" (id, name, email, email_verified, created_at, updated_at)
    values (${userId}, ${"Prep credit check"}, ${`${userId}@wiora.test`}, false, now(), now())
  `;

  const free = await grantFreePreparationCredits(userId);
  const freeAgain = await grantFreePreparationCredits(userId);
  const afterFree = await preparationCreditBalance(userId);
  if (!free || freeAgain || afterFree !== 10) {
    throw new Error(`free grant failed free=${free} again=${freeAgain} balance=${afterFree}`);
  }

  const granted = await grantCredits({
    userId,
    orderId: `order_${userId}_pro`,
    productId: productPro,
    checkoutId: "chk_pro",
  });
  const duplicate = await grantCredits({
    userId,
    orderId: `order_${userId}_pro`,
    productId: productPro,
    checkoutId: "chk_pro",
  });
  const afterPro = await preparationCreditBalance(userId);
  if (!granted || duplicate || afterPro !== 20) {
    throw new Error(`pro grant failed granted=${granted} duplicate=${duplicate} balance=${afterPro}`);
  }

  const plus = await grantPreparationPurchase({
    userId,
    orderId: `order_${userId}_plus`,
    productId: productPlus,
    checkoutId: "chk_plus",
  });
  const plusAgain = await grantPreparationPurchase({
    userId,
    orderId: `order_${userId}_plus`,
    productId: productPlus,
    checkoutId: "chk_plus",
  });
  const superGrant = await grantPreparationPurchase({
    userId,
    orderId: `order_${userId}_super`,
    productId: productSuper,
    checkoutId: "chk_super",
  });
  const afterPurchases = await preparationCreditBalance(userId);
  if (!plus || plusAgain || !superGrant || afterPurchases !== 70) {
    throw new Error(`accumulated grants failed plus=${plus} plusAgain=${plusAgain} super=${superGrant} balance=${afterPurchases}`);
  }

  const prepA = `${userId}a`;
  const prepB = `${userId}b`;
  await insertPrep(prepA);
  await insertPrep(prepB);

  const [first, second] = await Promise.all([
    reservePreparationCredit(userId, prepA),
    reservePreparationCredit(userId, prepA),
  ]);
  const afterReserveA = await preparationCreditBalance(userId);
  const reservedOnce = [first, second].filter((result) => result === "reserved").length === 1;
  const alreadyOnce = [first, second].includes("already");
  if (!reservedOnce || !alreadyOnce || afterReserveA !== 69) {
    throw new Error(`concurrent reserve failed first=${first} second=${second} balance=${afterReserveA}`);
  }

  const reservedAgain = await reservePreparationCredit(userId, prepA);
  if (reservedAgain !== "already") {
    throw new Error(`existing reservation should be idempotent, got ${reservedAgain}`);
  }

  await consumePreparationCredit(prepA);
  await consumePreparationCredit(prepA);
  const afterConsume = await preparationCreditBalance(userId);
  if (afterConsume !== 69) {
    throw new Error(`consume should be idempotent, balance=${afterConsume}`);
  }

  const reservedB = await reservePreparationCredit(userId, prepB);
  if (reservedB !== "reserved") throw new Error(`reserve B failed: ${reservedB}`);
  const restored = await restorePreparationCredit(prepB);
  const afterRestore = await preparationCreditBalance(userId);
  if (!restored || afterRestore !== 69) {
    throw new Error(`restore failed restored=${restored} balance=${afterRestore}`);
  }

  const reservedB2 = await reservePreparationCredit(userId, prepB);
  if (reservedB2 !== "reserved") throw new Error(`re-reserve after restore failed: ${reservedB2}`);
  await restorePreparationCredit(prepB);

  console.log(JSON.stringify({
    free,
    freeAgain,
    afterFree,
    granted,
    duplicate,
    afterPro,
    plus,
    plusAgain,
    superGrant,
    afterPurchases,
    afterConsume,
    afterRestore,
  }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql`delete from "user" where id = ${userId}`;
    await sql.end({ timeout: 1 });
    process.exit(process.exitCode ?? 0);
  });
