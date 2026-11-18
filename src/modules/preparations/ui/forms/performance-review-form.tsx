"use client";

import type { ComponentProps } from "react";

import { IntakeForm } from "./intake-form";

export function PerformanceReviewForm(props: Omit<ComponentProps<typeof IntakeForm>, "packId">) {
  return <IntakeForm packId="performance_review" {...props} />;
}
