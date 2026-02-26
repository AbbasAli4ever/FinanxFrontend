"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import { useAuth } from "@/context/AuthContext";
import creditNotesService from "@/services/creditNotesService";
import invoicesService from "@/services/invoicesService";
import accountsService from "@/services/accountsService";
import productsService from "@/services/productsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { CreateCreditNoteLineItemRequest } from "@/types/creditNotes";

interface CreateCreditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  customers: { id: string; displayName: string }[];
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
  accountId: string;
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

let lineKey = 0;
function newLine(): LineItemRow {
  return { key: ++lineKey, productId: "", accountId: "", description: "", quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0 };
}

const CreateCreditNoteModal: React.FC<CreateCreditNoteModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  customers,
}) => {
  const { token } = useAuth();

  const [customerId, setCustomerId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [creditNoteNumber, setCreditNoteNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [creditNoteDate, setCreditNoteDate] = useState(todayStr());
  const [discountType, setDiscountType] = useState<"" | "PERCENTAGE" | "FIXED">("");
  const [discountValue, setDiscountValue] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItemRow[]>([newLine()]);

  const [invoicesList, setInvoicesList] = useState<{ id: string; invoiceNumber: string; amountDue: number }[]>([]);
  const [accountsList, setAccountsList] = useState<{ id: string; name: string; accountNumber: string }[]>([]);
  const [productsList, setProductsList] = useState<{ id: string; name: string; sku: string | null; salesPrice: number | null }[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch next number
  useEffect(() => {
    if (!isOpen || !token) return;
    creditNotesService.getNextNumber(token).then((r) => setCreditNoteNumber(r.nextCreditNoteNumber)).catch(() => {});
  }, [isOpen, token]);

  // Fetch reference data
  useEffect(() => {
    if (!isOpen || !token) return;
    accountsService.getAccounts({ isActive: "true", sortBy: "accountNumber", sortOrder: "asc" }, token)
      .then((acc) => setAccountsList(acc.map((a) => ({ id: a.id, name: a.name, accountNumber: a.accountNumber }))))
      .catch(() => {});
    productsService.getProducts({ sortBy: "name", sortOrder: "asc", isActive: "true" }, token)
      .then((p) => setProductsList(p.items.map((pr) => ({ id: pr.id, name: pr.name, sku: pr.sku, salesPrice: pr.salesPrice }))))
      .catch(() => {});
  }, [isOpen, token]);

  // Fetch invoices when customer selected
  const fetchInvoices = useCallback(async () => {
    if (!token || !customerId) { setInvoicesList([]); return; }
    try {
      const data = await invoicesService.getInvoices({ customerId, sortBy: "invoiceDate", sortOrder: "desc" }, token);
      setInvoicesList(data.items.map((inv) => ({ id: inv.id, invoiceNumber: inv.invoiceNumber, amountDue: inv.amountDue })));
    } catch { setInvoicesList([]); }
  }, [token, customerId]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const reset = () => {
    setCustomerId(""); setInvoiceId(""); setCreditNoteNumber(""); setReferenceNumber("");
    setCreditNoteDate(todayStr()); setDiscountType(""); setDiscountValue("");
    setReason(""); setNotes(""); setLines([newLine()]); setError("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleProductChange = (idx: number, productId: string) => {
    const product = productsList.find((p) => p.id === productId);
    setLines((prev) => prev.map((l, i) =>
      i === idx ? { ...l, productId, description: product ? product.name : l.description, unitPrice: product ? (product.salesPrice ?? 0) : l.unitPrice } : l
    ));
  };

  const updateLine = <K extends keyof LineItemRow>(idx: number, key: K, value: LineItemRow[K]) => {
    setLines((prev) => prev.map((l, i) => i === idx ? { ...l, [key]: value } : l));
  };

  // Totals
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
    if (!customerId) { setError("Please select a customer."); return; }
    if (lines.some((l) => !l.description || l.quantity <= 0 || l.unitPrice < 0)) {
      setError("Each line item needs a description, quantity > 0, and a valid unit price."); return;
    }
    setLoading(true); setError("");
    try {
      const lineItems: CreateCreditNoteLineItemRequest[] = lines.map((l, i) => ({
        productId: l.productId || undefined,
        accountId: l.accountId || undefined,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discountPercent: l.discountPercent || undefined,
        taxPercent: l.taxPercent || undefined,
        sortOrder: i,
      }));
      await creditNotesService.createCreditNote({
        customerId,
        invoiceId: invoiceId || undefined,
        creditNoteNumber: creditNoteNumber || undefined,
        referenceNumber: referenceNumber || undefined,
        creditNoteDate,
        discountType: discountType || undefined,
        discountValue: discountValue !== "" ? Number(discountValue) : undefined,
        reason: reason || undefined,
        notes: notes || undefined,
        lineItems,
      }, token);
      reset();
      onCreated();
      onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-4xl p-6 lg:p-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">New Credit Note</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Issue a credit to a customer for returns or adjustments</p>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Label>Customer <span className="text-error-500">*</span></Label>
            <select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setInvoiceId(""); }} className={selectClasses}>
              <option value="">Select customer...</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
            </select>
          </div>
          <div>
            <Label>Linked Invoice (optional)</Label>
            <select value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} className={selectClasses} disabled={!customerId}>
              <option value="">None</option>
              {invoicesList.map((inv) => <option key={inv.id} value={inv.id}>{inv.invoiceNumber} ({formatCurrency(inv.amountDue)} due)</option>)}
            </select>
          </div>
          <div>
            <Label>Credit Note #</Label>
            <Input value={creditNoteNumber} onChange={(e) => setCreditNoteNumber(e.target.value)} placeholder="CN-0001" />
          </div>
          <div>
            <Label>Reference #</Label>
            <Input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <Label>Date <span className="text-error-500">*</span></Label>
            <Input type="date" value={creditNoteDate} onChange={(e) => setCreditNoteDate(e.target.value)} />
          </div>
        </div>

        {/* Line Items */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Line Items</h3>
            <button onClick={() => setLines((prev) => [...prev, newLine()])} className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400">
              + Add Line
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Account</th>
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
                      <select value={line.accountId} onChange={(e) => updateLine(idx, "accountId", e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
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
                    <td className="px-3 py-2 text-right text-xs font-medium tabular-nums text-gray-900 dark:text-white/90 w-24">
                      {formatCurrency(calcLineAmount(line))}
                    </td>
                    <td className="px-3 py-2 w-8">
                      <button onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))} disabled={lines.length <= 1} className="text-gray-300 hover:text-error-500 disabled:cursor-not-allowed disabled:opacity-30">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Discount & Totals */}
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
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span><span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              {headerDiscount > 0 && (
                <div className="flex justify-between text-success-600 dark:text-success-400">
                  <span>Discount</span><span className="tabular-nums">-{formatCurrency(headerDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tax</span><span className="tabular-nums">{formatCurrency(taxTotal)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-300 pt-2 font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                <span>Total</span><span className="tabular-nums">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reason & Notes */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Reason</Label>
            <TextArea placeholder="Reason for credit note..." value={reason} onChange={setReason} rows={3} />
          </div>
          <div>
            <Label>Notes</Label>
            <TextArea placeholder="Internal notes..." value={notes} onChange={setNotes} rows={3} />
          </div>
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? "Creating..." : "Create Credit Note"}</Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateCreditNoteModal;
