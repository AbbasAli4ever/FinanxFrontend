import { Metadata } from "next";
import DocumentsPage from "./_components/DocumentsPage";

export const metadata: Metadata = {
  title: "Documents | FinanX",
  description: "Manage file attachments for all entities in FinanX",
};

export default function Page() {
  return <DocumentsPage />;
}
