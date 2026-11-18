"use client";

import type { ComponentProps } from "react";

import { IntakeForm } from "./intake-form";

export function MediaInterviewForm(props: Omit<ComponentProps<typeof IntakeForm>, "packId">) {
  return <IntakeForm packId="media_interview" {...props} />;
}
