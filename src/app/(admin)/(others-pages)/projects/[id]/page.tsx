import { Metadata } from "next";
import ProjectDetailPage from "./_components/ProjectDetailPage";

export const metadata: Metadata = {
  title: "Project Detail | FinanX",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailRoute({ params }: Props) {
  const { id } = await params;
  return <ProjectDetailPage id={id} />;
}
