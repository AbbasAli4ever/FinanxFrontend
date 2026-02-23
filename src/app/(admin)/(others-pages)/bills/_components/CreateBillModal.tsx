"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import billsService from "@/services/billsService";
import productsService from "@/services/productsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { PaymentTerms, DiscountType } from "@/types/bills";
import type { ProductListItem } from "@/types/products";

interface LineItem {
  key: string;
  productId: string;
  expenseAccountId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
}

interface CreateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  vendors: { id: string; displayName: string; email: string | null }[];
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

const CreateBillModal: React.FC<CreateBillModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  vendors,
  accounts,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Bill header
  const [vendorId, setVendorId] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [billDate, setBillDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>("NET_30");
  const [notes, setNotes] = useState("");
  const [memo, setMemo] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState("");

  // Discount
  const [discountType, setDiscountType] = useState<DiscountType | "">("");
  const [discountValue, setDiscountValue] = useState("");

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { key: generateKey(), productId: "", expenseAccountId: "", description: "", quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0 },
  ]);

  // Product search
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [activeProductRow, setActiveProductRow] = useState<number | null>(null);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Load next bill number when modal opens
  useEffect(() => {
    if (isOpen && token) {
      const today = new Date().toISOString().split("T")[0];
      setBillDate(today);
      setDueDate(addDays(today, 30));

      billsService.getNextNumber(token).then((res) => {
        setBillNumber(res.nextBillNumber);
      }).catch(() => {});
    }
  }, [isOpen, token]);

  // Auto-calculate due date from payment terms
  useEffect(() => {
    if (paymentTerms !== "CUSTOM" && billDate) {
      const opt = PAYMENT_TERMS_OPTIONS.find((o) => o.value === paymentTerms);
      if (opt && opt.days !== null) {
        setDueDate(addDays(billDate, opt.days));
      }
    }
  }, [paymentTerms, billDate]);

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

    let billDiscount = 0;
    if (discountType === "PERCENTAGE" && discountValue) {
      billDiscount = (subtotal - totalDiscount) * (parseFloat(discountValue) / 100);
    } else if (discountType === "FIXED" && discountValue) {
      billDiscount = parseFloat(discountValue) || 0;
    }

    const total = subtotal - totalDiscount - billDiscount + totalTax;
    return { subtotal, totalDiscount, billDiscount, totalTax, total };
  }, [lineItems, discountType, discountValue]);

  const resetForm = useCallback(() => {
    setVendorId("");
    setBillNumber("");
    setVendorInvoiceNumber("");
    setReferenceNumber("");
    setBillDate("");
    setDueDate("");
    setPaymentTerms("NET_30");
    setNotes("");
    setMemo("");
    setPaymentAccountId("");
    setDiscountType("");
    setDiscountValue("");
    setLineItems([
      { key: generateKey(), productId: "", expenseAccountId: "", description: "", quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0 },
    ]);
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
              unitPrice: product.purchaseCost ?? product.salesPrice ?? 0,
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
      { key: generateKey(), productId: "", expenseAccountId: "", description: "", quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0 },
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!vendorId) {
      setError("Please select a vendor.");
      return;
    }
    if (!billDate) {
      setError("Please enter a bill date.");
      return;
    }
    if (lineItems.every((li) => !li.description.trim())) {
      setError("Please add at least one line item.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await billsService.createBill(
        {
          vendorId,
          billDate,
          dueDate: dueDate || undefined,
          paymentTerms: paymentTerms || undefined,
          billNumber: billNumber || undefined,
          vendorInvoiceNumber: vendorInvoiceNumber || undefined,
          referenceNumber: referenceNumber || undefined,
          discountType: discountType || undefined,
          discountValue: discountValue ? parseFloat(discountValue) : undefined,
          paymentAccountId: paymentAccountId || undefined,
          notes: notes || undefined,
          memo: memo || undefined,
          lineItems: lineItems
            .filter((li) => li.description.trim())
            .map((li, idx) => ({
              productId: li.productId || undefined,
              expenseAccountId: li.expenseAccountId || undefined,
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
      onCreated();
      handleClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-5xl p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Create Bill
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create a new bill from a vendor
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="max-h-[70vh] overflow-y-auto space-y-6 pr-1">
          {/* Vendor & Bill Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="cb-vendor">
                Vendor <span className="text-error-500">*</span>
              </Label>
              <select
                id="cb-vendor"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className={`${selectClasses} ${vendorId ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}
              >
                <option value="">Select vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.displayName}
                    {v.email ? ` (${v.email})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="cb-number">Bill Number</Label>
              <Input
                id="cb-number"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder="Auto-generated"
              />
            </div>

            <div>
              <Label htmlFor="cb-vinv">Vendor Invoice #</Label>
              <Input
                id="cb-vinv"
                value={vendorInvoiceNumber}
                onChange={(e) => setVendorInvoiceNumber(e.target.value)}
                placeholder="Vendor's reference"
              />
            </div>

            <div>
              <Label htmlFor="cb-date">
                Bill Date <span className="text-error-500">*</span>
              </Label>
              <Input
                id="cb-date"
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="cb-terms">Payment Terms</Label>
              <select
                id="cb-terms"
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
              <Label htmlFor="cb-due">Due Date</Label>
              <Input
                id="cb-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={paymentTerms !== "CUSTOM"}
              />
            </div>

            <div>
              <Label htmlFor="cb-ref">Reference Number</Label>
              <Input
                id="cb-ref"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. PO-2026-042"
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
                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300" style={{ minWidth: 180 }}>
                      Product / Description
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300" style={{ minWidth: 130 }}>
                      Expense Acct
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300 w-20">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300 w-28">
                      Price
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300 w-20">
                      Disc %
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300 w-20">
                      Tax %
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300 w-28">
                      Amount
                    </th>
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
                                  {p.purchaseCost !== null && (
                                    <span className="text-xs text-gray-500">{formatCurrency(p.purchaseCost)}</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.expenseAccountId}
                            onChange={(e) => updateLineItem(index, "expenseAccountId", e.target.value)}
                            className="w-full rounded border-0 bg-transparent px-1 py-1 text-xs text-gray-900 focus:outline-none dark:text-white/90"
                          >
                            <option value="">—</option>
                            {accounts.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.accountNumber} - {a.name}
                              </option>
                            ))}
                          </select>
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
                {totals.billDiscount > 0 && (
                  <span className="ml-auto text-sm text-error-500">-{formatCurrency(totals.billDiscount)}</span>
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

          {/* Payment Account */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cb-payacct">Payment Account</Label>
              <select id="cb-payacct" value={paymentAccountId}
                onChange={(e) => setPaymentAccountId(e.target.value)}
                className={`${selectClasses} ${paymentAccountId ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}>
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.accountNumber} - {a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes & Memo */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Notes</Label>
              <TextArea value={notes} onChange={(val) => setNotes(val)} placeholder="External notes" rows={3} />
            </div>
            <div>
              <Label>Internal Memo</Label>
              <TextArea value={memo} onChange={(val) => setMemo(val)} placeholder="Internal memo (not visible to vendor)" rows={3} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Button type="button" variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Creating..." : "Create Bill"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateBillModal;
