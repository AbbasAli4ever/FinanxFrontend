"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import { useAuth } from "@/context/AuthContext";
import debitNotesService from "@/services/debitNotesService";
import billsService from "@/services/billsService";
import accountsService from "@/services/accountsService";
import productsService from "@/services/productsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { CreateDebitNoteLineItemRequest } from "@/types/debitNotes";

interface CreateDebitNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  vendors: { id: string; displayName: string }[];
}

const selectClasses =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

interface LineItemRow {
  key: number;
  productId: string;
  expenseAccountId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
}

function calcLineAmount(row: LineItemRow): number {
  const base = row.quantity * row.unitPrice;
  const afterDiscount = base * (1 - row.discountPercent / 100);
  return afterDiscount * (1 + row.taxPercent / 100);
}

let lineKey = 200;
function newLine(): LineItemRow {
  return { key: ++lineKey, productId: "", expenseAccountId: "", description: "", quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0 };
}

const CreateDebitNoteModal: React.FC<CreateDebitNoteModalProps> = ({
  isOpen, onClose, onCreated, vendors,
}) => {
  const { token } = useAuth();

  const [vendorId, setVendorId] = useState("");
  const [billId, setBillId] = useState("");
  const [debitNoteNumber, setDebitNoteNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [debitNoteDate, setDebitNoteDate] = useState(todayStr());
  const [discountType, setDiscountType] = useState<"" | "PERCENTAGE" | "FIXED">("");
  const [discountValue, setDiscountValue] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItemRow[]>([newLine()]);

  const [billsList, setBillsList] = useState<{ id: string; billNumber: string; amountDue: number }[]>([]);
  const [accountsList, setAccountsList] = useState<{ id: string; name: string; accountNumber: string }[]>([]);
  const [productsList, setProductsList] = useState<{ id: string; name: string; sku: string | null; purchaseCost: number | null }[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !token) return;
    debitNotesService.getNextNumber(token).then((r) => setDebitNoteNumber(r.nextDebitNoteNumber)).catch(() => {});
  }, [isOpen, token]);

  useEffect(() => {
    if (!isOpen || !token) return;
    accountsService.getAccounts({ isActive: "true", sortBy: "accountNumber", sortOrder: "asc" }, token)
      .then((acc) => setAccountsList(acc.map((a) => ({ id: a.id, name: a.name, accountNumber: a.accountNumber }))))
      .catch(() => {});
    productsService.getProducts({ sortBy: "name", sortOrder: "asc", isActive: "true" }, token)
      .then((p) => setProductsList(p.items.map((pr) => ({ id: pr.id, name: pr.name, sku: pr.sku, purchaseCost: pr.purchaseCost }))))
      .catch(() => {});
  }, [isOpen, token]);

  const fetchBills = useCallback(async () => {
    if (!token || !vendorId) { setBillsList([]); return; }
    try {
      const data = await billsService.getBills({ vendorId, sortBy: "billDate", sortOrder: "desc" }, token);
      setBillsList(data.items.map((b) => ({ id: b.id, billNumber: b.billNumber, amountDue: b.amountDue })));
    } catch { setBillsList([]); }
  }, [token, vendorId]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const reset = () => {
    setVendorId(""); setBillId(""); setDebitNoteNumber(""); setReferenceNumber("");
    setDebitNoteDate(todayStr()); setDiscountType(""); setDiscountValue("");
    setReason(""); setNotes(""); setLines([newLine()]); setError("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleProductChange = (idx: number, productId: string) => {
    const product = productsList.find((p) => p.id === productId);
    setLines((prev) => prev.map((l, i) =>
      i === idx ? { ...l, productId, description: product ? product.name : l.description, unitPrice: product ? (product.purchaseCost ?? 0) : l.unitPrice } : l
    ));
  };

  const updateLine = <K extends keyof LineItemRow>(idx: number, key: K, value: LineItemRow[K]) => {
    setLines((prev) => prev.map((l, i) => i === idx ? { ...l, [key]: value } : l));
  };

  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice * (1 - l.discountPercent / 100), 0);
  const taxTotal = lines.reduce((sum, l) => {
    const afterDisc = l.quantity * l.unitPrice * (1 - l.discountPercent / 100);
    return sum + afterDisc * (l.taxPercent / 100);
  }, 0);
  let headerDiscount = 0;
  if (discountType === "PERCENTAGE" && discountValue !== "") headerDiscount = subtotal * (Number(discountValue) / 100);
  if (discountType === "FIXED" && discountValue !== "") headerDiscount = Number(discountValue);
  const total = subtotal + taxTotal - headerDiscount;

  const handleSubmit = async () => {
    if (!token) return;
    if (!vendorId) { setError("Please select a vendor."); return; }
    if (lines.some((l) => !l.description || l.quantity <= 0 || l.unitPrice < 0)) {
      setError("Each line item needs a description, quantity > 0, and a valid unit price."); return;
    }
    setLoading(true); setError("");
    try {
      const lineItems: CreateDebitNoteLineItemRequest[] = lines.map((l, i) => ({
        productId: l.productId || undefined,
        expenseAccountId: l.expenseAccountId || undefined,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discountPercent: l.discountPercent || undefined,
        taxPercent: l.taxPercent || undefined,
        sortOrder: i,
      }));
      await debitNotesService.createDebitNote({
        vendorId,
        billId: billId || undefined,
        debitNoteNumber: debitNoteNumber || undefined,
        referenceNumber: referenceNumber || undefined,
        debitNoteDate,
        discountType: discountType || undefined,
        discountValue: discountValue !== "" ? Number(discountValue) : undefined,
        reason: reason || undefined,
        notes: notes || undefined,
        lineItems,
      }, token);
      reset(); onCreated(); onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-4xl p-6 lg:p-8">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">New Debit Note</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Create a debit note for vendor returns or adjustments</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Label>Vendor <span className="text-error-500">*</span></Label>
            <select value={vendorId} onChange={(e) => { setVendorId(e.target.value); setBillId(""); }} className={selectClasses}>
              <option value="">Select vendor...</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.displayName}</option>)}
            </select>
          </div>
          <div>
            <Label>Linked Bill (optional)</Label>
            <select value={billId} onChange={(e) => setBillId(e.target.value)} className={selectClasses} disabled={!vendorId}>
              <option value="">None</option>
              {billsList.map((b) => <option key={b.id} value={b.id}>{b.billNumber} ({formatCurrency(b.amountDue)} due)</option>)}
            </select>
          </div>
          <div>
            <Label>Debit Note #</Label>
            <Input value={debitNoteNumber} onChange={(e) => setDebitNoteNumber(e.target.value)} placeholder="DN-0001" />
          </div>
          <div>
            <Label>Reference #</Label>
            <Input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <Label>Date <span className="text-error-500">*</span></Label>
            <Input type="date" value={debitNoteDate} onChange={(e) => setDebitNoteDate(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Line Items</h3>
            <button onClick={() => setLines((prev) => [...prev, newLine()])} className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400">+ Add Line</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Expense Account</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Unit Price</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Disc %</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Tax %</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {lines.map((line, idx) => (
                  <tr key={line.key}>
                    <td className="px-3 py-2 min-w-[140px]">
                      <select value={line.productId} onChange={(e) => handleProductChange(idx, e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                        <option value="">None</option>
                        {productsList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 min-w-[140px]">
                      <select value={line.expenseAccountId} onChange={(e) => updateLine(idx, "expenseAccountId", e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                        <option value="">None</option>
                        {accountsList.map((a) => <option key={a.id} value={a.id}>{a.accountNumber} — {a.name}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 min-w-[180px]">
                      <input type="text" value={line.description} onChange={(e) => updateLine(idx, "description", e.target.value)} placeholder="Description" className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
                    </td>
                    <td className="px-3 py-2 w-16">
                      <input type="number" value={line.quantity} onChange={(e) => updateLine(idx, "quantity", parseFloat(e.target.value) || 0)} min="0.001" step={1} className="w-full rounded border border-gray-300 px-2 py-1.5 text-right text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
                    </td>
                    <td className="px-3 py-2 w-24">
                      <input type="number" value={line.unitPrice} onChange={(e) => updateLine(idx, "unitPrice", parseFloat(e.target.value) || 0)} min="0" step={0.01} className="w-full rounded border border-gray-300 px-2 py-1.5 text-right text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
                    </td>
                    <td className="px-3 py-2 w-16">
                      <input type="number" value={line.discountPercent} onChange={(e) => updateLine(idx, "discountPercent", parseFloat(e.target.value) || 0)} min="0" max="100" step={0.1} className="w-full rounded border border-gray-300 px-2 py-1.5 text-right text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
                    </td>
                    <td className="px-3 py-2 w-16">
                      <input type="number" value={line.taxPercent} onChange={(e) => updateLine(idx, "taxPercent", parseFloat(e.target.value) || 0)} min="0" max="100" step={0.1} className="w-full rounded border border-gray-300 px-2 py-1.5 text-right text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-medium tabular-nums text-gray-900 dark:text-white/90 w-24">{formatCurrency(calcLineAmount(line))}</td>
                    <td className="px-3 py-2 w-8">
                      <button onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))} disabled={lines.length <= 1} className="text-gray-300 hover:text-error-500 disabled:cursor-not-allowed disabled:opacity-30">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3 sm:w-64">
            <div className="flex-1">
              <Label>Discount Type</Label>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "" | "PERCENTAGE" | "FIXED")} className={selectClasses}>
                <option value="">No discount</option>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed ($)</option>
              </select>
            </div>
            {discountType && (
              <div className="w-24">
                <Label>{discountType === "PERCENTAGE" ? "%" : "$"}</Label>
                <Input type="number" value={discountValue} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || "")} min="0" step={0.01} />
              </div>
            )}
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40 sm:w-64">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Subtotal</span><span className="tabular-nums">{formatCurrency(subtotal)}</span></div>
              {headerDiscount > 0 && <div className="flex justify-between text-success-600 dark:text-success-400"><span>Discount</span><span className="tabular-nums">-{formatCurrency(headerDiscount)}</span></div>}
              <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Tax</span><span className="tabular-nums">{formatCurrency(taxTotal)}</span></div>
              <div className="flex justify-between border-t border-gray-300 pt-2 font-bold text-gray-900 dark:border-gray-700 dark:text-white"><span>Total</span><span className="tabular-nums">{formatCurrency(total)}</span></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Reason</Label>
            <TextArea placeholder="Reason for debit note..." value={reason} onChange={setReason} rows={3} />
          </div>
          <div>
            <Label>Notes</Label>
            <TextArea placeholder="Internal notes..." value={notes} onChange={setNotes} rows={3} />
          </div>
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? "Creating..." : "Create Debit Note"}</Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateDebitNoteModal;
