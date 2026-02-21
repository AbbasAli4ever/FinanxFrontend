import ComingSoon from "@/components/common/ComingSoon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bookmarks | FinanX",
  description: "FinanX Bookmarks - Coming Soon",
};

export default function BookmarksPage() {
  return <ComingSoon pageName="Bookmarks" />;
}
