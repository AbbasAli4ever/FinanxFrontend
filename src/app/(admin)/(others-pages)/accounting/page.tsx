import { Metadata } from "next";
import ChartOfAccountsPage from "./_components/ChartOfAccountsPage";

export const metadata: Metadata = {
  title: "Chart of Accounts | FinanX",
  description: "Manage your chart of accounts, categories, and balances",
};

export default function AccountingPage() {
  return <ChartOfAccountsPage />;
}
