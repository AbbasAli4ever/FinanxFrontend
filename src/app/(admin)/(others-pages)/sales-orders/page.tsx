import { Metadata } from "next";
import SalesOrdersPage from "./_components/SalesOrdersPage";

export const metadata: Metadata = {
  title: "Sales Orders | FinanX",
  description: "Create and manage customer sales orders, track fulfillment and convert to invoices",
};

export default function SalesOrdersRoute() {
  return <SalesOrdersPage />;
}
