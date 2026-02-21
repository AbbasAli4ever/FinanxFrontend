import ComingSoon from "@/components/common/ComingSoon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed | FinanX",
  description: "FinanX Feed - Coming Soon",
};

export default function FeedPage() {
  return <ComingSoon pageName="Feed" />;
}
