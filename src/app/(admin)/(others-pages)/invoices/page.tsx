import { Metadata } from "next";
import InvoicesPage from "./_components/InvoicesPage";

export const metadata: Metadata = {
  title: "Invoices | FinanX",
  description: "Create and manage customer invoices",
};

export default function InvoicesRoute() {
  return <InvoicesPage />;
}
