"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import customersService from "@/services/customersService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface DeleteCustomerModalProps {
  isOpen: boolean;
  customerId: string | null;
  customerName: string;
  onClose: () => void;
  onDeleted: () => void;
}

const DeleteCustomerModal: React.FC<DeleteCustomerModalProps> = ({
  isOpen,
  customerId,
  customerName,
  onClose,
  onDeleted,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!token || !customerId) return;

    setError("");
    setLoading(true);

    try {
      await customersService.deleteCustomer(customerId, token);
      onDeleted();
      onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md p-6 lg:p-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error-50 dark:bg-error-500/15">
          <svg
            className="h-7 w-7 text-error-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          Deactivate Customer
        </h3>

        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Are you sure you want to deactivate{" "}
          <span className="font-medium text-gray-900 dark:text-white">
            &ldquo;{customerName}&rdquo;
          </span>
          ? The customer can be reactivated later.
        </p>

        {error && (
          <div className="mb-4 text-left">
            <Alert variant="error" title="Error" message={error} />
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition ${
              loading ? "cursor-not-allowed opacity-50" : ""
            } bg-error-500 text-white shadow-theme-xs hover:bg-error-600`}
          >
            {loading ? "Deactivating..." : "Deactivate"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteCustomerModal;
