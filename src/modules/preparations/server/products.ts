const durations = [30, 45, 60] as const;

export type SessionMinutes = (typeof durations)[number];

function productEnv(minutes: SessionMinutes): string | undefined {
  if (minutes === 30) return process.env.POLAR_PRODUCT_30;
  if (minutes === 45) return process.env.POLAR_PRODUCT_45;
  return process.env.POLAR_PRODUCT_60;
}

export function localSessionsAreFree(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function localProductId(minutes: SessionMinutes): string {
  return `local-${minutes}`;
}

export function durationForProduct(productId: string): SessionMinutes | null {
  if (localSessionsAreFree()) {
    for (const minutes of durations) {
      if (localProductId(minutes) === productId) {
        return minutes;
      }
    }
  }
  for (const minutes of durations) {
    const configured = productEnv(minutes);
    if (configured && configured === productId) {
      return minutes;
    }
  }
  return null;
}

export function productForDuration(minutes: SessionMinutes): string {
  const productId = productEnv(minutes);
  if (!productId) {
    throw new Error(`POLAR_PRODUCT_${minutes} is not set`);
  }
  return productId;
}

export function sessionProducts(): { minutes: SessionMinutes; productId: string; price: string; localFree: boolean }[] {
  const localFree = localSessionsAreFree();
  return [
    { minutes: 30, productId: process.env.POLAR_PRODUCT_30 ?? "", price: "$2", localFree },
    { minutes: 45, productId: process.env.POLAR_PRODUCT_45 ?? "", price: "$3", localFree },
    { minutes: 60, productId: process.env.POLAR_PRODUCT_60 ?? "", price: "$4", localFree },
  ];
}
