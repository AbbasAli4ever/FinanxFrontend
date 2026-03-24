"use client";

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import TextArea from "@/components/form/input/TextArea";
import { useAuth } from "@/context/AuthContext";
import AppDatePicker from "@/components/form/AppDatePicker";
import salesOrdersService from "@/services/salesOrdersService";
import productsService from "@/services/productsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { Customer } from "@/types/customers";
import type { Account } from "@/types/accounts";
import type { ProductListItem } from "@/types/products";
import type { SalesOrder, UpdateSORequest, CreateSOLineItemRequest, DiscountType } from "@/types/salesOrders";

interface Props {
  isOpen: boolean;
  soId: string | null;
  onClose: () => void;
  onUpdated: () => void;
  customers: Customer[];
  accounts: Account[];
}

interface LineItemRow {
  id: string;
  productId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discountPercent: string;
  taxPercent: string;
}

const PAYMENT_TERMS = ["Net 15", "Net 30", "Net 45", "Net 60", "Due on Receipt", "Prepaid"];

function calcLineAmount(qty: string, price: string, disc: string, tax: string): number {
  const q = parseFloat(qty) || 0;
  const p = parseFloat(price) || 0;
  const d = parseFloat(disc) || 0;
  const t = parseFloat(tax) || 0;
  return q * p * (1 - d / 100) * (1 + t / 100);
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function newRow(): LineItemRow {
  return {
    id: Math.random().toString(36).slice(2),
    productId: "", description: "",
    quantity: "1", unitPrice: "", discountPercent: "0", taxPercent: "0",
  };
}

const EditSalesOrderModal: React.FC<Props> = ({
  isOpen, soId, onClose, onUpdated, customers, accounts,
}) => {
  const { token } = useAuth();
  const [so, setSo] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [showShipping, setShowShipping] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [depositAccountId, setDepositAccountId] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType | "">("");
  const [discountValue, setDiscountValue] = useState("");
  const [notes, setNotes] = useState("");
  const [memo, setMemo] = useState("");
  const [customerMessage, setCustomerMessage] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [shippingLine1, setShippingLine1] = useState("");
  const [shippingLine2, setShippingLine2] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingCountry, setShippingCountry] = useState("");
  const [lineItems, setLineItems] = useState<LineItemRow[]>([newRow()]);

  const productsLoaded = useRef(false);

  useEffect(() => {
    if (!isOpen || !soId || !token) return;
    setFetchLoading(true); setError("");
    salesOrdersService.getSalesOrder(soId, token)
      .then((data) => {
        setSo(data);
        setCustomerId(data.customer.id);
        setOrderDate(data.orderDate);
        setExpectedDeliveryDate(data.expectedDeliveryDate ?? "");
        setPaymentTerms(data.paymentTerms ?? "");
        setReferenceNumber(data.referenceNumber ?? "");
        setDepositAccountId(data.depositAccount?.id ?? "");
        setDiscountType(data.discountType ?? "");
        setDiscountValue(data.discountValue != null ? String(data.discountValue) : "");
        setNotes(data.notes ?? ""); setMemo(data.memo ?? "");
        setCustomerMessage(data.customerMessage ?? "");
        setTermsAndConditions(data.termsAndConditions ?? "");
        const sa = data.shippingAddress;
        setShippingLine1(sa?.line1 ?? "");
        setShippingLine2(sa?.line2 ?? "");
        setShippingCity(sa?.city ?? ""); setShippingState(sa?.state ?? "");
        setShippingPostalCode(sa?.postalCode ?? ""); setShippingCountry(sa?.country ?? "");
        setShowShipping(!!(sa?.line1 || sa?.city));
        setLineItems(data.lineItems.map((li) => ({
          id: li.id,
          productId: li.product?.id ?? "",
          description: li.description,
          quantity: String(li.quantity),
          unitPrice: String(li.unitPrice),
          discountPercent: String(li.discountPercent),
          taxPercent: String(li.taxPercent),
        })));
      })
      .catch((err) => setError(formatApiErrorMessage(err)))
      .finally(() => setFetchLoading(false));
  }, [isOpen, soId, token]);

  useEffect(() => {
    if (!isOpen || !token || productsLoaded.current) return;
    productsService.getProducts({ isActive: "true", sortBy: "name", sortOrder: "asc" }, token)
      .then((data) => { setProducts(data.items ?? []); productsLoaded.current = true; })
      .catch(() => {});
  }, [isOpen, token]);

  const handleProductChange = (rowId: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    setLineItems((prev) => prev.map((row) =>
      row.id === rowId ? {
        ...row, productId,
        description: product ? product.name : row.description,
        unitPrice: product?.salesPrice ? String(product.salesPrice) : row.unitPrice,
      } : row
    ));
  };

  const updateRow = (rowId: string, field: keyof LineItemRow, value: string) => {
    setLineItems((prev) => prev.map((row) => row.id === rowId ? { ...row, [field]: value } : row));
  };

  const removeRow = (rowId: string) => {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((r) => r.id !== rowId));
  };

  const lineAmounts = lineItems.map((r) => calcLineAmount(r.quantity, r.unitPrice, r.discountPercent, r.taxPercent));
  const subtotal = lineItems.reduce((sum, r) => sum + (parseFloat(r.quantity) || 0) * (parseFloat(r.unitPrice) || 0), 0);
  const totalLineAmount = lineAmounts.reduce((s, a) => s + a, 0);
  let discountAmount = 0;
  if (discountType === "PERCENTAGE") discountAmount = subtotal * (parseFloat(discountValue) || 0) / 100;
  else if (discountType === "FIXED") discountAmount = parseFloat(discountValue) || 0;
  const totalAmount = totalLineAmount - discountAmount;

  const handleClose = () => {
    setSo(null); setError(""); setLineItems([newRow()]);
    onClose();
  };

  const handleSubmit = async () => {
    if (!token || !soId) return;
    const validLines = lineItems.filter((r) => r.description.trim() && r.quantity && r.unitPrice);
    if (validLines.length === 0) { setError("Please add at least one complete line item."); return; }

    setLoading(true); setError("");
    try {
      const payload: UpdateSORequest = {
        customerId,
        orderDate,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        paymentTerms: paymentTerms || undefined,
        referenceNumber: referenceNumber || undefined,
        depositAccountId: depositAccountId || undefined,
        discountType: discountType || undefined,
        discountValue: discountValue ? parseFloat(discountValue) : undefined,
        notes: notes || undefined, memo: memo || undefined,
        customerMessage: customerMessage || undefined,
        termsAndConditions: termsAndConditions || undefined,
        ...(showShipping && {
          shippingAddressLine1: shippingLine1 || undefined,
          shippingAddressLine2: shippingLine2 || undefined,
          shippingCity: shippingCity || undefined,
          shippingState: shippingState || undefined,
          shippingPostalCode: shippingPostalCode || undefined,
          shippingCountry: shippingCountry || undefined,
        }),
        lineItems: validLines.map((r, i): CreateSOLineItemRequest => ({
          productId: r.productId || undefined,
          description: r.description.trim(),
          quantity: parseFloat(r.quantity) || 1,
          unitPrice: parseFloat(r.unitPrice) || 0,
          discountPercent: parseFloat(r.discountPercent) || 0,
          taxPercent: parseFloat(r.taxPercent) || 0,
          sortOrder: i,
        })),
      };
      await salesOrdersService.updateSalesOrder(soId, payload, token);
      onUpdated(); handleClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white placeholder:text-gray-400";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-4xl p-6 lg:p-8">
      {fetchLoading ? (
        <div className="flex items-center justify-center gap-2 py-16">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          <span className="text-sm text-gray-500">Loading sales order...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Sales Order</h2>
            {so && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{so.soNumber} — Draft only</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Customer <span className="text-error-500">*</span></label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={inputCls}>
                <option value="">Select customer...</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Order Date <span className="text-error-500">*</span></label>
              <AppDatePicker value={orderDate} onChange={(val) => setOrderDate(val)} maxToday />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Expected Delivery</label>
              <AppDatePicker value={expectedDeliveryDate} onChange={(val) => setExpectedDeliveryDate(val)} min={orderDate} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Terms</label>
              <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className={inputCls}>
                <option value="">Select terms...</option>
                {PAYMENT_TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Reference Number</label>
              <input type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="e.g. REF-001" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Deposit Account</label>
              <select value={depositAccountId} onChange={(e) => setDepositAccountId(e.target.value)} className={inputCls}>
                <option value="">Select account...</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.accountNumber} - {a.name}</option>)}
              </select>
            </div>
          </div>

          {/* Shipping */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800">
            <button type="button" onClick={() => setShowShipping(!showShipping)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              <span>Shipping Address <span className="ml-1 text-xs text-gray-400">(optional)</span></span>
              <svg className={`h-4 w-4 text-gray-400 transition-transform ${showShipping ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {showShipping && (
              <div className="grid grid-cols-1 gap-3 border-t border-gray-200 p-4 dark:border-gray-800 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="mb-1 block text-xs font-medium text-gray-500">Address Line 1</label>
                  <input type="text" value={shippingLine1} onChange={(e) => setShippingLine1(e.target.value)} placeholder="Street address" className={inputCls} />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="mb-1 block text-xs font-medium text-gray-500">Address Line 2</label>
                  <input type="text" value={shippingLine2} onChange={(e) => setShippingLine2(e.target.value)} placeholder="Apt, suite..." className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">City</label>
                  <input type="text" value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">State</label>
                  <input type="text" value={shippingState} onChange={(e) => setShippingState(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Postal Code</label>
                  <input type="text" value={shippingPostalCode} onChange={(e) => setShippingPostalCode(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Country</label>
                  <input type="text" value={shippingCountry} onChange={(e) => setShippingCountry(e.target.value)} placeholder="e.g. US, IN" className={inputCls} />
                </div>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Line Items</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 min-w-[220px]">Description / Product</th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 min-w-[70px]">Qty</th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 min-w-[100px]">Unit Price</th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 min-w-[70px]">Disc %</th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 min-w-[70px]">Tax %</th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 min-w-[90px]">Amount</th>
                    <th className="px-3 py-2.5 min-w-[32px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {lineItems.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="px-2 py-2">
                        <select value={row.productId} onChange={(e) => handleProductChange(row.id, e.target.value)}
                          className="mb-1 w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                          <option value="">-- Product (opt) --</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input type="text" value={row.description} onChange={(e) => updateRow(row.id, "description", e.target.value)}
                          placeholder="Description..." className="w-full rounded border border-gray-200 bg-transparent px-2 py-1 text-sm text-gray-900 focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:text-white" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" min="0" value={row.quantity} onChange={(e) => updateRow(row.id, "quantity", e.target.value)}
                          className="w-full rounded border border-gray-200 bg-transparent px-2 py-1 text-right text-sm focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:text-white" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" min="0" step="0.01" value={row.unitPrice} onChange={(e) => updateRow(row.id, "unitPrice", e.target.value)}
                          placeholder="0.00" className="w-full rounded border border-gray-200 bg-transparent px-2 py-1 text-right text-sm focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:text-white" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" min="0" max="100" value={row.discountPercent} onChange={(e) => updateRow(row.id, "discountPercent", e.target.value)}
                          className="w-full rounded border border-gray-200 bg-transparent px-2 py-1 text-right text-sm focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:text-white" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" min="0" max="100" value={row.taxPercent} onChange={(e) => updateRow(row.id, "taxPercent", e.target.value)}
                          className="w-full rounded border border-gray-200 bg-transparent px-2 py-1 text-right text-sm focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:text-white" />
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-white/90">
                        {formatCurrency(lineAmounts[idx])}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button onClick={() => removeRow(row.id)} disabled={lineItems.length === 1} className="text-gray-400 hover:text-error-500 disabled:opacity-30">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={() => setLineItems((prev) => [...prev, newRow()])}
              className="mt-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Line Item
            </button>
          </div>

          {/* Discount + Totals */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-end gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Discount</label>
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType | "")}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                  <option value="">None</option>
                  <option value="PERCENTAGE">Percentage %</option>
                  <option value="FIXED">Fixed Amount</option>
                </select>
              </div>
              {discountType && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {discountType === "PERCENTAGE" ? "%" : "$"}
                  </label>
                  <input type="number" min="0" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="0" className="w-28 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                </div>
              )}
            </div>
            <div className="min-w-52 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Subtotal</span><span className="tabular-nums">{formatCurrency(subtotal)}</span></div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-success-600 dark:text-success-400"><span>Discount</span><span className="tabular-nums">-{formatCurrency(discountAmount)}</span></div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-1 font-bold text-gray-900 dark:border-gray-700 dark:text-white"><span>Total</span><span className="tabular-nums">{formatCurrency(totalAmount)}</span></div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Internal Notes</label>
              <TextArea value={notes} onChange={setNotes} placeholder="Internal notes..." rows={3} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Memo</label>
              <TextArea value={memo} onChange={setMemo} placeholder="Memo..." rows={3} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Message</label>
              <TextArea value={customerMessage} onChange={setCustomerMessage} placeholder="Message to customer..." rows={3} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Terms & Conditions</label>
              <TextArea value={termsAndConditions} onChange={setTermsAndConditions} placeholder="Payment due within 30 days..." rows={3} />
            </div>
          </div>

          {error && <Alert variant="error" title="Error" message={error} />}

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default EditSalesOrderModal;
