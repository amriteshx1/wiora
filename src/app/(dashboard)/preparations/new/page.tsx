import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

const Page = async () => {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  redirect("/home");
};

export default Page;
