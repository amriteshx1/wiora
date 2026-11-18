"use client";

import type { ComponentProps } from "react";

import { IntakeForm } from "./intake-form";

export function PartnershipMeetingForm(props: Omit<ComponentProps<typeof IntakeForm>, "packId">) {
  return <IntakeForm packId="partnership_meeting" {...props} />;
}
