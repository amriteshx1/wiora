"use client";

import type { ComponentProps } from "react";

import { IntakeForm } from "./intake-form";

export function NetworkingConversationForm(props: Omit<ComponentProps<typeof IntakeForm>, "packId">) {
  return <IntakeForm packId="networking_conversation" {...props} />;
}
