"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import { useAuth } from "@/context/AuthContext";
import estimatesService from "@/services/estimatesService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface VoidEstimateModalProps {
  isOpen: boolean;
  estimateId: string | null;
  estimateNumber: string;
  onClose: () => void;
  onVoided: () => void;
}

const VoidEstimateModal: React.FC<VoidEstimateModalProps> = ({
  isOpen, estimateId, estimateNumber, onClose, onVoided,
}) => {
  const { token } = useAuth();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (isOpen) { setReason(""); setError(""); }
  }, [isOpen]);

  const handleVoid = async () => {
    if (!token || !estimateId) return;
    setLoading(true); setError("");
    try {
      await estimatesService.voidEstimate(estimateId, { reason: reason || undefined }, token);
      onVoided(); onClose();
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
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Void Estimate</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Void <span className="font-semibold text-gray-700 dark:text-gray-300">{estimateNumber}</span>. This will cancel the estimate permanently.
            </p>
          </div>
        </div>

        <div>
          <Label>Reason (optional)</Label>
          <TextArea
            placeholder="e.g. Customer changed requirements..."
            value={reason}
            onChange={setReason}
            rows={3}
          />
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="outline" className="flex-1 border-gray-400 text-gray-700 hover:bg-gray-100 dark:text-gray-300" onClick={handleVoid} disabled={loading}>
            {loading ? "Voiding..." : "Void Estimate"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default VoidEstimateModal;
