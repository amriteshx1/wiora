"use client";

import type { ComponentProps } from "react";

import { IntakeForm } from "./intake-form";

export function SalesCallForm(props: Omit<ComponentProps<typeof IntakeForm>, "packId">) {
  return <IntakeForm packId="sales_call" {...props} />;
}
