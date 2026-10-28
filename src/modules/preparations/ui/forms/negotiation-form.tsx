"use client";

import type { ComponentProps } from "react";

import { IntakeForm } from "./intake-form";

export function NegotiationForm(props: Omit<ComponentProps<typeof IntakeForm>, "packId">) {
  return <IntakeForm packId="negotiation" {...props} />;
}
