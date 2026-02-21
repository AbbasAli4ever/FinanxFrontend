import ComingSoon from "@/components/common/ComingSoon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Modals | FinanX",
  description: "FinanX Modals - Coming Soon",
};

export default function ModalsPage() {
  return <ComingSoon pageName="Modals" />;
}
