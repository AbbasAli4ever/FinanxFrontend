"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import expensesService from "@/services/expensesService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { PaymentMethod, RecurringFrequency, CreateExpenseLineItemRequest } from "@/types/expenses";

interface SplitLineItem {
  key: string;
  expenseAccountId: string;
  description: string;
  amount: number;
  taxPercent: number;
}

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  vendors: { id: string; displayName: string }[];
  customers: { id: string; displayName: string }[];
  accounts: { id: string; name: string; accountNumber: string }[];
  categories: { id: string; name: string }[];
}

const selectClasses =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

function generateKey(): string {
  return Math.random().toString(36).substring(2, 10);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

const CreateExpenseModal: React.FC<CreateExpenseModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  vendors,
  customers,
  accounts,
  categories,
}) => {
  const { token } = useAuth();

  // Basic fields
  const [expenseNumber, setExpenseNumber] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayStr());
  const [expenseAccountId, setExpenseAccountId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState("");

  // Tax
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [isTaxDeductible, setIsTaxDeductible] = useState(false);

  // Billable
  const [isBillable, setIsBillable] = useState(false);
  const [billableCustomerId, setBillableCustomerId] = useState("");
  const [markupPercent, setMarkupPercent] = useState<number>(0);

  // Reimbursable
  const [isReimbursable, setIsReimbursable] = useState(false);

  // Mileage
  const [isMileage, setIsMileage] = useState(false);
  const [mileageDistance, setMileageDistance] = useState<number>(0);
  const [mileageRate, setMileageRate] = useState<number>(0.655);

  // Receipt
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");

  // Recurring
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("");
  const [recurringEndDate, setRecurringEndDate] = useState("");

  // Split line items
  const [isSplit, setIsSplit] = useState(false);
  const [lineItems, setLineItems] = useState<SplitLineItem[]>([
    { key: generateKey(), expenseAccountId: "", description: "", amount: 0, taxPercent: 0 },
    { key: generateKey(), expenseAccountId: "", description: "", amount: 0, taxPercent: 0 },
  ]);

  // UI
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch next number
  const fetchNextNumber = useCallback(async () => {
    if (!token) return;
    try {
      const data = await expensesService.getNextNumber(token);
      setExpenseNumber(data.nextExpenseNumber);
    } catch {
      // Non-critical
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      fetchNextNumber();
    }
  }, [isOpen, fetchNextNumber]);

  // Calculated amounts
  const computedAmount = useMemo(() => {
    if (isMileage) return mileageDistance * mileageRate;
    if (isSplit) return lineItems.reduce((sum, li) => sum + li.amount, 0);
    return amount;
  }, [isMileage, mileageDistance, mileageRate, isSplit, lineItems, amount]);

  const taxAmount = useMemo(() => {
    if (isSplit) {
      return lineItems.reduce((sum, li) => sum + li.amount * (li.taxPercent / 100), 0);
    }
    return computedAmount * (taxPercent / 100);
  }, [isSplit, lineItems, computedAmount, taxPercent]);

  const totalAmount = computedAmount + taxAmount;

  const markedUpAmount = useMemo(() => {
    if (isBillable && markupPercent > 0) {
      return totalAmount * (1 + markupPercent / 100);
    }
    return null;
  }, [isBillable, markupPercent, totalAmount]);

  // Line item helpers
  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { key: generateKey(), expenseAccountId: "", description: "", amount: 0, taxPercent: 0 },
    ]);
  };

  const removeLineItem = (key: string) => {
    if (lineItems.length <= 2) return;
    setLineItems((prev) => prev.filter((li) => li.key !== key));
  };

  const updateLineItem = (key: string, field: keyof SplitLineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((li) => (li.key === key ? { ...li, [field]: value } : li))
    );
  };

  const handleSave = async () => {
    if (!token) return;

    if (!expenseDate || !expenseAccountId) {
      setError("Expense date and expense account are required.");
      return;
    }

    if (isSplit && lineItems.length < 2) {
      setError("Split expenses require at least 2 line items.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const splitLineItemsPayload: CreateExpenseLineItemRequest[] | undefined =
        isSplit
          ? lineItems.map((li, i) => ({
              expenseAccountId: li.expenseAccountId,
              description: li.description,
              amount: li.amount,
              taxPercent: li.taxPercent || undefined,
              sortOrder: i + 1,
            }))
          : undefined;

      await expensesService.createExpense(
        {
          expenseDate,
          expenseAccountId,
          amount: isMileage || isSplit ? 0 : amount,
          expenseNumber: expenseNumber || undefined,
          description: description || undefined,
          referenceNumber: referenceNumber || undefined,
          notes: notes || undefined,
          vendorId: vendorId || undefined,
          categoryId: categoryId || undefined,
          paymentAccountId: paymentAccountId || undefined,
          paymentMethod: (paymentMethod as PaymentMethod) || undefined,
          taxPercent: !isSplit && taxPercent > 0 ? taxPercent : undefined,
          isTaxDeductible: isTaxDeductible || undefined,
          isBillable: isBillable || undefined,
          billableCustomerId: isBillable && billableCustomerId ? billableCustomerId : undefined,
          markupPercent: isBillable && markupPercent > 0 ? markupPercent : undefined,
          isReimbursable: isReimbursable || undefined,
          isMileage: isMileage || undefined,
          mileageDistance: isMileage && mileageDistance > 0 ? mileageDistance : undefined,
          mileageRate: isMileage && mileageRate > 0 ? mileageRate : undefined,
          receiptUrl: receiptUrl || undefined,
          receiptFileName: receiptFileName || undefined,
          isRecurring: isRecurring || undefined,
          recurringFrequency: isRecurring ? (recurringFrequency as RecurringFrequency) || undefined : undefined,
          recurringEndDate: isRecurring && recurringEndDate ? recurringEndDate : undefined,
          lineItems: splitLineItemsPayload,
        },
        token
      );
      onCreated();
      handleClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError("");
    setExpenseNumber("");
    setExpenseDate(todayStr());
    setExpenseAccountId("");
    setAmount(0);
    setDescription("");
    setReferenceNumber("");
    setNotes("");
    setVendorId("");
    setCategoryId("");
    setPaymentMethod("");
    setPaymentAccountId("");
    setTaxPercent(0);
    setIsTaxDeductible(false);
    setIsBillable(false);
    setBillableCustomerId("");
    setMarkupPercent(0);
    setIsReimbursable(false);
    setIsMileage(false);
    setMileageDistance(0);
    setMileageRate(0.655);
    setReceiptUrl("");
    setReceiptFileName("");
    setIsRecurring(false);
    setRecurringFrequency("");
    setRecurringEndDate("");
    setIsSplit(false);
    setLineItems([
      { key: generateKey(), expenseAccountId: "", description: "", amount: 0, taxPercent: 0 },
      { key: generateKey(), expenseAccountId: "", description: "", amount: 0, taxPercent: 0 },
    ]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-4xl p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          New Expense
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Record a new expense entry
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Expense Number</Label>
            <Input
              type="text"
              value={expenseNumber}
              onChange={(e) => setExpenseNumber(e.target.value)}
              placeholder="Auto-generated"
            />
          </div>
          <div>
            <Label>
              Expense Date <span className="text-error-500">*</span>
            </Label>
            <Input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />
          </div>
          <div>
            <Label>Reference Number</Label>
            <Input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. receipt #"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>
              Expense Account <span className="text-error-500">*</span>
            </Label>
            <select
              value={expenseAccountId}
              onChange={(e) => setExpenseAccountId(e.target.value)}
              className={selectClasses}
            >
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountNumber} — {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Vendor</Label>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className={selectClasses}
            >
              <option value="">None</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.displayName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Category</Label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={selectClasses}
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label>Description</Label>
          <TextArea
            value={description}
            onChange={(val) => setDescription(val)}
            placeholder="What is this expense for?"
            rows={2}
          />
        </div>

        {/* Amount Section */}
        {!isMileage && !isSplit && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label>
                Amount <span className="text-error-500">*</span>
              </Label>
              <Input
                type="number"
                value={amount.toString()}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                step={0.01}
                min="0"
              />
            </div>
            <div>
              <Label>Tax %</Label>
              <Input
                type="number"
                value={taxPercent.toString()}
                onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                step={0.01}
                min="0"
                max="100"
              />
            </div>
            <div className="flex items-end">
              <div className="rounded-lg bg-gray-50 px-4 py-2.5 dark:bg-gray-800/40">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Payment Method</Label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={selectClasses}
            >
              <option value="">Select method</option>
              <option value="CASH">Cash</option>
              <option value="CHECK">Check</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <Label>Payment Account</Label>
            <select
              value={paymentAccountId}
              onChange={(e) => setPaymentAccountId(e.target.value)}
              className={selectClasses}
            >
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountNumber} — {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Options
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Tax Deductible", checked: isTaxDeductible, set: setIsTaxDeductible },
              { label: "Billable", checked: isBillable, set: setIsBillable },
              { label: "Reimbursable", checked: isReimbursable, set: setIsReimbursable },
              { label: "Mileage", checked: isMileage, set: setIsMileage },
              { label: "Recurring", checked: isRecurring, set: setIsRecurring },
              { label: "Split", checked: isSplit, set: setIsSplit },
            ].map((toggle) => (
              <label
                key={toggle.label}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  toggle.checked
                    ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-900/20 dark:text-brand-300"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <input
                  type="checkbox"
                  checked={toggle.checked}
                  onChange={(e) => toggle.set(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                {toggle.label}
              </label>
            ))}
          </div>
        </div>

        {/* Billable Section */}
        {isBillable && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4 dark:border-blue-800 dark:bg-blue-900/10">
            <h4 className="mb-3 text-sm font-semibold text-blue-700 dark:text-blue-300">
              Billable Details
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Customer</Label>
                <select
                  value={billableCustomerId}
                  onChange={(e) => setBillableCustomerId(e.target.value)}
                  className={selectClasses}
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Markup %</Label>
                <Input
                  type="number"
                  value={markupPercent.toString()}
                  onChange={(e) => setMarkupPercent(parseFloat(e.target.value) || 0)}
                  step={0.01}
                  min="0"
                />
                {markedUpAmount !== null && (
                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                    Billable amount: {formatCurrency(markedUpAmount)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mileage Section */}
        {isMileage && (
          <div className="rounded-xl border border-orange-200 bg-orange-50/30 p-4 dark:border-orange-800 dark:bg-orange-900/10">
            <h4 className="mb-3 text-sm font-semibold text-orange-700 dark:text-orange-300">
              Mileage Details
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label>Distance (miles)</Label>
                <Input
                  type="number"
                  value={mileageDistance.toString()}
                  onChange={(e) => setMileageDistance(parseFloat(e.target.value) || 0)}
                  step={0.1}
                  min="0"
                />
              </div>
              <div>
                <Label>Rate ($/mile)</Label>
                <Input
                  type="number"
                  value={mileageRate.toString()}
                  onChange={(e) => setMileageRate(parseFloat(e.target.value) || 0)}
                  step={0.001}
                  min="0"
                />
              </div>
              <div className="flex items-end">
                <div className="rounded-lg bg-orange-50 px-4 py-2.5 dark:bg-orange-900/20">
                  <p className="text-xs text-orange-500 dark:text-orange-400">
                    Calculated Amount
                  </p>
                  <p className="text-lg font-bold text-orange-700 dark:text-orange-200">
                    {formatCurrency(computedAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recurring Section */}
        {isRecurring && (
          <div className="rounded-xl border border-teal-200 bg-teal-50/30 p-4 dark:border-teal-800 dark:bg-teal-900/10">
            <h4 className="mb-3 text-sm font-semibold text-teal-700 dark:text-teal-300">
              Recurring Schedule
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Frequency</Label>
                <select
                  value={recurringFrequency}
                  onChange={(e) => setRecurringFrequency(e.target.value)}
                  className={selectClasses}
                >
                  <option value="">Select frequency</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="BIWEEKLY">Bi-Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={recurringEndDate}
                  onChange={(e) => setRecurringEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Split Line Items */}
        {isSplit && (
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Split Line Items
              </h4>
              <Button variant="outline" size="sm" onClick={addLineItem}>
                + Add Line
              </Button>
            </div>
            <div className="space-y-3">
              {lineItems.map((li, idx) => (
                <div
                  key={li.key}
                  className="grid grid-cols-12 items-end gap-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/30"
                >
                  <div className="col-span-4">
                    <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                      Account
                    </label>
                    <select
                      value={li.expenseAccountId}
                      onChange={(e) =>
                        updateLineItem(li.key, "expenseAccountId", e.target.value)
                      }
                      className="h-9 w-full appearance-none rounded-lg border border-gray-300 px-2 text-xs shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    >
                      <option value="">Select</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.accountNumber} — {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                      Description
                    </label>
                    <input
                      type="text"
                      value={li.description}
                      onChange={(e) =>
                        updateLineItem(li.key, "description", e.target.value)
                      }
                      className="h-9 w-full rounded-lg border border-gray-300 px-2 text-xs shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                      placeholder="Description"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={li.amount || ""}
                      onChange={(e) =>
                        updateLineItem(li.key, "amount", parseFloat(e.target.value) || 0)
                      }
                      step={0.01}
                      min={0}
                      className="h-9 w-full rounded-lg border border-gray-300 px-2 text-xs text-right tabular-nums shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                      Tax %
                    </label>
                    <input
                      type="number"
                      value={li.taxPercent || ""}
                      onChange={(e) =>
                        updateLineItem(li.key, "taxPercent", parseFloat(e.target.value) || 0)
                      }
                      step={0.01}
                      min={0}
                      className="h-9 w-full rounded-lg border border-gray-300 px-2 text-xs text-right tabular-nums shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeLineItem(li.key)}
                      disabled={lineItems.length <= 2}
                      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      title={idx < 2 ? "Minimum 2 lines" : "Remove"}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M2 4H14M5.333 4V2.667C5.333 2.313 5.474 1.974 5.724 1.724C5.974 1.474 6.313 1.333 6.667 1.333H9.333C9.687 1.333 10.026 1.474 10.276 1.724C10.526 1.974 10.667 2.313 10.667 2.667V4M12.667 4V13.333C12.667 13.687 12.526 14.026 12.276 14.276C12.026 14.526 11.687 14.667 11.333 14.667H4.667C4.313 14.667 3.974 14.526 3.724 14.276C3.474 14.026 3.333 13.687 3.333 13.333V4H12.667Z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <div className="rounded-lg bg-gray-50 px-4 py-2 dark:bg-gray-800/40">
                <p className="text-xs text-gray-500 dark:text-gray-400">Split Total</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Receipt */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Receipt URL</Label>
            <Input
              type="url"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label>Receipt File Name</Label>
            <Input
              type="text"
              value={receiptFileName}
              onChange={(e) => setReceiptFileName(e.target.value)}
              placeholder="receipt.pdf"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label>Notes</Label>
          <TextArea
            value={notes}
            onChange={(val) => setNotes(val)}
            placeholder="Additional notes..."
            rows={2}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
        <Button variant="outline" size="sm" onClick={handleClose}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Creating..." : "Create Expense"}
        </Button>
      </div>
    </Modal>
  );
};

export default CreateExpenseModal;
