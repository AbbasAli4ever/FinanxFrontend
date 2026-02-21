import AcceptInvitationForm from "@/components/auth/AcceptInvitationForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Accept Invitation | FinanX",
  description: "Accept your invitation and create your FinanX account",
};

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      }
    >
      <AcceptInvitationForm />
    </Suspense>
  );
}
