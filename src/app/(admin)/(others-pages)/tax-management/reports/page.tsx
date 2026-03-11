import type { Metadata } from "next";
import TaxReportsPage from "./_components/TaxReportsPage";

export const metadata: Metadata = {
  title: "Tax Reports | FinanX",
  description: "Tax collected, paid, and net liability overview",
};

export default function Page() {
  return <TaxReportsPage />;
}
