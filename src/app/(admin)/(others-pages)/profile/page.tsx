import ProfilePage from "@/components/profile/ProfilePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Profile | FinanX",
  description: "Manage your FinanX account profile and settings",
};

export default function Profile() {
  return <ProfilePage />;
}
