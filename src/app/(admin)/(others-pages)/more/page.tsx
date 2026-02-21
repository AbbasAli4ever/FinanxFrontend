import ComingSoon from "@/components/common/ComingSoon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "More | FinanX",
  description: "FinanX More - Coming Soon",
};

export default function MorePage() {
  return <ComingSoon pageName="More" />;
}
