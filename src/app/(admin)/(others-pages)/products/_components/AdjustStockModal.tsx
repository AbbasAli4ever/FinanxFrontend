"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import productsService from "@/services/productsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { AdjustmentReason } from "@/types/products";

interface AdjustStockModalProps {
  isOpen: boolean;
  productId: string | null;
  productName: string;
  currentQty: number;
  onClose: () => void;
  onAdjusted: () => void;
}

const REASONS: { value: AdjustmentReason; label: string }[] = [
  { value: "RECEIVED", label: "Received" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "LOST", label: "Lost" },
  { value: "RETURNED", label: "Returned" },
  { value: "CORRECTION", label: "Correction" },
  { value: "OTHER", label: "Other" },
];

const selectClasses =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  isOpen,
  productId,
  productName,
  currentQty,
  onClose,
  onAdjusted,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [adjustment, setAdjustment] = useState("");
  const [reason, setReason] = useState<AdjustmentReason>("RECEIVED");
  const [notes, setNotes] = useState("");

  const adjustmentNum = parseInt(adjustment, 10) || 0;
  const newQty = currentQty + adjustmentNum;

  const resetForm = () => {
    setAdjustment("");
    setReason("RECEIVED");
    setNotes("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !productId || adjustmentNum === 0) return;

    setError("");
    setLoading(true);

    try {
      await productsService.adjustStock(
        productId,
        {
          adjustmentQuantity: adjustmentNum,
          reason,
          notes: notes || undefined,
        },
        token
      );
      onAdjusted();
      handleClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Adjust Stock
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {productName}
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Qty */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Current Quantity
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentQty}
          </p>
        </div>

        {/* Adjustment */}
        <div>
          <Label htmlFor="adjQty">
            Adjustment <span className="text-error-500">*</span>
          </Label>
          <Input
            id="adjQty"
            type="number"
            value={adjustment}
            onChange={(e) => setAdjustment(e.target.value)}
            placeholder="e.g. 20 or -5"
            hint="Positive to add, negative to subtract"
          />
        </div>

        {/* Reason */}
        <div>
          <Label htmlFor="adjReason">
            Reason <span className="text-error-500">*</span>
          </Label>
          <select
            id="adjReason"
            value={reason}
            onChange={(e) => setReason(e.target.value as AdjustmentReason)}
            className={`${selectClasses} text-gray-800 dark:text-white/90`}
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="adjNotes">Notes</Label>
          <TextArea
            value={notes}
            onChange={(val) => setNotes(val)}
            placeholder="Optional notes about this adjustment"
            rows={2}
          />
        </div>

        {/* New Qty Preview */}
        {adjustmentNum !== 0 && (
          <div
            className={`rounded-lg border px-4 py-3 ${
              newQty < 0
                ? "border-error-200 bg-error-50 dark:border-error-800 dark:bg-error-900/20"
                : "border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20"
            }`}
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">
              New Quantity
            </p>
            <p
              className={`text-lg font-semibold ${
                newQty < 0
                  ? "text-error-600 dark:text-error-400"
                  : "text-brand-600 dark:text-brand-400"
              }`}
            >
              {newQty}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={loading || adjustmentNum === 0}
          >
            {loading ? "Adjusting..." : "Save Adjustment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AdjustStockModal;
