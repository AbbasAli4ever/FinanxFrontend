"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import purchaseOrdersService from "@/services/purchaseOrdersService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface Props {
  isOpen: boolean;
  poId: string | null;
  poNumber: string;
  onClose: () => void;
  onDeleted: () => void;
}

const DeletePurchaseOrderModal: React.FC<Props> = ({ isOpen, poId, poNumber, onClose, onDeleted }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!token || !poId) return;
    setLoading(true);
    setError("");
    try {
      await purchaseOrdersService.deletePurchaseOrder(poId, token);
      onDeleted();
      onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg className="h-5 w-5 text-error-600 dark:text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Delete Purchase Order</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to permanently delete <span className="font-medium text-gray-700 dark:text-gray-300">{poNumber}</span>? This action cannot be undone.
            </p>
          </div>
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleDelete} disabled={loading} className="bg-error-600 hover:bg-error-700 text-white border-error-600">
            {loading ? "Deleting..." : "Delete PO"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeletePurchaseOrderModal;
