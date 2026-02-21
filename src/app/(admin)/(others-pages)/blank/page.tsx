import ComingSoon from "@/components/common/ComingSoon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blank Page | FinanX",
  description: "FinanX Blank Page - Coming Soon",
};

export default function BlankPage() {
  return <ComingSoon pageName="Blank Page" />;
}
