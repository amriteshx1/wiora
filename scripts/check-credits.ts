import { sql } from "./sql";
import { consumeCredit, creditBalance, grantCredits, refundCredits, reserveCredit, restoreCredit } from "../src/modules/preparations/server/credits";
const userId = `creditcheck${Date.now().toString(36)}`;
const productId = process.env.POLAR_PRODUCT_PRO!;
const orderId = `order_${userId}`;

async function main() {
  await sql`
    insert into "user" (id, name, email, email_verified, created_at, updated_at)
    values (${userId}, ${"Credit check"}, ${`${userId}@wiora.test`}, false, now(), now())
  `;
  const granted = await grantCredits({ userId, orderId, productId, checkoutId: "chk_1" });
  const duplicate = await grantCredits({ userId, orderId, productId, checkoutId: "chk_1" });
  const unknown = await grantCredits({ userId, orderId: `${orderId}_bad`, productId: "not-a-product", checkoutId: null });
  const balance = await creditBalance(userId);
  const prepA = `${userId}p`;
  const prepB = `${userId}q`;
  const runA = `${userId}a`;
  const runB = `${userId}b`;
  await sql`
    insert into preparations (id, user_id, conversation_type, title, status, context, situation_version, created_at, updated_at)
    values
      (${prepA}, ${userId}, ${"custom"}, ${"Credit check"}, ${"ready"}, ${"{}"}::jsonb, 1, now(), now()),
      (${prepB}, ${userId}, ${"custom"}, ${"Credit check"}, ${"ready"}, ${"{}"}::jsonb, 1, now(), now())
  `;
  await sql`
    insert into simulation_runs (
      id, preparation_id, user_id, kind, situation_version, duration_minutes, status, created_at, updated_at
    ) values
      (${runA}, ${prepA}, ${userId}, ${"full"}, 1, 30, ${"unpaid"}, now(), now()),
      (${runB}, ${prepB}, ${userId}, ${"full"}, 1, 30, ${"unpaid"}, now(), now())
  `;
  const [first, second] = await Promise.all([
    reserveCredit(userId, runA),
    reserveCredit(userId, runB),
  ]);
  const afterReserve = await creditBalance(userId);
  await consumeCredit(runA);
  const restored = await restoreCredit(runA);
  const afterRestore = await creditBalance(userId);
  const refunded = await refundCredits({ orderId, productId, checkoutId: "chk_1" });
  const refundedAgain = await refundCredits({ orderId, productId, checkoutId: "chk_1" });
  const afterRefund = await creditBalance(userId);
  const restoredAfterRefund = await restoreCredit(runB);
  const afterRefundRestore = await creditBalance(userId);
  console.log(JSON.stringify({
    granted,
    duplicate,
    unknown,
    balance,
    first,
    second,
    afterReserve,
    restored,
    afterRestore,
    refunded,
    refundedAgain,
    afterRefund,
    restoredAfterRefund,
    afterRefundRestore,
  }));
  if (!granted || duplicate || unknown || balance !== 5) throw new Error("purchase accounting failed");
  if (afterReserve !== 3) throw new Error(`expected two reservations to leave 3, got ${afterReserve}`);
  if (!restored || afterRestore !== 4) throw new Error("restore failed");
  if (!refunded || refundedAgain || afterRefund !== 0) throw new Error("refund accounting failed");
  if (!restoredAfterRefund || afterRefundRestore !== 0) throw new Error("refunded credit was returned");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql`delete from "user" where id = ${userId}`;
  });
