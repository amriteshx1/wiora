"use client";

import type { ComponentProps } from "react";

import { IntakeForm } from "./intake-form";

export function LeadershipForm(props: Omit<ComponentProps<typeof IntakeForm>, "packId">) {
  return <IntakeForm packId="leadership" {...props} />;
}
