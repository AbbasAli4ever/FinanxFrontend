import { Metadata } from "next";
import AuditTrailPage from "./_components/AuditTrailPage";

export const metadata: Metadata = {
  title: "Audit Trail | FinanX",
  description: "Track all actions performed across your organization",
};

export default function AuditTrailRoute() {
  return (
    <div className="p-6">
      <AuditTrailPage />
    </div>
  );
}
