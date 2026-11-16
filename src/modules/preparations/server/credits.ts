import { nanoid } from "nanoid";
import { sql } from "drizzle-orm";

import { db } from "@/db";

import {
  PLAN_CREDITS,
  planForProductId,
  productIdForPlan,
  type PlanId,
} from "./credit-rules";

type ReserveResult = "reserved" | "already" | "empty";

async function rows(query: ReturnType<typeof sql>) {
  const result = await db.execute(query);
  return [...result] as Record<string, unknown>[];
}

export async function ensureCreditAccount(userId: string): Promise<void> {
  await db.execute(sql`
    insert into credit_accounts (user_id, balance, updated_at)
    values (${userId}, 0, now())
    on conflict (user_id) do nothing
  `);
}

export async function creditBalance(userId: string): Promise<number> {
  const found = await rows(sql`
    select balance from credit_accounts where user_id = ${userId}
  `);
  return Number(found[0]?.balance ?? 0);
}

export async function grantCredits(input: {
  userId: string;
  orderId: string;
  productId: string;
  checkoutId: string | null;
}): Promise<boolean> {
  const plan = planForProductId(input.productId);
  if (!plan) {
    console.error("Paid order did not match a credit pack");
    return false;
  }
  await ensureCreditAccount(input.userId);
  const credits = PLAN_CREDITS[plan];
  const id = nanoid();
  const inserted = await rows(sql`
    with locked as (
      select balance
      from credit_accounts
      where user_id = ${input.userId}
      for update
    ),
    ins as (
      insert into credit_ledger (
        id, user_id, delta, balance_after, entry_type, plan,
        polar_order_id, polar_checkout_id, polar_product_id, created_at
      )
      select
        ${id}, ${input.userId}, ${credits}, locked.balance + ${credits}, 'purchase', ${plan},
        ${input.orderId}, ${input.checkoutId}, ${input.productId}, now()
      from locked
      where not exists (
        select 1 from credit_ledger
        where polar_order_id = ${input.orderId} and entry_type = 'purchase'
      )
      on conflict (polar_order_id, entry_type) do nothing
      returning id
    )
    update credit_accounts
    set balance = balance + ${credits}, updated_at = now()
    where user_id = ${input.userId} and exists (select 1 from ins)
    returning user_id
  `);
  return inserted.length > 0;
}

export async function reserveCredit(userId: string, runId: string): Promise<ReserveResult> {
  await ensureCreditAccount(userId);
  const id = nanoid();
  const inserted = await rows(sql`
    with upd as (
      update credit_accounts
      set balance = balance - 1, updated_at = now()
      where user_id = ${userId}
        and balance >= 1
        and not exists (
          select 1 from credit_ledger
          where run_id = ${runId}
            and entry_type in ('reservation', 'deduction', 'restore')
        )
      returning balance
    ),
    ins as (
      insert into credit_ledger (
        id, user_id, delta, balance_after, entry_type, run_id, created_at
      )
      select ${id}, ${userId}, -1, balance, 'reservation', ${runId}, now()
      from upd
      on conflict (run_id, entry_type) do nothing
      returning id
    ),
    undo as (
      update credit_accounts
      set balance = balance + 1, updated_at = now()
      where user_id = ${userId}
        and exists (select 1 from upd)
        and not exists (select 1 from ins)
      returning balance
    )
    select (select id from ins) as inserted
  `);
  if (inserted[0]?.inserted) return "reserved";
  const existing = await rows(sql`
    select entry_type from credit_ledger
    where run_id = ${runId} and entry_type in ('reservation', 'deduction', 'restore')
  `);
  const types = new Set(existing.map((row) => String(row.entry_type)));
  if ((types.has("reservation") || types.has("deduction")) && !types.has("restore")) {
    return "already";
  }
  return "empty";
}

export async function consumeCredit(runId: string): Promise<void> {
  await db.execute(sql`
    update credit_ledger
    set entry_type = 'deduction'
    where run_id = ${runId}
      and entry_type = 'reservation'
      and not exists (
        select 1 from credit_ledger
        where run_id = ${runId} and entry_type = 'restore'
      )
  `);
}

export async function restoreCredit(runId: string): Promise<boolean> {
  const id = nanoid();
  const inserted = await rows(sql`
    with held as (
      select user_id
      from credit_ledger
      where run_id = ${runId}
        and entry_type in ('reservation', 'deduction')
        and not exists (
          select 1 from credit_ledger
          where run_id = ${runId} and entry_type = 'restore'
        )
      limit 1
    ),
    short as (
      select refund.ctid
      from credit_ledger refund
      join credit_ledger purchase
        on purchase.user_id = refund.user_id
       and purchase.entry_type = 'purchase'
       and purchase.polar_order_id = refund.polar_order_id
      where refund.user_id = (select user_id from held)
        and refund.entry_type = 'refund'
        and purchase.delta + refund.delta > 0
      limit 1
    ),
    ins as (
      insert into credit_ledger (
        id, user_id, delta, balance_after, entry_type, run_id, created_at
      )
      select
        ${id},
        held.user_id,
        1,
        account.balance + case when exists (select 1 from short) then 0 else 1 end,
        'restore',
        ${runId},
        now()
      from held
      join credit_accounts account on account.user_id = held.user_id
      on conflict (run_id, entry_type) do nothing
      returning id
    ),
    claw as (
      update credit_ledger
      set delta = delta - 1
      where ctid = (select ctid from short)
        and exists (select 1 from ins)
      returning user_id
    )
    update credit_accounts
    set balance = credit_accounts.balance + case when exists (select 1 from short) then 0 else 1 end,
        updated_at = now()
    where user_id = (select user_id from held)
      and exists (select 1 from ins)
      and (exists (select 1 from claw) or not exists (select 1 from short))
    returning user_id as inserted
  `);
  return Boolean(inserted[0]?.inserted);
}

export async function refundCredits(input: {
  orderId: string;
  productId: string;
  checkoutId: string | null;
}): Promise<boolean> {
  const id = nanoid();
  const inserted = await rows(sql`
    with locked as (
      select a.user_id, a.balance, p.delta as credits, p.polar_product_id, p.plan
      from credit_accounts a
      join credit_ledger p
        on p.user_id = a.user_id
       and p.polar_order_id = ${input.orderId}
       and p.entry_type = 'purchase'
      for update of a
    ),
    claw as (
      select user_id, least(balance, credits) as amount, polar_product_id, plan
      from locked
      where not exists (
        select 1 from credit_ledger
        where polar_order_id = ${input.orderId} and entry_type = 'refund'
      )
    ),
    upd as (
      update credit_accounts
      set balance = credit_accounts.balance - claw.amount, updated_at = now()
      from claw
      where credit_accounts.user_id = claw.user_id
      returning credit_accounts.balance, credit_accounts.user_id, claw.amount, claw.polar_product_id, claw.plan
    ),
    ins as (
      insert into credit_ledger (
        id, user_id, delta, balance_after, entry_type, plan,
        polar_order_id, polar_checkout_id, polar_product_id, created_at
      )
      select
        ${id}, user_id, -amount, balance, 'refund', plan,
        ${input.orderId}, ${input.checkoutId}, coalesce(polar_product_id, ${input.productId}), now()
      from upd
      on conflict (polar_order_id, entry_type) do nothing
      returning id
    ),
    undo as (
      update credit_accounts
      set balance = credit_accounts.balance + upd.amount, updated_at = now()
      from upd
      where credit_accounts.user_id = upd.user_id
        and not exists (select 1 from ins)
      returning credit_accounts.balance
    )
    select (select id from ins) as inserted
  `);
  return Boolean(inserted[0]?.inserted);
}

export async function creditHistory(userId: string) {
  return rows(sql`
    select id, delta, entry_type, plan, run_id, polar_order_id, polar_checkout_id, created_at
    from credit_ledger
    where user_id = ${userId}
    order by created_at desc
    limit 50
  `);
}

export async function latestPlan(userId: string): Promise<PlanId | null> {
  const found = await rows(sql`
    select plan from credit_ledger
    where user_id = ${userId} and entry_type = 'purchase' and plan is not null
    order by created_at desc
    limit 1
  `);
  const plan = found[0]?.plan;
  return plan === "pro" || plan === "plus" || plan === "super" ? plan : null;
}

export function checkoutProductId(plan: PlanId): string {
  const productId = productIdForPlan(plan);
  if (!productId) {
    throw new Error(`${plan.toUpperCase()} is not configured`);
  }
  return productId;
}
