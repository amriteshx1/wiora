"use client";

import type { ComponentProps } from "react";

import { IntakeForm } from "./intake-form";

export function CustomForm(props: Omit<ComponentProps<typeof IntakeForm>, "packId">) {
  return <IntakeForm packId="custom" {...props} />;
}
