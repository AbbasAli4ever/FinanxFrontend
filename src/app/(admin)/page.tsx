import type { Metadata } from "next";
import ComingSoon from "@/components/common/ComingSoon";
import CurrentUserBanner from "@/components/auth/CurrentUserBanner";

export const metadata: Metadata = {
  title: "Home | FinanX",
  description: "FinanX Home - Coming Soon",
};

export default function Home() {
  return (
    <div className="space-y-6 p-4 sm:p-8">
      <CurrentUserBanner />
      <div className="mt-4">
        <ComingSoon pageName="Home" />
      </div>
    </div>
  );
}
