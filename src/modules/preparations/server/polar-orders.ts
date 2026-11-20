export type PolarOrderLike = {
  id: string;
  paid?: boolean;
  status?: string;
  productId?: string | null;
  product_id?: string | null;
  checkoutId?: string | null;
  checkout_id?: string | null;
  metadata?: Record<string, unknown> | null;
  product?: { id?: string | null } | null;
  customer?: {
    externalId?: string | null;
    external_id?: string | null;
  } | null;
};

export type PolarOrderPage = {
  result?: { items?: PolarOrderLike[] };
  items?: PolarOrderLike[];
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function pageOrders(page: PolarOrderPage): PolarOrderLike[] {
  return page.result?.items ?? page.items ?? [];
}

export function orderIsPaid(order: PolarOrderLike): boolean {
  return order.paid === true || order.status === "paid";
}

export function orderOwnerId(order: PolarOrderLike): string {
  const metadata = order.metadata;
  return (
    asString(metadata?.userId) ||
    asString(metadata?.user_id) ||
    asString(order.customer?.externalId) ||
    asString(order.customer?.external_id)
  );
}

export function orderBelongsToUser(order: PolarOrderLike, userId: string): boolean {
  return Boolean(userId) && orderOwnerId(order) === userId;
}

export function paidOrdersFromPages(pages: PolarOrderPage[]): PolarOrderLike[] {
  return pages.flatMap(pageOrders).filter(orderIsPaid);
}

export function grantInputFromOrder(order: PolarOrderLike, userId: string) {
  const productId = order.productId || order.product_id || order.product?.id || "";
  if (!orderIsPaid(order) || !order.id || !productId) return null;
  if (!orderBelongsToUser(order, userId)) return null;
  return {
    userId,
    orderId: order.id,
    productId,
    checkoutId: order.checkoutId ?? order.checkout_id ?? null,
  };
}
