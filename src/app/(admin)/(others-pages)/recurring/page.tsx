import { Metadata } from "next";
import RecurringDashboardPage from "./_components/RecurringDashboardPage";

export const metadata: Metadata = {
  title: "Recurring Transactions | FinanX",
  description: "Manage recurring invoices, bills, expenses, and journal entries",
};

export default function RecurringRoute() {
  return <RecurringDashboardPage />;
}
