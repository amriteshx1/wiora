import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { conversationTypes, type ConversationType } from "@/modules/preparations/types";
import { NewPreparationDetailsView } from "@/modules/preparations/ui/views/new-preparation-details-view";

interface Props {
  params: Promise<{
    conversationType: string;
  }>;
}

function asConversationType(value: string): ConversationType | null {
  if (conversationTypes.includes(value as ConversationType)) {
    return value as ConversationType;
  }
  return null;
}

const Page = async ({ params }: Props) => {
  const { conversationType } = await params;
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  const type = asConversationType(conversationType);
  if (!type) {
    redirect("/preparations/new");
  }

  return <NewPreparationDetailsView conversationType={type} />;
};

export default Page;
