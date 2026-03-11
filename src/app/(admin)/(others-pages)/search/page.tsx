import { Suspense } from "react";
import type { Metadata } from "next";
import SearchPage from "./_components/SearchPage";

export const metadata: Metadata = {
  title: "Search | FinanX",
};

export default function Page() {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  );
}
