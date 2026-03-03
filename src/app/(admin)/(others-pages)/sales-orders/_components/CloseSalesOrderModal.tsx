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
  onClosed: () => void;
}

const CloseSalesOrderModal: React.FC<Props> = ({ isOpen, soId, soNumber, onClose, onClosed }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = async () => {
    if (!token || !soId) return;
    setLoading(true); setError("");
    try {
      await salesOrdersService.closeSalesOrder(soId, token);
      onClosed(); onClose();
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
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Close Sales Order</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Close <span className="font-medium text-gray-700 dark:text-gray-300">{soNumber}</span> without creating an invoice?
            </p>
            <div className="mt-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/10">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Use this when a partial delivery is accepted as complete, or the order is fulfilled through other means. To invoice fulfilled quantities, use <strong>Convert to Invoice</strong> instead.
              </p>
            </div>
          </div>
        </div>
        {error && <Alert variant="error" title="Error" message={error} />}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {loading ? "Closing..." : "Close SO"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CloseSalesOrderModal;
