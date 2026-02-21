"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import invoicesService from "@/services/invoicesService";
import productsService from "@/services/productsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { Invoice, PaymentTerms, DiscountType } from "@/types/invoices";
import type { ProductListItem } from "@/types/products";

interface LineItem {
  key: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
}

interface EditInvoiceModalProps {
  isOpen: boolean;
  invoiceId: string | null;
  onClose: () => void;
  onUpdated: () => void;
  customers: { id: string; displayName: string; email: string | null }[];
  accounts: { id: string; name: string; accountNumber: string }[];
}

const PAYMENT_TERMS_OPTIONS: { value: PaymentTerms; label: string; days: number | null }[] = [
  { value: "DUE_ON_RECEIPT", label: "Due on Receipt", days: 0 },
  { value: "NET_10", label: "Net 10", days: 10 },
  { value: "NET_15", label: "Net 15", days: 15 },
  { value: "NET_30", label: "Net 30", days: 30 },
  { value: "NET_45", label: "Net 45", days: 45 },
  { value: "NET_60", label: "Net 60", days: 60 },
  { value: "NET_90", label: "Net 90", days: 90 },
  { value: "CUSTOM", label: "Custom", days: null },
];

const selectClasses =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

function generateKey(): string {
  return Math.random().toString(36).substring(2, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function calcLineAmount(item: LineItem) {
  const gross = item.quantity * item.unitPrice;
  const discount = gross * (item.discountPercent / 100);
  const taxable = gross - discount;
  const tax = taxable * (item.taxPercent / 100);
  return { gross, discount, tax, amount: taxable + tax };
}

const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({
  isOpen,
  invoiceId,
  onClose,
  onUpdated,
  customers,
  accounts,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  // Invoice header
  const [customerId, setCustomerId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>("NET_30");
  const [notes, setNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [depositAccountId, setDepositAccountId] = useState("");

  // Discount
  const [discountType, setDiscountType] = useState<DiscountType | "">("");
  const [discountValue, setDiscountValue] = useState("");

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Product search
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [activeProductRow, setActiveProductRow] = useState<number | null>(null);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Fetch invoice detail when modal opens
  useEffect(() => {
    if (isOpen && invoiceId && token) {
      setFetching(true);
      invoicesService
        .getInvoice(invoiceId, token)
        .then((inv: Invoice) => {
          setCustomerId(inv.customer.id);
          setInvoiceNumber(inv.invoiceNumber);
          setReferenceNumber(inv.referenceNumber || "");
          setInvoiceDate(inv.invoiceDate.split("T")[0]);
          setDueDate(inv.dueDate ? inv.dueDate.split("T")[0] : "");
          setPaymentTerms((inv.paymentTerms as PaymentTerms) || "CUSTOM");
          setNotes(inv.notes || "");
          setTermsAndConditions(inv.termsAndConditions || "");
          setDepositAccountId(inv.depositAccount?.id || "");
          setDiscountType(inv.discountType || "");
          setDiscountValue(inv.discountValue != null ? String(inv.discountValue) : "");
          setLineItems(
            inv.lineItems.map((li) => ({
              key: generateKey(),
              productId: li.product?.id || "",
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              discountPercent: li.discountPercent,
              taxPercent: li.taxPercent,
            }))
          );
        })
        .catch((err) => setError(formatApiErrorMessage(err)))
        .finally(() => setFetching(false));
    }
  }, [isOpen, invoiceId, token]);

  // Auto-calculate due date from payment terms
  useEffect(() => {
    if (paymentTerms !== "CUSTOM" && invoiceDate) {
      const opt = PAYMENT_TERMS_OPTIONS.find((o) => o.value === paymentTerms);
      if (opt && opt.days !== null) {
        setDueDate(addDays(invoiceDate, opt.days));
      }
    }
  }, [paymentTerms, invoiceDate]);

  // Search products with debounce
  useEffect(() => {
    if (!token || !productSearch.trim()) {
      setProducts([]);
      return;
    }
    const timer = setTimeout(() => {
      productsService
        .getProducts({ search: productSearch, isActive: "true", limit: "10" }, token)
        .then((res) => setProducts(res.items))
        .catch(() => setProducts([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch, token]);

  // Totals calculation
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    lineItems.forEach((item) => {
      const calc = calcLineAmount(item);
      subtotal += calc.gross;
      totalDiscount += calc.discount;
      totalTax += calc.tax;
    });

    let invoiceDiscount = 0;
    if (discountType === "PERCENTAGE" && discountValue) {
      invoiceDiscount = (subtotal - totalDiscount) * (parseFloat(discountValue) / 100);
    } else if (discountType === "FIXED" && discountValue) {
      invoiceDiscount = parseFloat(discountValue) || 0;
    }

    const total = subtotal - totalDiscount - invoiceDiscount + totalTax;
    return { subtotal, totalDiscount, invoiceDiscount, totalTax, total };
  }, [lineItems, discountType, discountValue]);

  const resetForm = useCallback(() => {
    setCustomerId("");
    setInvoiceNumber("");
    setReferenceNumber("");
    setInvoiceDate("");
    setDueDate("");
    setPaymentTerms("NET_30");
    setNotes("");
    setTermsAndConditions("");
    setDepositAccountId("");
    setDiscountType("");
    setDiscountValue("");
    setLineItems([]);
    setError("");
    setProductSearch("");
    setActiveProductRow(null);
    setShowProductDropdown(false);
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectProduct = (rowIndex: number, product: ProductListItem) => {
    setLineItems((prev) =>
      prev.map((item, i) =>
        i === rowIndex
          ? {
              ...item,
              productId: product.id,
              description: product.name + (product.sku ? ` (${product.sku})` : ""),
              unitPrice: product.salesPrice ?? 0,
              taxPercent: product.taxable ? 0 : 0,
            }
          : item
      )
    );
    setProductSearch("");
    setShowProductDropdown(false);
    setActiveProductRow(null);
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { key: generateKey(), productId: "", description: "", quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0 },
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !invoiceId) return;

    if (!customerId) {
      setError("Please select a customer.");
      return;
    }
    if (lineItems.every((li) => !li.description.trim())) {
      setError("Please add at least one line item.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await invoicesService.updateInvoice(
        invoiceId,
        {
          customerId,
          invoiceDate: invoiceDate || undefined,
          dueDate: dueDate || undefined,
          paymentTerms: paymentTerms || undefined,
          invoiceNumber: invoiceNumber || undefined,
          referenceNumber: referenceNumber || undefined,
          discountType: discountType || undefined,
          discountValue: discountValue ? parseFloat(discountValue) : undefined,
          depositAccountId: depositAccountId || undefined,
          notes: notes || undefined,
          termsAndConditions: termsAndConditions || undefined,
          lineItems: lineItems
            .filter((li) => li.description.trim())
            .map((li, idx) => ({
              productId: li.productId || undefined,
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              discountPercent: li.discountPercent || undefined,
              taxPercent: li.taxPercent || undefined,
              sortOrder: idx + 1,
            })),
        },
        token
      );
      onUpdated();
      handleClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-4xl p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Edit Invoice
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {invoiceNumber ? `Editing ${invoiceNumber} (Draft)` : "Loading..."}
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      {fetching ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] overflow-y-auto space-y-6 pr-1">
            {/* Customer & Invoice Info */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ei-customer">
                  Customer <span className="text-error-500">*</span>
                </Label>
                <select
                  id="ei-customer"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className={`${selectClasses} ${customerId ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.displayName}
                      {c.email ? ` (${c.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="ei-number">Invoice Number</Label>
                <Input
                  id="ei-number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="ei-date">
                  Invoice Date <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="ei-date"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="ei-terms">Payment Terms</Label>
                <select
                  id="ei-terms"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)}
                  className={`${selectClasses} text-gray-800 dark:text-white/90`}
                >
                  {PAYMENT_TERMS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="ei-due">Due Date</Label>
                <Input
                  id="ei-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={paymentTerms !== "CUSTOM"}
                />
              </div>

              <div>
                <Label htmlFor="ei-ref">Reference Number</Label>
                <Input
                  id="ei-ref"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. PO-001"
                />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Line Items
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  + Add Line
                </Button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                      <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300" style={{ minWidth: 200 }}>
                        Product / Description
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300 w-20">Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300 w-28">Price</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300 w-20">Disc %</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300 w-20">Tax %</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300 w-28">Amount</th>
                      <th className="px-3 py-2 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, index) => {
                      const calc = calcLineAmount(item);
                      return (
                        <tr key={item.key} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                          <td className="px-3 py-2 relative">
                            <input
                              type="text"
                              value={activeProductRow === index ? productSearch : item.description}
                              onChange={(e) => {
                                if (activeProductRow === index) {
                                  setProductSearch(e.target.value);
                                } else {
                                  updateLineItem(index, "description", e.target.value);
                                }
                              }}
                              onFocus={() => {
                                setActiveProductRow(index);
                                setProductSearch(item.description);
                                setShowProductDropdown(true);
                              }}
                              onBlur={() => {
                                setTimeout(() => {
                                  if (activeProductRow === index) {
                                    if (!item.productId && productSearch.trim()) {
                                      updateLineItem(index, "description", productSearch);
                                    }
                                    setShowProductDropdown(false);
                                    setActiveProductRow(null);
                                  }
                                }, 200);
                              }}
                              placeholder="Search product or type description"
                              className="w-full rounded border-0 bg-transparent px-1 py-1 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white/90 dark:placeholder:text-white/30"
                            />
                            {activeProductRow === index && showProductDropdown && products.length > 0 && (
                              <div className="absolute left-0 top-full z-50 mt-1 max-h-48 w-72 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                                {products.map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      selectProduct(index, p);
                                    }}
                                  >
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                                      {p.sku && <p className="text-xs text-gray-500">SKU: {p.sku}</p>}
                                    </div>
                                    {p.salesPrice !== null && (
                                      <span className="text-xs text-gray-500">{formatCurrency(p.salesPrice)}</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min="1" step="1" value={item.quantity}
                              onChange={(e) => updateLineItem(index, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full rounded border-0 bg-transparent px-1 py-1 text-right text-sm text-gray-900 focus:outline-none dark:text-white/90"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min="0" step="0.01" value={item.unitPrice}
                              onChange={(e) => updateLineItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                              className="w-full rounded border-0 bg-transparent px-1 py-1 text-right text-sm text-gray-900 focus:outline-none dark:text-white/90"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min="0" max="100" step="0.01" value={item.discountPercent}
                              onChange={(e) => updateLineItem(index, "discountPercent", parseFloat(e.target.value) || 0)}
                              className="w-full rounded border-0 bg-transparent px-1 py-1 text-right text-sm text-gray-900 focus:outline-none dark:text-white/90"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min="0" max="100" step="0.01" value={item.taxPercent}
                              onChange={(e) => updateLineItem(index, "taxPercent", parseFloat(e.target.value) || 0)}
                              className="w-full rounded border-0 bg-transparent px-1 py-1 text-right text-sm text-gray-900 focus:outline-none dark:text-white/90"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">
                            {formatCurrency(calc.amount)}
                          </td>
                          <td className="px-3 py-2">
                            {lineItems.length > 1 && (
                              <button type="button" onClick={() => removeLineItem(index)}
                                className="text-gray-400 hover:text-error-500" title="Remove line">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals & Discount */}
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(totals.subtotal)}</span>
                </div>

                {totals.totalDiscount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Line Discounts</span>
                    <span className="text-error-500">-{formatCurrency(totals.totalDiscount)}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <select value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType | "")}
                    className="h-9 w-32 appearance-none rounded-lg border border-gray-300 px-2 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                    <option value="">No Discount</option>
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                  {discountType && (
                    <input type="number" min="0" step="0.01" value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === "PERCENTAGE" ? "%" : "$"}
                      className="h-9 w-24 rounded-lg border border-gray-300 px-2 text-right text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    />
                  )}
                  {totals.invoiceDiscount > 0 && (
                    <span className="ml-auto text-sm text-error-500">-{formatCurrency(totals.invoiceDiscount)}</span>
                  )}
                </div>

                {totals.totalTax > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Tax</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(totals.totalTax)}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
                  <div className="flex items-center justify-between text-base font-semibold">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deposit Account */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ei-account">Deposit Account</Label>
                <select id="ei-account" value={depositAccountId}
                  onChange={(e) => setDepositAccountId(e.target.value)}
                  className={`${selectClasses} ${depositAccountId ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}>
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.accountNumber} - {a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes & Terms */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Notes</Label>
                <TextArea value={notes} onChange={(val) => setNotes(val)} placeholder="Notes visible on the invoice" rows={3} />
              </div>
              <div>
                <Label>Terms & Conditions</Label>
                <TextArea value={termsAndConditions} onChange={(val) => setTermsAndConditions(val)} placeholder="Payment terms and conditions" rows={3} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default EditInvoiceModal;
