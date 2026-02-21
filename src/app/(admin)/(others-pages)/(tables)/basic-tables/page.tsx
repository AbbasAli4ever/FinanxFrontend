import ComingSoon from "@/components/common/ComingSoon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Basic Tables | FinanX",
  description: "FinanX Basic Tables - Coming Soon",
};

export default function BasicTablesPage() {
  return <ComingSoon pageName="Basic Tables" />;
}
