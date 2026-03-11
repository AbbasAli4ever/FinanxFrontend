import type { Metadata } from "next";
import NotificationPreferencesPage from "./_components/NotificationPreferencesPage";

export const metadata: Metadata = {
  title: "Notification Preferences | FinanX",
  description: "Manage your notification channel preferences",
};

export default function Page() {
  return <NotificationPreferencesPage />;
}
