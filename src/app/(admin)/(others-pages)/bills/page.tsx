import { Metadata } from "next";
import BillsPage from "./_components/BillsPage";

export const metadata: Metadata = {
  title: "Bills | FinanX",
  description: "Manage vendor bills and accounts payable",
};

export default function BillsRoute() {
  return <BillsPage />;
}
