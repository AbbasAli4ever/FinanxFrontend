import { Metadata } from "next";
import ReportsPage from "./_components/ReportsPage";

export const metadata: Metadata = {
  title: "Reports | FinanX",
  description: "Generate and view financial reports",
};

export default function ReportsRoute() {
  return <ReportsPage />;
}
