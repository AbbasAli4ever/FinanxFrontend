import { Metadata } from "next";
import DebitNotesPage from "./_components/DebitNotesPage";

export const metadata: Metadata = {
  title: "Debit Notes | FinanX",
  description: "Issue and manage vendor debit notes",
};

export default function DebitNotesRoute() {
  return <DebitNotesPage />;
}
