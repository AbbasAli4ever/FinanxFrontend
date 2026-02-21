import { Metadata } from "next";
import VendorsPage from "./_components/VendorsPage";

export const metadata: Metadata = {
  title: "Vendors | FinanX",
  description: "Manage your vendors and suppliers",
};

export default function VendorsRoute() {
  return <VendorsPage />;
}
