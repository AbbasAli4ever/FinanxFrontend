"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { createCompany } from "@/services/authService";
import { formatApiErrorMessage } from "@/utils/apiError";
import { HiOutlineOfficeBuilding } from "react-icons/hi";

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AlertState = { variant: "success" | "error"; title: string; message: string };

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CreateCompanyModal({ isOpen, onClose }: CreateCompanyModalProps) {
  const { token, switchCompany } = useAuth();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("company:create");
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);

  const reset = () => {
    setCompanyName("");
    setCompanyEmail("");
    setAlert(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAlert(null);

    if (!canCreate) {
      setAlert({ variant: "error", title: "Access denied", message: "You do not have permission to create a company." });
      return;
    }

    const name = companyName.trim();
    const email = companyEmail.trim();

    if (!name) {
      setAlert({ variant: "error", title: "Required", message: "Company name is required." });
      return;
    }
    if (name.length < 2) {
      setAlert({ variant: "error", title: "Too short", message: "Company name must be at least 2 characters." });
      return;
    }
    if (email && !emailRegex.test(email)) {
      setAlert({ variant: "error", title: "Invalid email", message: "Enter a valid email address for the company." });
      return;
    }
    if (!token) {
      setAlert({ variant: "error", title: "Not authenticated", message: "Please sign in again." });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createCompany(token, {
        companyName: name,
        ...(email ? { companyEmail: email } : {}),
      });
      setAlert({ variant: "success", title: "Company created!", message: `"${name}" is ready. Switching now…` });
      setTimeout(async () => {
        await switchCompany(response.data.company.id);
      }, 900);
    } catch (error) {
      setAlert({ variant: "error", title: "Failed to create", message: formatApiErrorMessage(error) });
      setIsSubmitting(false);
    }
  };

  if (!canCreate) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="w-full max-w-md mx-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/30 flex-shrink-0">
            <HiOutlineOfficeBuilding className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </span>
          <div>
            <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white">Create New Company</h2>
            <p className="text-[12px] text-gray-500 dark:text-gray-400">A new workspace with its own data and settings</p>
          </div>
        </div>

        {alert && (
          <div className="mb-4" role="status" aria-live="polite">
            <Alert variant={alert.variant} title={alert.title} message={alert.message} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label>
              Company Name <span className="text-error-500">*</span>
            </Label>
            <Input
              placeholder="e.g. Acme Corp"
              value={companyName}
              onChange={(e) => {
                if (alert) setAlert(null);
                setCompanyName(e.target.value);
              }}
            />
          </div>
          <div>
            <Label>
              Company Email{" "}
              <span className="text-[11px] text-gray-400 font-normal">(optional)</span>
            </Label>
            <Input
              type="email"
              placeholder="info@company.com"
              value={companyEmail}
              onChange={(e) => {
                if (alert) setAlert(null);
                setCompanyEmail(e.target.value);
              }}
            />
          </div>

          {/* Info note */}
          <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-1">
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
              A default chart of accounts will be seeded. You will become the Primary Administrator with full access. Your existing password applies to this company too.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <Button type="button" variant="outline" size="md" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create Company"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
