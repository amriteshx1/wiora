import { polarClient } from "@/lib/polar";

import {
  INTERVIEW_MINUTES,
  PLAN_CREDITS,
  PLAN_IDS,
  PLAN_PREPARATION_CREDITS,
  productIdForPlan,
  type PlanId,
} from "./credit-rules";

export type PlanOffer = {
  id: PlanId;
  name: string;
  description: string | null;
  benefits: string[];
  badge: string | null;
  highlighted: boolean;
  credits: number;
  preparationCredits: number;
  priceLabel: string;
  priceAmount: number;
  currency: string;
  priceSuffix: string;
  recurring: boolean;
  archived: boolean;
};

const PLAN_NAMES: Record<PlanId, string> = {
  pro: "Pro",
  plus: "Premium",
  super: "Super",
};

const fallbackPrices: Record<PlanId, number> = {
  pro: 999,
  plus: 1799,
  super: 2499,
};

function money(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export function fallbackOffers(): PlanOffer[] {
  return PLAN_IDS.map((id) => {
    const cents = fallbackPrices[id];
    return {
      id,
      name: PLAN_NAMES[id],
      description: null,
      benefits: [],
      badge: id === "plus" ? "Best value" : null,
      highlighted: id === "plus",
      credits: PLAN_CREDITS[id],
      preparationCredits: PLAN_PREPARATION_CREDITS[id],
      priceLabel: money(cents, "usd"),
      priceAmount: cents,
      currency: "usd",
      priceSuffix: "",
      recurring: false,
      archived: false,
    };
  });
}

function fixedPrice(prices: Array<{ amountType?: string; isArchived?: boolean; priceAmount?: number; priceCurrency?: string; recurringInterval?: string | null }>) {
  return prices.find((price) => price.amountType === "fixed" && !price.isArchived && typeof price.priceAmount === "number");
}

function benefitLines(benefits: Array<{ description?: string | null; name?: string | null }>): string[] {
  return benefits.flatMap((benefit) => {
    const description = benefit.description?.trim() || benefit.name?.trim();
    return description ? [description] : [];
  });
}

function metaText(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key];
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object" && "value" in value) {
    const inner = (value as { value: unknown }).value;
    if (typeof inner === "string") return inner.trim();
  }
  return "";
}

export async function listPlanOffers(): Promise<PlanOffer[]> {
  const offers = await Promise.all(PLAN_IDS.map(async (id) => {
    const productId = productIdForPlan(id);
    if (!productId) {
      throw new Error(`${id.toUpperCase()} is not configured`);
    }
    const product = await polarClient.products.get({ id: productId });
    const price = fixedPrice(product.prices);
    if (!price || typeof price.priceAmount !== "number" || !price.priceCurrency) {
      throw new Error(`${product.name} has no fixed price`);
    }
    const metadata = (product.metadata ?? {}) as Record<string, unknown>;
    const variant = metaText(metadata, "variant").toLowerCase();
    return {
      id,
      name: product.name,
      description: product.description,
      benefits: benefitLines(product.benefits ?? []),
      badge: metaText(metadata, "badge") || null,
      highlighted: variant === "highlighted",
      credits: PLAN_CREDITS[id],
      preparationCredits: PLAN_PREPARATION_CREDITS[id],
      priceLabel: money(price.priceAmount, price.priceCurrency),
      priceAmount: price.priceAmount,
      currency: price.priceCurrency,
      priceSuffix: price.recurringInterval ? `/${price.recurringInterval}` : "",
      recurring: product.isRecurring,
      archived: product.isArchived,
    } satisfies PlanOffer;
  }));
  if (!offers.some((offer) => offer.highlighted)) {
    const middle = offers.find((offer) => offer.id === "plus");
    if (middle) {
      middle.highlighted = true;
      middle.badge = middle.badge || "Best value";
    }
  }
  return offers;
}

export { INTERVIEW_MINUTES };
