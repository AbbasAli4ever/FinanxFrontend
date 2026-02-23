"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import billsService from "@/services/billsService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface ReceiveBillModalProps {
  isOpen: boolean;
  billId: string | null;
  billNumber: string;
  onClose: () => void;
  onReceived: () => void;
}

const ReceiveBillModal: React.FC<ReceiveBillModalProps> = ({
  isOpen,
  billId,
  billNumber,
  onClose,
  onReceived,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReceive = async () => {
    if (!token || !billId) return;

    setError("");
    setLoading(true);

    try {
      await billsService.receiveBill(billId, token);
      onReceived();
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
          Receive Bill
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to mark bill{" "}
          <strong className="text-gray-900 dark:text-white">
            {billNumber}
          </strong>{" "}
          as received?
        </p>
        <div className="mt-3 rounded-lg border border-brand-200 bg-brand-50 p-3 dark:border-brand-800 dark:bg-brand-900/20">
          <p className="text-xs text-brand-700 dark:text-brand-300">
            This will change the status to RECEIVED and calculate the due date
            from payment terms. Inventory will be increased for any
            inventory-type products in the line items, and the vendor balance
            will be updated.
          </p>
        </div>
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
        <Button size="sm" onClick={handleReceive} disabled={loading}>
          {loading ? "Processing..." : "Receive Bill"}
        </Button>
      </div>
    </Modal>
  );
};

export default ReceiveBillModal;
