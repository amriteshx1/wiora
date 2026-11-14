import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { SignUpView } from "@/modules/auth/ui/views/sign-up-view";

const Page = async () => {
  const session = await getSession();

  if(!!session){
    redirect("/preparations");
  }

  return <SignUpView />
}

export default Page;
