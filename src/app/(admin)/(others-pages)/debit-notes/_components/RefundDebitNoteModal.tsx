"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import { useAuth } from "@/context/AuthContext";
import debitNotesService from "@/services/debitNotesService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { PaymentMethod } from "@/types/debitNotes";

interface RefundDebitNoteModalProps {
  isOpen: boolean;
  debitNoteId: string | null;
  debitNoteNumber: string;
  remainingDebit: number;
  accounts: { id: string; name: string; accountNumber: string }[];
  onClose: () => void;
  onRefunded: () => void;
}

const selectClasses =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CASH", label: "Cash" },
  { value: "CHECK", label: "Check" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "OTHER", label: "Other" },
];

const RefundDebitNoteModal: React.FC<RefundDebitNoteModalProps> = ({
  isOpen, debitNoteId, debitNoteNumber, remainingDebit, accounts, onClose, onRefunded,
}) => {
  const { token } = useAuth();
  const [amount, setAmount] = useState<number | "">(remainingDebit);
  const [refundDate, setRefundDate] = useState(todayStr());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BANK_TRANSFER");
  const [refundAccountId, setRefundAccountId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setAmount(remainingDebit);
      setRefundDate(todayStr());
      setPaymentMethod("BANK_TRANSFER");
      setRefundAccountId("");
      setReferenceNumber("");
      setNotes("");
      setError("");
    }
  }, [isOpen, remainingDebit]);

  const handleSubmit = async () => {
    if (!token || !debitNoteId) return;
    if (!amount || Number(amount) <= 0) { setError("Please enter a valid amount."); return; }
    if (Number(amount) > remainingDebit) { setError(`Amount cannot exceed remaining debit of ${formatCurrency(remainingDebit)}.`); return; }
    if (!refundDate) { setError("Please enter a refund date."); return; }
    setLoading(true); setError("");
    try {
      await debitNotesService.refundDebitNote(debitNoteId, {
        amount: Number(amount),
        refundDate,
        paymentMethod,
        refundAccountId: refundAccountId || undefined,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
      }, token);
      onRefunded(); onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6">
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Receive Vendor Refund</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Record refund received from vendor for <span className="font-semibold">{debitNoteNumber}</span>
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3 dark:border-brand-800 dark:bg-brand-900/10">
          <span className="text-sm font-medium text-brand-700 dark:text-brand-300">Available to Receive</span>
          <span className="text-xl font-bold tabular-nums text-brand-600 dark:text-brand-400">{formatCurrency(remainingDebit)}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Amount <span className="text-error-500">*</span></Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || "")} min="0.01" max={String(remainingDebit)} step={0.01} placeholder="0.00" />
          </div>
          <div>
            <Label>Refund Date <span className="text-error-500">*</span></Label>
            <Input type="date" value={refundDate} onChange={(e) => setRefundDate(e.target.value)} />
          </div>
          <div>
            <Label>Payment Method</Label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className={selectClasses}>
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <Label>Deposit Account (optional)</Label>
            <select value={refundAccountId} onChange={(e) => setRefundAccountId(e.target.value)} className={selectClasses}>
              <option value="">Default / Auto-select</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.accountNumber} — {a.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label>Reference # (optional)</Label>
            <Input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="Check #, Transfer ID..." />
          </div>
          <div className="sm:col-span-2">
            <Label>Notes (optional)</Label>
            <TextArea placeholder="Notes about this refund..." value={notes} onChange={setNotes} rows={2} />
          </div>
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={loading}>{loading ? "Processing..." : "Receive Refund"}</Button>
        </div>
      </div>
    </Modal>
  );
};

export default RefundDebitNoteModal;
