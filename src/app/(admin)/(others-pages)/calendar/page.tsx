import ComingSoon from "@/components/common/ComingSoon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendar | FinanX",
  description: "FinanX Calendar - Coming Soon",
};

export default function CalendarPage() {
  return <ComingSoon pageName="Calendar" />;
}
