import ComingSoon from "@/components/common/ComingSoon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create | FinanX",
  description: "FinanX Create - Coming Soon",
};

export default function CreatePage() {
  return <ComingSoon pageName="Create" />;
}
