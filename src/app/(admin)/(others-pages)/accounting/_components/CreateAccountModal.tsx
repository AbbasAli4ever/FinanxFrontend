"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Checkbox from "@/components/form/input/Checkbox";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import accountsService from "@/services/accountsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { Account, AccountTypesData } from "@/types/accounts";

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (account: Account) => void;
}

const selectClasses =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { token } = useAuth();

  const [accountTypes, setAccountTypes] = useState<AccountTypesData | null>(
    null
  );
  const [parentAccounts, setParentAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    accountType: "",
    detailType: "",
    accountNumber: "",
    description: "",
    parentAccountId: "",
    isSubAccount: false,
  });

  // Load account types on mount
  useEffect(() => {
    if (!isOpen || !token) return;

    const loadTypes = async () => {
      try {
        const data = await accountsService.getAccountTypes(token);
        setAccountTypes(data);
      } catch {
        setError("Failed to load account types");
      }
    };
    loadTypes();
  }, [isOpen, token]);

  // Load parent accounts when isSubAccount is checked and accountType is selected
  const loadParentAccounts = useCallback(async () => {
    if (!token || !form.isSubAccount || !form.accountType) {
      setParentAccounts([]);
      return;
    }

    try {
      const accounts = await accountsService.getAccounts(
        { accountType: form.accountType },
        token
      );
      setParentAccounts(accounts);
    } catch {
      setParentAccounts([]);
    }
  }, [token, form.isSubAccount, form.accountType]);

  useEffect(() => {
    loadParentAccounts();
  }, [loadParentAccounts]);

  // Get detail types for selected account type
  const getDetailTypes = (): string[] => {
    if (!accountTypes || !form.accountType) return [];
    const type = accountTypes.all.find((t) => t.value === form.accountType);
    return type?.detailTypes || [];
  };

  // Get suggested number range
  const getNumberRange = (): string => {
    if (!accountTypes || !form.accountType) return "";
    const type = accountTypes.all.find((t) => t.value === form.accountType);
    return type?.numberRange || "";
  };

  const resetForm = () => {
    setForm({
      name: "",
      accountType: "",
      detailType: "",
      accountNumber: "",
      description: "",
      parentAccountId: "",
      isSubAccount: false,
    });
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError("");
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        accountType: form.accountType,
        detailType: form.detailType,
      };

      if (form.accountNumber) payload.accountNumber = form.accountNumber;
      if (form.description) payload.description = form.description;
      if (form.isSubAccount && form.parentAccountId) {
        payload.parentAccountId = form.parentAccountId;
        payload.isSubAccount = true;
      }

      const account = await accountsService.createAccount(
        payload as {
          name: string;
          accountType: string;
          detailType: string;
          accountNumber?: string;
          description?: string;
          parentAccountId?: string;
          isSubAccount?: boolean;
        },
        token
      );

      onCreated(account);
      handleClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-lg p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Create New Account
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Add a new account to your chart of accounts.
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Account Type — Grouped dropdown */}
        <div>
          <Label htmlFor="accountType">
            Account Type <span className="text-error-500">*</span>
          </Label>
          <select
            id="accountType"
            value={form.accountType}
            onChange={(e) =>
              setForm({
                ...form,
                accountType: e.target.value,
                detailType: "",
                parentAccountId: "",
              })
            }
            required
            className={`${selectClasses} ${
              form.accountType
                ? "text-gray-800 dark:text-white/90"
                : "text-gray-400 dark:text-gray-400"
            }`}
          >
            <option value="">Select Account Type</option>
            {accountTypes?.groups.map((group) => (
              <optgroup
                key={group}
                label={group}
                className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
              >
                {accountTypes.grouped[group]?.map((type) => (
                  <option
                    key={type.value}
                    value={type.value}
                    className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                  >
                    {type.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Detail Type — Cascading based on Account Type */}
        <div>
          <Label htmlFor="detailType">
            Detail Type <span className="text-error-500">*</span>
          </Label>
          <select
            id="detailType"
            value={form.detailType}
            onChange={(e) => setForm({ ...form, detailType: e.target.value })}
            required
            disabled={!form.accountType}
            className={`${selectClasses} ${
              !form.accountType ? "cursor-not-allowed opacity-50" : ""
            } ${
              form.detailType
                ? "text-gray-800 dark:text-white/90"
                : "text-gray-400 dark:text-gray-400"
            }`}
          >
            <option value="">Select Detail Type</option>
            {getDetailTypes().map((dt) => (
              <option
                key={dt}
                value={dt}
                className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
              >
                {dt}
              </option>
            ))}
          </select>
        </div>

        {/* Account Name */}
        <div>
          <Label htmlFor="accountName">
            Account Name <span className="text-error-500">*</span>
          </Label>
          <Input
            id="accountName"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Office Equipment"
          />
        </div>

        {/* Account Number */}
        <div>
          <Label htmlFor="accountNumber">Account Number</Label>
          <Input
            id="accountNumber"
            type="text"
            value={form.accountNumber}
            onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
            placeholder="e.g. 1520"
            hint={
              getNumberRange()
                ? `Suggested range: ${getNumberRange()}`
                : undefined
            }
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <TextArea
            value={form.description}
            onChange={(val) => setForm({ ...form, description: val })}
            placeholder="Optional description"
            rows={2}
          />
        </div>

        {/* Sub-account checkbox */}
        <div>
          <Checkbox
            label="Make this a sub-account"
            checked={form.isSubAccount}
            onChange={(checked) =>
              setForm({ ...form, isSubAccount: checked, parentAccountId: "" })
            }
            disabled={!form.accountType}
          />
        </div>

        {/* Parent Account — only shown when isSubAccount is checked */}
        {form.isSubAccount && (
          <div>
            <Label htmlFor="parentAccount">
              Parent Account <span className="text-error-500">*</span>
            </Label>
            <select
              id="parentAccount"
              value={form.parentAccountId}
              onChange={(e) =>
                setForm({ ...form, parentAccountId: e.target.value })
              }
              required
              className={`${selectClasses} ${
                form.parentAccountId
                  ? "text-gray-800 dark:text-white/90"
                  : "text-gray-400 dark:text-gray-400"
              }`}
            >
              <option value="">Select Parent Account</option>
              {parentAccounts.map((acc) => (
                <option
                  key={acc.id}
                  value={acc.id}
                  className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                >
                  {acc.accountNumber ? `${acc.accountNumber} — ` : ""}
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Creating..." : "Save Account"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateAccountModal;
