"use client";

import type { ComponentProps } from "react";

import { IntakeForm } from "./intake-form";

export function CustomerEscalationForm(props: Omit<ComponentProps<typeof IntakeForm>, "packId">) {
  return <IntakeForm packId="customer_escalation" {...props} />;
}
