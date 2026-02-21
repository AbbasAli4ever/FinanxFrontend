import { Metadata } from "next";
import ProductsPage from "./_components/ProductsPage";

export const metadata: Metadata = {
  title: "Products & Services | FinanX",
  description: "Manage your products, services, and bundles",
};

export default function ProductsRoute() {
  return <ProductsPage />;
}
