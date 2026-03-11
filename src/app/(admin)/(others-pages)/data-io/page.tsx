import { Metadata } from "next";
import DataIOPage from "./_components/DataIOPage";

export const metadata: Metadata = {
  title: "Data I/O | FinanX",
  description: "Import and export your financial data using CSV files",
};

export default function DataIORoute() {
  return <DataIOPage />;
}
