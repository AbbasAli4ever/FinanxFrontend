import type { Metadata } from "next";
import TaxManagementPage from "./_components/TaxManagementPage";

export const metadata: Metadata = {
  title: "Tax Management | FinanX",
  description: "Configure tax rates, groups, and view tax reports",
};

export default function Page() {
  return <TaxManagementPage />;
}
