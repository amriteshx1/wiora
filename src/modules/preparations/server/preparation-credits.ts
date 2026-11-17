import { nanoid } from "nanoid";
import { sql } from "drizzle-orm";

import { db } from "@/db";
import { logUsage } from "@/lib/usage-log";

import {
  FREE_PREPARATION_CREDITS,
  PLAN_PREPARATION_CREDITS,
  planForProductId,
} from "./credit-rules";

type ReserveResult = "reserved" | "already" | "empty";

async function rows(query: ReturnType<typeof sql>) {
  const result = await db.execute(query);
  return [...result] as Record<string, unknown>[];
}

async function ensureAccount(userId: string): Promise<void> {
  await db.execute(sql`
    insert into preparation_credit_accounts (user_id, balance, updated_at)
    values (${userId}, 0, now())
    on conflict (user_id) do nothing
  `);
}

export async function preparationCreditBalance(userId: string): Promise<number> {
  const found = await rows(sql`
    select balance from preparation_credit_accounts where user_id = ${userId}
  `);
  return Number(found[0]?.balance ?? 0);
}

export async function grantFreePreparationCredits(userId: string): Promise<boolean> {
  await ensureAccount(userId);
  const id = nanoid();
  const orderId = `free:${userId}`;
  const inserted = await rows(sql`
    with locked as (
      select balance
      from preparation_credit_accounts
      where user_id = ${userId}
      for update
    ),
    ins as (
      insert into preparation_credit_ledger (
        id, user_id, delta, balance_after, entry_type, plan,
        polar_order_id, created_at
      )
      select
        ${id}, ${userId}, ${FREE_PREPARATION_CREDITS}, locked.balance + ${FREE_PREPARATION_CREDITS},
        'grant_free', null, ${orderId}, now()
      from locked
      where not exists (
        select 1 from preparation_credit_ledger
        where polar_order_id = ${orderId} and entry_type = 'grant_free'
      )
      on conflict (polar_order_id, entry_type) do nothing
      returning id
    )
    update preparation_credit_accounts
    set balance = balance + ${FREE_PREPARATION_CREDITS}, updated_at = now()
    where user_id = ${userId} and exists (select 1 from ins)
    returning user_id
  `);
  const granted = inserted.length > 0;
  if (granted) {
    logUsage({ kind: "preparation_credit", userId, detail: "grant_free", ok: true });
  }
  return granted;
}

export async function grantPreparationPurchase(input: {
  userId: string;
  orderId: string;
  productId: string;
  checkoutId: string | null;
}): Promise<boolean> {
  const plan = planForProductId(input.productId);
  if (!plan) return false;
  await ensureAccount(input.userId);
  const credits = PLAN_PREPARATION_CREDITS[plan];
  const id = nanoid();
  const inserted = await rows(sql`
    with locked as (
      select balance
      from preparation_credit_accounts
      where user_id = ${input.userId}
      for update
    ),
    ins as (
      insert into preparation_credit_ledger (
        id, user_id, delta, balance_after, entry_type, plan,
        polar_order_id, polar_checkout_id, polar_product_id, created_at
      )
      select
        ${id}, ${input.userId}, ${credits}, locked.balance + ${credits}, 'purchase', ${plan},
        ${input.orderId}, ${input.checkoutId}, ${input.productId}, now()
      from locked
      where not exists (
        select 1 from preparation_credit_ledger
        where polar_order_id = ${input.orderId} and entry_type = 'purchase'
      )
      on conflict (polar_order_id, entry_type) do nothing
      returning id
    )
    update preparation_credit_accounts
    set balance = balance + ${credits}, updated_at = now()
    where user_id = ${input.userId} and exists (select 1 from ins)
    returning user_id
  `);
  const granted = inserted.length > 0;
  if (granted) {
    logUsage({ kind: "preparation_credit", userId: input.userId, detail: `purchase:${plan}`, ok: true });
  }
  return granted;
}

export async function preparationCreditHold(preparationId: string): Promise<"reservation" | "deduction" | "none"> {
  const existing = await rows(sql`
    select entry_type from preparation_credit_ledger
    where preparation_id = ${preparationId}
      and entry_type in ('reservation', 'deduction')
  `);
  const types = new Set(existing.map((row) => String(row.entry_type)));
  if (types.has("deduction")) return "deduction";
  if (types.has("reservation")) return "reservation";
  return "none";
}

export async function reservePreparationCredit(userId: string, preparationId: string): Promise<ReserveResult> {
  await grantFreePreparationCredits(userId);
  await ensureAccount(userId);
  const id = nanoid();
  const inserted = await rows(sql`
    with upd as (
      update preparation_credit_accounts
      set balance = balance - 1, updated_at = now()
      where user_id = ${userId}
        and balance >= 1
        and not exists (
          select 1 from preparation_credit_ledger
          where preparation_id = ${preparationId}
            and entry_type in ('reservation', 'deduction')
        )
      returning balance
    ),
    ins as (
      insert into preparation_credit_ledger (
        id, user_id, delta, balance_after, entry_type, preparation_id, created_at
      )
      select ${id}, ${userId}, -1, balance, 'reservation', ${preparationId}, now()
      from upd
      returning id
    ),
    undo as (
      update preparation_credit_accounts
      set balance = balance + 1, updated_at = now()
      where user_id = ${userId}
        and exists (select 1 from upd)
        and not exists (select 1 from ins)
      returning balance
    )
    select (select id from ins) as inserted
  `);
  if (inserted[0]?.inserted) {
    logUsage({ kind: "preparation_credit", userId, preparationId, detail: "reservation", ok: true });
    return "reserved";
  }
  const hold = await preparationCreditHold(preparationId);
  if (hold === "reservation" || hold === "deduction") return "already";
  return "empty";
}

export async function consumePreparationCredit(preparationId: string): Promise<void> {
  const updated = await rows(sql`
    update preparation_credit_ledger
    set entry_type = 'deduction'
    where preparation_id = ${preparationId}
      and entry_type = 'reservation'
    returning id, user_id
  `);
  if (updated[0]?.id) {
    logUsage({
      kind: "preparation_credit",
      userId: String(updated[0].user_id),
      preparationId,
      detail: "deduction",
      ok: true,
    });
  }
}

export async function restorePreparationCredit(preparationId: string): Promise<boolean> {
  const restored = await rows(sql`
    with rel as (
      update preparation_credit_ledger
      set entry_type = 'released'
      where id = (
        select id from preparation_credit_ledger
        where preparation_id = ${preparationId}
          and entry_type = 'reservation'
        limit 1
      )
      returning user_id
    )
    update preparation_credit_accounts
    set balance = preparation_credit_accounts.balance + 1, updated_at = now()
    where user_id = (select user_id from rel)
    returning user_id as inserted
  `);
  const ok = Boolean(restored[0]?.inserted);
  if (ok) {
    logUsage({ kind: "preparation_credit", preparationId, detail: "released", ok: true });
  }
  return ok;
}

export async function preparationCreditHistory(userId: string) {
  return rows(sql`
    select id, delta, entry_type, plan, preparation_id, polar_order_id, polar_checkout_id, created_at
    from preparation_credit_ledger
    where user_id = ${userId}
    order by created_at desc
    limit 50
  `);
}
