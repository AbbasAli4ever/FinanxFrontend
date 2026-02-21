import ComingSoon from "@/components/common/ComingSoon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alerts | FinanX",
  description: "FinanX Alerts - Coming Soon",
};

export default function AlertsPage() {
  return <ComingSoon pageName="Alerts" />;
}
