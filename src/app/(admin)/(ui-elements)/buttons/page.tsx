import ComingSoon from "@/components/common/ComingSoon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buttons | FinanX",
  description: "FinanX Buttons - Coming Soon",
};

export default function ButtonsPage() {
  return <ComingSoon pageName="Buttons" />;
}
