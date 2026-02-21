import ComingSoon from "@/components/common/ComingSoon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bar Chart | FinanX",
  description: "FinanX Bar Chart - Coming Soon",
};

export default function BarChartPage() {
  return <ComingSoon pageName="Bar Chart" />;
}
