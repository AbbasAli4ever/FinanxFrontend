import type { Metadata } from "next";
import NotificationsPage from "./_components/NotificationsPage";

export const metadata: Metadata = {
  title: "Notifications | FinanX",
  description: "Manage your notifications and alerts",
};

export default function Page() {
  return <NotificationsPage />;
}
