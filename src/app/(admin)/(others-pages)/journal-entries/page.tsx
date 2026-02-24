import { Metadata } from "next";
import JournalEntriesPage from "./_components/JournalEntriesPage";

export const metadata: Metadata = {
  title: "Journal Entries | FinanX",
  description: "Manage general ledger journal entries",
};

export default function JournalEntriesRoute() {
  return <JournalEntriesPage />;
}
