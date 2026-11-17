export const INTERVIEW_MINUTES = 30;

export const PLAN_IDS = ["pro", "plus", "super"] as const;

export type PlanId = (typeof PLAN_IDS)[number];

export const PLAN_CREDITS: Record<PlanId, number> = {
  pro: 5,
  plus: 10,
  super: 15,
};

export const FREE_PREPARATION_CREDITS = 10;

export const PLAN_PREPARATION_CREDITS: Record<PlanId, number> = {
  pro: 10,
  plus: 20,
  super: 30,
};

const PLAN_ENV: Record<PlanId, string> = {
  pro: "POLAR_PRODUCT_PRO",
  plus: "POLAR_PRODUCT_PLUS",
  super: "POLAR_PRODUCT_SUPER",
};

export type EntryType = "purchase" | "reservation" | "deduction" | "restore" | "refund";

export type CreditEntry = {
  id: string;
  userId: string;
  delta: number;
  entryType: EntryType;
  plan: PlanId | null;
  runId: string | null;
  polarOrderId: string | null;
};

export type CreditBook = {
  entries: CreditEntry[];
};

type Env = Record<string, string | undefined>;

export function isPlanId(value: string): value is PlanId {
  return (PLAN_IDS as readonly string[]).includes(value);
}

export function productEnvName(plan: PlanId): string {
  return PLAN_ENV[plan];
}

export function productIdForPlan(plan: PlanId, env: Env = process.env): string | null {
  const value = env[PLAN_ENV[plan]];
  return value ? value : null;
}

export function planForProductId(productId: string, env: Env = process.env): PlanId | null {
  for (const plan of PLAN_IDS) {
    if (productIdForPlan(plan, env) === productId) return plan;
  }
  return null;
}

export function balanceOf(entries: CreditEntry[], userId?: string): number {
  return entries.reduce((sum, entry) => {
    if (userId && entry.userId !== userId) return sum;
    return sum + entry.delta;
  }, 0);
}

function held(entries: CreditEntry[], runId: string): boolean {
  return entries.some((entry) => (
    entry.runId === runId
    && (entry.entryType === "reservation" || entry.entryType === "deduction")
  ));
}

function restored(entries: CreditEntry[], runId: string): boolean {
  return entries.some((entry) => entry.runId === runId && entry.entryType === "restore");
}

export function grantPurchase(
  book: CreditBook,
  input: {
    id: string;
    userId: string;
    orderId: string;
    productId: string;
    env?: Env;
  },
): { book: CreditBook; granted: boolean } {
  if (book.entries.some((entry) => entry.polarOrderId === input.orderId && entry.entryType === "purchase")) {
    return { book, granted: false };
  }
  const plan = planForProductId(input.productId, input.env);
  if (!plan) return { book, granted: false };
  return {
    granted: true,
    book: {
      entries: [
        ...book.entries,
        {
          id: input.id,
          userId: input.userId,
          delta: PLAN_CREDITS[plan],
          entryType: "purchase",
          plan,
          runId: null,
          polarOrderId: input.orderId,
        },
      ],
    },
  };
}

export function reserveCredit(
  book: CreditBook,
  userId: string,
  runId: string,
  id = `hold-${runId}`,
): { book: CreditBook; reserved: boolean } {
  if (held(book.entries, runId) && !restored(book.entries, runId)) {
    return { book, reserved: true };
  }
  if (balanceOf(book.entries, userId) < 1) {
    return { book, reserved: false };
  }
  return {
    reserved: true,
    book: {
      entries: [
        ...book.entries,
        {
          id,
          userId,
          delta: -1,
          entryType: "reservation",
          plan: null,
          runId,
          polarOrderId: null,
        },
      ],
    },
  };
}

export function consumeCredit(book: CreditBook, runId: string): { book: CreditBook; consumed: boolean } {
  if (restored(book.entries, runId)) return { book, consumed: false };
  const index = book.entries.findIndex((entry) => entry.runId === runId && entry.entryType === "reservation");
  if (index === -1) {
    return {
      book,
      consumed: book.entries.some((entry) => entry.runId === runId && entry.entryType === "deduction"),
    };
  }
  const entries = book.entries.slice();
  entries[index] = { ...entries[index], entryType: "deduction" };
  return { book: { entries }, consumed: true };
}

export function restoreCredit(
  book: CreditBook,
  runId: string,
  id = `restore-${runId}`,
): { book: CreditBook; restored: boolean } {
  if (restored(book.entries, runId)) return { book, restored: false };
  const hold = book.entries.find((entry) => (
    entry.runId === runId
    && (entry.entryType === "reservation" || entry.entryType === "deduction")
  ));
  if (!hold) return { book, restored: false };
  const entries = [
    ...book.entries,
    {
      id,
      userId: hold.userId,
      delta: 1,
      entryType: "restore" as const,
      plan: null,
      runId,
      polarOrderId: null,
    },
  ];
  const refundIndex = entries.findIndex((entry) => {
    if (entry.entryType !== "refund" || entry.userId !== hold.userId || !entry.polarOrderId) return false;
    const purchase = entries.find((item) => (
      item.entryType === "purchase" && item.polarOrderId === entry.polarOrderId
    ));
    return Boolean(purchase && purchase.delta + entry.delta > 0);
  });
  if (refundIndex >= 0) {
    const refund = entries[refundIndex];
    entries[refundIndex] = { ...refund, delta: refund.delta - 1 };
  }
  return { restored: true, book: { entries } };
}

export function refundPurchase(
  book: CreditBook,
  input: { id: string; orderId: string },
): { book: CreditBook; refunded: boolean; clawback: number } {
  if (book.entries.some((entry) => entry.polarOrderId === input.orderId && entry.entryType === "refund")) {
    return { book, refunded: false, clawback: 0 };
  }
  const purchase = book.entries.find((entry) => entry.polarOrderId === input.orderId && entry.entryType === "purchase");
  if (!purchase) return { book, refunded: false, clawback: 0 };
  const available = balanceOf(book.entries, purchase.userId);
  const clawback = Math.min(purchase.delta, Math.max(available, 0));
  return {
    refunded: true,
    clawback,
    book: {
      entries: [
        ...book.entries,
        {
          id: input.id,
          userId: purchase.userId,
          delta: -clawback,
          entryType: "refund",
          plan: purchase.plan,
          runId: null,
          polarOrderId: input.orderId,
        },
      ],
    },
  };
}

export function createAtomicBook(initial: CreditBook) {
  let book = initial;
  let chain: Promise<unknown> = Promise.resolve();

  const exclusive = <T>(fn: (current: CreditBook) => { book: CreditBook; result: T }): Promise<T> => {
    const job = chain.then(() => {
      const next = fn(book);
      book = next.book;
      return next.result;
    });
    chain = job.then(() => undefined, () => undefined);
    return job;
  };

  return {
    reserve(userId: string, runId: string) {
      return exclusive((current) => {
        const applied = reserveCredit(current, userId, runId);
        return { book: applied.book, result: applied.reserved && balanceOf(applied.book.entries, userId) === balanceOf(current.entries, userId) - 1 };
      });
    },
    snapshot() {
      return book;
    },
  };
}
