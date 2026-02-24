import { Metadata } from "next";
import ExpensesPage from "./_components/ExpensesPage";

export const metadata: Metadata = {
  title: "Expenses | FinanX",
  description: "Track and manage company expenses",
};

export default function ExpensesRoute() {
  return <ExpensesPage />;
}
