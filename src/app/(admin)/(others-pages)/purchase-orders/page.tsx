import { Metadata } from "next";
import PurchaseOrdersPage from "./_components/PurchaseOrdersPage";

export const metadata: Metadata = {
  title: "Purchase Orders | FinanX",
  description: "Create and manage vendor purchase orders, track deliveries and convert to bills",
};

export default function PurchaseOrdersRoute() {
  return <PurchaseOrdersPage />;
}
