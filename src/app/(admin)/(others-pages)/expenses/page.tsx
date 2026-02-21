import ComingSoon from "@/components/common/ComingSoon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expenses | FinanX",
  description: "FinanX Expenses - Coming Soon",
};

export default function ExpensesPage() {
  return <ComingSoon pageName="Expenses" />;
}
