"use client";

import type { ComponentProps } from "react";

import { IntakeForm } from "./intake-form";

export function SalaryNegotiationForm(props: Omit<ComponentProps<typeof IntakeForm>, "packId">) {
  return <IntakeForm packId="salary_negotiation" {...props} />;
}
