import ComingSoon from "@/components/common/ComingSoon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports | FinanX",
  description: "FinanX Reports - Coming Soon",
};

export default function ReportsPage() {
  return <ComingSoon pageName="Reports" />;
}
