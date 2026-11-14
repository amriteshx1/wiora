import { fallbackOffers, listPlanOffers } from "@/modules/preparations/server/products";
import { HomeView } from "@/modules/home/ui/views/home-view";

const Page = async () => {
  const plans = await listPlanOffers().catch(() => fallbackOffers());
  return <HomeView plans={plans} />;
};

export default Page;
