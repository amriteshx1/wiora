"use client";

import type { ComponentProps } from "react";

import { IntakeForm } from "./intake-form";

export function JobInterviewForm(props: Omit<ComponentProps<typeof IntakeForm>, "packId">) {
  return <IntakeForm packId="job_interview" {...props} />;
}
