"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import salesOrdersService from "@/services/salesOrdersService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface Props {
  isOpen: boolean;
  soId: string | null;
  soNumber: string;
  onClose: () => void;
  onConfirmed: () => void;
}

const ConfirmSalesOrderModal: React.FC<Props> = ({ isOpen, soId, soNumber, onClose, onConfirmed }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!token || !soId) return;
    setLoading(true); setError("");
    try {
      await salesOrdersService.confirmSalesOrder(soId, token);
      onConfirmed(); onClose();
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
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
            <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Confirm Sales Order</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Mark <span className="font-medium text-gray-700 dark:text-gray-300">{soNumber}</span> as confirmed by the customer?
            </p>
            <div className="mt-2 rounded-lg bg-purple-50 p-3 dark:bg-purple-900/10">
              <p className="text-xs text-purple-700 dark:text-purple-300">
                This indicates the customer has accepted and confirmed the order. Status will change from <strong>Sent</strong> to <strong>Confirmed</strong>, unlocking fulfillment.
              </p>
            </div>
          </div>
        </div>
        {error && <Alert variant="error" title="Error" message={error} />}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Confirming..." : "Mark as Confirmed"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmSalesOrderModal;
