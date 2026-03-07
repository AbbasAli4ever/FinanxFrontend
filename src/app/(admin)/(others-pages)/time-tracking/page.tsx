import { Metadata } from "next";
import TimeTrackingPage from "./_components/TimeTrackingPage";

export const metadata: Metadata = {
  title: "Time Tracking | FinanX",
  description: "Log and approve time entries across all projects",
};

export default function TimeTrackingRoute() {
  return (
    <div className="p-6">
      <TimeTrackingPage />
    </div>
  );
}
