import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | FinanX",
  description: "Reset your FinanX account password",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
