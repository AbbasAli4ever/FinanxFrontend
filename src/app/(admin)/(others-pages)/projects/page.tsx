import { Metadata } from "next";
import ProjectsPage from "./_components/ProjectsPage";

export const metadata: Metadata = {
  title: "Projects | FinanX",
  description: "Manage billable projects and track profitability",
};

export default function ProjectsRoute() {
  return (
    <div className="p-6">
      <ProjectsPage />
    </div>
  );
}
