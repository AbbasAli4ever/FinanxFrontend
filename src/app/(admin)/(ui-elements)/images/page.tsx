import ComingSoon from "@/components/common/ComingSoon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Images | FinanX",
  description: "FinanX Images - Coming Soon",
};

export default function ImagesPage() {
  return <ComingSoon pageName="Images" />;
}
