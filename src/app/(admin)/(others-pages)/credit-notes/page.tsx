import { Metadata } from "next";
import CreditNotesPage from "./_components/CreditNotesPage";

export const metadata: Metadata = {
  title: "Credit Notes | FinanX",
  description: "Issue and manage customer credit notes",
};

export default function CreditNotesRoute() {
  return <CreditNotesPage />;
}
