import ComingSoon from "@/components/common/ComingSoon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Avatars | FinanX",
  description: "FinanX Avatars - Coming Soon",
};

export default function AvatarsPage() {
  return <ComingSoon pageName="Avatars" />;
}
