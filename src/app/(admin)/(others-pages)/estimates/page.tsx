import { Metadata } from "next";
import EstimatesPage from "./_components/EstimatesPage";

export const metadata: Metadata = {
  title: "Estimates | FinanX",
  description: "Create and manage customer estimates and quotes",
};

export default function EstimatesRoute() {
  return <EstimatesPage />;
}
