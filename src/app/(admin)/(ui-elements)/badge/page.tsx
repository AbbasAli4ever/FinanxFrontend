import ComingSoon from "@/components/common/ComingSoon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Badges | FinanX",
  description: "FinanX Badges - Coming Soon",
};

export default function BadgesPage() {
  return <ComingSoon pageName="Badges" />;
}
