import { Metadata } from "next";
import PayrollPage from "./_components/PayrollPage";

export const metadata: Metadata = {
  title: "Payroll | FinanX",
  description: "Manage employees, pay runs, payslips, and payroll reports",
};

export default function Page() {
  return <PayrollPage />;
}
