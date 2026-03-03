import React from "react";
import type { Metadata } from "next";
import InventoryDashboardPage from "./_components/InventoryDashboardPage";

export const metadata: Metadata = {
  title: "Inventory | FinanX",
  description: "Track stock levels, monitor inventory movements, and manage valuation.",
};

export default function InventoryPage() {
  return <InventoryDashboardPage />;
}
