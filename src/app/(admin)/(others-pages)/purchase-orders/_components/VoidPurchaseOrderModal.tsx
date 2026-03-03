"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import TextArea from "@/components/form/input/TextArea";
import { useAuth } from "@/context/AuthContext";
import purchaseOrdersService from "@/services/purchaseOrdersService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface Props {
  isOpen: boolean;
  poId: string | null;
  poNumber: string;
  onClose: () => void;
  onVoided: () => void;
}

const VoidPurchaseOrderModal: React.FC<Props> = ({ isOpen, poId, poNumber, onClose, onVoided }) => {
  const { token } = useAuth();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVoid = async () => {
    if (!token || !poId) return;
    setLoading(true);
    setError("");
    try {
      await purchaseOrdersService.voidPurchaseOrder(poId, { reason: reason.trim() || undefined }, token);
      onVoided();
      onClose();
      setReason("");
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md p-6">
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Void Purchase Order</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Void <span className="font-medium text-gray-700 dark:text-gray-300">{poNumber}</span>? This will cancel the order with the vendor.
            </p>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Reason <span className="text-gray-400">(optional)</span>
          </label>
          <TextArea
            value={reason}
            onChange={setReason}
            placeholder="e.g. Vendor changed pricing, order no longer needed..."
            rows={3}
          />
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button variant="outline" onClick={handleVoid} disabled={loading}>
            {loading ? "Voiding..." : "Void PO"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default VoidPurchaseOrderModal;
