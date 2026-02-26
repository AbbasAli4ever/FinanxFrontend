"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import { useAuth } from "@/context/AuthContext";
import estimatesService from "@/services/estimatesService";
import productsService from "@/services/productsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { DiscountType, PaymentTerms } from "@/types/estimates";

interface EditEstimateModalProps {
  isOpen: boolean;
  estimateId: string | null;
  customers: { id: string; displayName: string }[];
  accounts: { id: string; name: string; accountNumber: string }[];
  onClose: () => void;
  onUpdated: () => void;
}

interface LineItem {
  key: number;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
}

const selectClasses =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

function calcLineAmount(line: LineItem): number {
  return line.quantity * line.unitPrice * (1 - line.discountPercent / 100) * (1 + line.taxPercent / 100);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

const PAYMENT_TERMS: { value: PaymentTerms; label: string }[] = [
  { value: "DUE_ON_RECEIPT", label: "Due on Receipt" },
  { value: "NET_10", label: "Net 10" },
  { value: "NET_15", label: "Net 15" },
  { value: "NET_30", label: "Net 30" },
  { value: "NET_45", label: "Net 45" },
  { value: "NET_60", label: "Net 60" },
  { value: "NET_90", label: "Net 90" },
];

let keyCounter = 100;
const newKey = () => ++keyCounter;

const EditEstimateModal: React.FC<EditEstimateModalProps> = ({
  isOpen, estimateId, customers, accounts, onClose, onUpdated,
}) => {
  const { token } = useAuth();

  const [customerId, setCustomerId] = useState("");
  const [estimateDate, setEstimateDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms | "">("");
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<number | "">("");
  const [depositAccountId, setDepositAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [customerMessage, setCustomerMessage] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; sku: string | null; salesPrice: number | null }[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const populateForm = useCallback((est: Awaited<ReturnType<typeof estimatesService.getEstimate>>) => {
    setCustomerId(est.customer.id);
    setEstimateDate(est.estimateDate.split("T")[0]);
    setExpirationDate(est.expirationDate ? est.expirationDate.split("T")[0] : "");
    setPaymentTerms((est.paymentTerms as PaymentTerms) ?? "");
    setDiscountType((est.discountType as DiscountType) ?? "PERCENTAGE");
    setDiscountValue(est.discountValue ?? "");
    setDepositAccountId(est.depositAccount?.id ?? "");
    setNotes(est.notes ?? "");
    setTermsAndConditions(est.termsAndConditions ?? "");
    setCustomerMessage(est.customerMessage ?? "");
    setLineItems(est.lineItems.map((l) => ({
      key: newKey(),
      productId: l.product?.id ?? "",
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discountPercent: l.discountPercent,
      taxPercent: l.taxPercent,
    })));
  }, []);

  useEffect(() => {
    if (!isOpen || !estimateId || !token) return;
    setFetchLoading(true); setError("");
    estimatesService.getEstimate(estimateId, token)
      .then(populateForm)
      .catch((err) => setError(formatApiErrorMessage(err)))
      .finally(() => setFetchLoading(false));
  }, [isOpen, estimateId, token, populateForm]);

  useEffect(() => {
    if (!isOpen || !token) return;
    productsService.getProducts({ limit: "200" }, token)
      .then((p) => setProducts(p.items.map((prod) => ({ id: prod.id, name: prod.name, sku: prod.sku, salesPrice: prod.salesPrice }))))
      .catch(() => {});
  }, [isOpen, token]);

  const updateLine = (key: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) => prev.map((l) => l.key === key ? { ...l, [field]: value } : l));
  };

  const selectProduct = (key: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setLineItems((prev) => prev.map((l) => l.key === key ? {
      ...l, productId,
      description: prod?.name ?? l.description,
      unitPrice: prod?.salesPrice ?? l.unitPrice,
    } : l));
  };

  const addLine = () => setLineItems((prev) => [...prev, { key: newKey(), productId: "", description: "", quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0 }]);
  const removeLine = (key: number) => { if (lineItems.length > 1) setLineItems((prev) => prev.filter((l) => l.key !== key)); };

  const subtotal = lineItems.reduce((s, l) => s + l.quantity * l.unitPrice * (1 - l.discountPercent / 100), 0);
  const taxAmount = lineItems.reduce((s, l) => s + l.quantity * l.unitPrice * (1 - l.discountPercent / 100) * (l.taxPercent / 100), 0);
  const discountAmount = discountValue ? (discountType === "PERCENTAGE" ? subtotal * (Number(discountValue) / 100) : Number(discountValue)) : 0;
  const total = subtotal + taxAmount - discountAmount;

  const handleSubmit = async () => {
    if (!token || !estimateId) return;
    if (!customerId) { setError("Please select a customer."); return; }
    if (lineItems.some((l) => !l.description || l.quantity <= 0)) {
      setError("Please fill in all line item descriptions and quantities."); return;
    }
    setLoading(true); setError("");
    try {
      await estimatesService.updateEstimate(estimateId, {
        customerId,
        estimateDate,
        expirationDate: expirationDate || undefined,
        paymentTerms: (paymentTerms as PaymentTerms) || undefined,
        discountType: discountValue ? discountType : undefined,
        discountValue: discountValue ? Number(discountValue) : undefined,
        depositAccountId: depositAccountId || undefined,
        notes: notes || undefined,
        termsAndConditions: termsAndConditions || undefined,
        customerMessage: customerMessage || undefined,
        lineItems: lineItems.map((l, idx) => ({
          productId: l.productId || undefined,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountPercent: l.discountPercent || undefined,
          taxPercent: l.taxPercent || undefined,
          sortOrder: idx,
        })),
      }, token);
      onUpdated(); onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl p-6 lg:p-8">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Estimate</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Update estimate details — DRAFT only</p>
        </div>

        {fetchLoading ? (
          <div className="flex items-center justify-center gap-2 py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
            <span className="text-sm text-gray-500">Loading estimate...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-1">
                <Label>Customer <span className="text-error-500">*</span></Label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={selectClasses}>
                  <option value="">Select customer...</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                </select>
              </div>
              <div>
                <Label>Estimate Date <span className="text-error-500">*</span></Label>
                <Input type="date" value={estimateDate} onChange={(e) => setEstimateDate(e.target.value)} />
              </div>
              <div>
                <Label>Expiration Date</Label>
                <Input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
              </div>
              <div>
                <Label>Payment Terms</Label>
                <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms | "")} className={selectClasses}>
                  <option value="">None</option>
                  {PAYMENT_TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Deposit Account (optional)</Label>
                <select value={depositAccountId} onChange={(e) => setDepositAccountId(e.target.value)} className={selectClasses}>
                  <option value="">Default</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.accountNumber} — {a.name}</option>)}
                </select>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Line Items</h3>
                <button onClick={addLine} className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Add Line
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                        <th className="px-3 py-2.5 text-left font-medium text-gray-500 w-36">Product</th>
                        <th className="px-3 py-2.5 text-left font-medium text-gray-500">Description</th>
                        <th className="px-3 py-2.5 text-right font-medium text-gray-500 w-16">Qty</th>
                        <th className="px-3 py-2.5 text-right font-medium text-gray-500 w-24">Unit Price</th>
                        <th className="px-3 py-2.5 text-right font-medium text-gray-500 w-16">Disc %</th>
                        <th className="px-3 py-2.5 text-right font-medium text-gray-500 w-16">Tax %</th>
                        <th className="px-3 py-2.5 text-right font-medium text-gray-500 w-24">Amount</th>
                        <th className="px-3 py-2.5 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {lineItems.map((line) => (
                        <tr key={line.key}>
                          <td className="px-3 py-2">
                            <select value={line.productId} onChange={(e) => selectProduct(line.key, e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                              <option value="">None</option>
                              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input type="text" value={line.description} onChange={(e) => updateLine(line.key, "description", e.target.value)} placeholder="Description..." className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
                          </td>
                          <td className="px-3 py-2"><input type="number" value={line.quantity} onChange={(e) => updateLine(line.key, "quantity", parseFloat(e.target.value) || 0)} min="0.001" step={1} className="w-full rounded border border-gray-300 px-2 py-1.5 text-right text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /></td>
                          <td className="px-3 py-2"><input type="number" value={line.unitPrice} onChange={(e) => updateLine(line.key, "unitPrice", parseFloat(e.target.value) || 0)} min="0" step={0.01} className="w-full rounded border border-gray-300 px-2 py-1.5 text-right text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /></td>
                          <td className="px-3 py-2"><input type="number" value={line.discountPercent} onChange={(e) => updateLine(line.key, "discountPercent", parseFloat(e.target.value) || 0)} min="0" max="100" step={0.1} className="w-full rounded border border-gray-300 px-2 py-1.5 text-right text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /></td>
                          <td className="px-3 py-2"><input type="number" value={line.taxPercent} onChange={(e) => updateLine(line.key, "taxPercent", parseFloat(e.target.value) || 0)} min="0" max="100" step={0.1} className="w-full rounded border border-gray-300 px-2 py-1.5 text-right text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /></td>
                          <td className="px-3 py-2 text-right text-xs font-medium tabular-nums text-gray-900 dark:text-white/90">{formatCurrency(calcLineAmount(line))}</td>
                          <td className="px-3 py-2">
                            <button onClick={() => removeLine(line.key)} disabled={lineItems.length === 1} className="rounded p-0.5 text-gray-400 hover:text-error-500 disabled:opacity-30">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-gray-200 bg-gray-50/70 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/30">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <select value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType)} className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                        <option value="PERCENTAGE">Discount %</option>
                        <option value="FIXED">Discount $</option>
                      </select>
                      <input type="number" value={discountValue} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || "")} placeholder="0" min="0" step={0.01} className="w-24 rounded border border-gray-300 px-2 py-1 text-right text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs">
                      <div className="flex gap-8 text-gray-600 dark:text-gray-400"><span>Subtotal</span><span className="tabular-nums">{formatCurrency(subtotal)}</span></div>
                      {discountAmount > 0 && <div className="flex gap-8 text-success-600 dark:text-success-400"><span>Discount</span><span className="tabular-nums">-{formatCurrency(discountAmount)}</span></div>}
                      {taxAmount > 0 && <div className="flex gap-8 text-gray-600 dark:text-gray-400"><span>Tax</span><span className="tabular-nums">{formatCurrency(taxAmount)}</span></div>}
                      <div className="flex gap-8 border-t border-gray-300 pt-1 text-sm font-bold text-gray-900 dark:border-gray-700 dark:text-white"><span>Total</span><span className="tabular-nums">{formatCurrency(total)}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div><Label>Customer Message (optional)</Label><TextArea placeholder="Message shown to customer..." value={customerMessage} onChange={setCustomerMessage} rows={3} /></div>
              <div><Label>Terms & Conditions (optional)</Label><TextArea placeholder="Payment terms, warranty info..." value={termsAndConditions} onChange={setTermsAndConditions} rows={3} /></div>
              <div><Label>Internal Notes (optional)</Label><TextArea placeholder="Internal notes..." value={notes} onChange={setNotes} rows={3} /></div>
            </div>
          </>
        )}

        {error && <Alert variant="error" title="Error" message={error} />}

        <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading || fetchLoading}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={loading || fetchLoading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditEstimateModal;
