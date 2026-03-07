import { Metadata } from "next";
import CurrenciesPage from "./_components/CurrenciesPage";

export const metadata: Metadata = {
  title: "Multi-Currency | FinanX",
  description: "Manage currencies and exchange rates for international transactions",
};

export default function CurrenciesRoute() {
  return (
    <div className="p-6">
      <CurrenciesPage />
    </div>
  );
}
