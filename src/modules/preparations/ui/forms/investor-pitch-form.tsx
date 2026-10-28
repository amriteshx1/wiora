"use client";

import type { ComponentProps } from "react";

import { IntakeForm } from "./intake-form";

export function InvestorPitchForm(props: Omit<ComponentProps<typeof IntakeForm>, "packId">) {
  return <IntakeForm packId="investor_pitch" {...props} />;
}
