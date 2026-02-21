import ComingSoon from "@/components/common/ComingSoon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Apps | FinanX",
  description: "FinanX All Apps - Coming Soon",
};

export default function AllAppsPage() {
  return <ComingSoon pageName="All Apps" />;
}
