import { Metadata } from "next";
import CustomersPage from "./_components/CustomersPage";

export const metadata: Metadata = {
  title: "Customers | FinanX",
  description: "Manage your customers and their details",
};

export default function CustomersRoute() {
  return <CustomersPage />;
}
