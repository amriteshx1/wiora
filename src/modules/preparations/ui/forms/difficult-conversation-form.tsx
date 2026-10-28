"use client";

import type { ComponentProps } from "react";

import { IntakeForm } from "./intake-form";

export function DifficultConversationForm(props: Omit<ComponentProps<typeof IntakeForm>, "packId">) {
  return <IntakeForm packId="difficult_conversation" {...props} />;
}
