"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import billsService from "@/services/billsService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface DeleteBillModalProps {
  isOpen: boolean;
  billId: string | null;
  billNumber: string;
  onClose: () => void;
  onDeleted: () => void;
}

const DeleteBillModal: React.FC<DeleteBillModalProps> = ({
  isOpen,
  billId,
  billNumber,
  onClose,
  onDeleted,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!token || !billId) return;

    setError("");
    setLoading(true);

    try {
      await billsService.deleteBill(billId, token);
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
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Delete Bill
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to permanently delete draft bill{" "}
          <strong className="text-gray-900 dark:text-white">
            {billNumber}
          </strong>
          ? This action cannot be undone.
        </p>
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          Only DRAFT bills can be deleted. To remove a received bill, void it
          instead.
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleDelete}
          disabled={loading}
          className="bg-error-500 hover:bg-error-600"
        >
          {loading ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </Modal>
  );
};

export default DeleteBillModal;
