import type { Metadata } from "next";
import DashboardPage from "./_components/dashboard/DashboardPage";

export const metadata: Metadata = {
  title: "Dashboard | FinanX",
  description: "FinanX Dashboard — Financial overview and analytics",
};

export default function Home() {
  return <DashboardPage />;
}
