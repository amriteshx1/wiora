import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { DashboardHomeView } from "@/modules/dashboard/ui/views/dashboard-home-view";

const Page = async () => {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  return <DashboardHomeView />;
};

export default Page;
