import SelectCompanyForm from "@/components/auth/SelectCompanyForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Select Company | FinanX",
  description: "Select a company to continue to your dashboard.",
};

export default function SelectCompanyPage() {
  return <SelectCompanyForm />;
}
