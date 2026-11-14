import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { NewPreparationView } from "@/modules/preparations/ui/views/new-preparation-view";

const Page = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return <NewPreparationView />;
};

export default Page;
