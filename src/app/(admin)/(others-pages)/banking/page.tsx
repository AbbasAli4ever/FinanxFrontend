import React from "react";
import type { Metadata } from "next";
import BankingPage from "./_components/BankingPage";

export const metadata: Metadata = {
  title: "Banking | FinanX",
  description: "Manage bank accounts, import transactions, match journal entries, and reconcile statements.",
};

export default function BankingRoute() {
  return <BankingPage />;
}
