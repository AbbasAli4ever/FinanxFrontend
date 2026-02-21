import ComingSoon from "@/components/common/ComingSoon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Videos | FinanX",
  description: "FinanX Videos - Coming Soon",
};

export default function VideosPage() {
  return <ComingSoon pageName="Videos" />;
}
