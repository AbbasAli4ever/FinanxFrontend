"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Switch from "@/components/form/switch/Switch";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import productsService from "@/services/productsService";
import categoriesService from "@/services/categoriesService";
import unitsOfMeasureService from "@/services/unitsOfMeasureService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { Product, ProductType, ProductTypeInfo, CreateProductRequest } from "@/types/products";
import type { Category } from "@/types/categories";
import type { UnitOfMeasure } from "@/types/unitsOfMeasure";

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (product: Product) => void;
  vendors: { id: string; displayName: string }[];
  accounts: { id: string; name: string; accountNumber: string }[];
}

const selectClasses =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

function flattenCategories(
  categories: Category[],
  prefix = ""
): { id: string; label: string }[] {
  const result: { id: string; label: string }[] = [];
  for (const cat of categories) {
    const label = prefix ? `${prefix} > ${cat.name}` : cat.name;
    result.push({ id: cat.id, label });
    if (cat.children && cat.children.length > 0) {
      result.push(...flattenCategories(cat.children, label));
    }
  }
  return result;
}

const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  vendors,
  accounts,
}) => {
  const { token } = useAuth();

  // Step management
  const [step, setStep] = useState<"type" | "form">("type");
  const [selectedType, setSelectedType] = useState<ProductType | null>(null);
  const [productTypes, setProductTypes] = useState<ProductTypeInfo[]>([]);

  // Reference data
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [uoms, setUoms] = useState<UnitOfMeasure[]>([]);

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    categoryId: "",
    salesDescription: "",
    purchaseDescription: "",
    salesPrice: "",
    purchaseCost: "",
    unitOfMeasureId: "",
    incomeAccountId: "",
    expenseAccountId: "",
    inventoryAssetAccountId: "",
    taxable: false,
    taxRate: "",
    quantityOnHand: "",
    reorderPoint: "",
    reorderQuantity: "",
    preferredVendorId: "",
    imageUrl: "",
  });

  // Bundle items
  const [bundleItems, setBundleItems] = useState<
    { productId: string; quantity: number; name: string }[]
  >([]);
  const [bundleSearch, setBundleSearch] = useState("");
  const [bundleSearchResults, setBundleSearchResults] = useState<
    { id: string; name: string; sku: string | null; type: string }[]
  >([]);

  // Load reference data when modal opens
  useEffect(() => {
    if (!isOpen || !token) return;

    const loadData = async () => {
      try {
        const [types, cats, units] = await Promise.all([
          productsService.getProductTypes(token),
          categoriesService.getCategories(token).catch(() => []),
          unitsOfMeasureService.getUnitsOfMeasure(token).catch(() => []),
        ]);
        setProductTypes(types);
        setCategories(flattenCategories(cats));
        setUoms(units);
      } catch {
        // Types are essential, rest are optional
      }
    };
    loadData();
  }, [isOpen, token]);

  // Derived flags
  const isInventory = selectedType === "INVENTORY";
  const isBundle = selectedType === "BUNDLE";
  const isService = selectedType === "SERVICE";
  const showPurchaseCost = !isService;
  const showBarcode = !isService;
  const showInventoryFields = isInventory;
  const showPreferredVendor = isInventory;

  const resetForm = () => {
    setStep("type");
    setSelectedType(null);
    setForm({
      name: "",
      sku: "",
      barcode: "",
      categoryId: "",
      salesDescription: "",
      purchaseDescription: "",
      salesPrice: "",
      purchaseCost: "",
      unitOfMeasureId: "",
      incomeAccountId: "",
      expenseAccountId: "",
      inventoryAssetAccountId: "",
      taxable: false,
      taxRate: "",
      quantityOnHand: "",
      reorderPoint: "",
      reorderQuantity: "",
      preferredVendorId: "",
      imageUrl: "",
    });
    setBundleItems([]);
    setBundleSearch("");
    setBundleSearchResults([]);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleTypeSelect = (type: ProductType) => {
    setSelectedType(type);
    setStep("form");
  };

  // Bundle search
  const handleBundleSearch = async (query: string) => {
    setBundleSearch(query);
    if (!token || query.length < 2) {
      setBundleSearchResults([]);
      return;
    }
    try {
      const res = await productsService.getProducts(
        { search: query, isActive: "true", limit: "10" },
        token
      );
      // Filter out bundles (can't nest bundles)
      setBundleSearchResults(
        res.items
          .filter((p) => p.type !== "BUNDLE")
          .map((p) => ({ id: p.id, name: p.name, sku: p.sku, type: p.type }))
      );
    } catch {
      setBundleSearchResults([]);
    }
  };

  const addBundleItem = (item: { id: string; name: string }) => {
    if (bundleItems.some((b) => b.productId === item.id)) return;
    setBundleItems((prev) => [
      ...prev,
      { productId: item.id, quantity: 1, name: item.name },
    ]);
    setBundleSearch("");
    setBundleSearchResults([]);
  };

  const removeBundleItem = (productId: string) => {
    setBundleItems((prev) => prev.filter((b) => b.productId !== productId));
  };

  const updateBundleItemQty = (productId: string, qty: number) => {
    setBundleItems((prev) =>
      prev.map((b) =>
        b.productId === productId ? { ...b, quantity: Math.max(1, qty) } : b
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedType) return;

    setError("");
    setLoading(true);

    try {
      const body: CreateProductRequest = {
        type: selectedType,
        name: form.name,
      };

      if (form.sku) body.sku = form.sku;
      if (form.barcode && showBarcode) body.barcode = form.barcode;
      if (form.categoryId) body.categoryId = form.categoryId;
      if (form.salesDescription) body.salesDescription = form.salesDescription;
      if (form.purchaseDescription && showPurchaseCost)
        body.purchaseDescription = form.purchaseDescription;
      if (form.salesPrice) body.salesPrice = parseFloat(form.salesPrice);
      if (form.purchaseCost && showPurchaseCost)
        body.purchaseCost = parseFloat(form.purchaseCost);
      if (form.unitOfMeasureId) body.unitOfMeasureId = form.unitOfMeasureId;
      if (form.incomeAccountId) body.incomeAccountId = form.incomeAccountId;
      if (form.expenseAccountId) body.expenseAccountId = form.expenseAccountId;
      if (form.inventoryAssetAccountId && showInventoryFields)
        body.inventoryAssetAccountId = form.inventoryAssetAccountId;
      body.taxable = form.taxable;
      if (form.taxable && form.taxRate) body.taxRate = parseFloat(form.taxRate);
      if (showInventoryFields) {
        if (form.quantityOnHand)
          body.quantityOnHand = parseInt(form.quantityOnHand, 10);
        if (form.reorderPoint)
          body.reorderPoint = parseInt(form.reorderPoint, 10);
        if (form.reorderQuantity)
          body.reorderQuantity = parseInt(form.reorderQuantity, 10);
      }
      if (showPreferredVendor && form.preferredVendorId)
        body.preferredVendorId = form.preferredVendorId;
      if (form.imageUrl) body.imageUrl = form.imageUrl;
      if (isBundle && bundleItems.length > 0) {
        body.bundleItems = bundleItems.map((b) => ({
          productId: b.productId,
          quantity: b.quantity,
        }));
      }

      const product = await productsService.createProduct(body, token);
      onCreated(product);
      handleClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-2xl p-6 lg:p-8"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {step === "type" ? "Select Product Type" : `New ${productTypes.find((t) => t.type === selectedType)?.label || "Product"}`}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {step === "type"
            ? "Choose the type of product or service you want to add."
            : "Fill in the product details below."}
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      {/* Step 1: Type Selection Cards */}
      {step === "type" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {productTypes.map((pt) => (
              <button
                key={pt.type}
                type="button"
                onClick={() => handleTypeSelect(pt.type)}
                className="rounded-xl border border-gray-200 p-4 text-left transition hover:border-brand-300 hover:bg-brand-50/50 dark:border-gray-700 dark:hover:border-brand-700 dark:hover:bg-brand-900/10"
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {pt.label}
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {pt.description}
                </p>
              </button>
            ))}
          </div>
          <div className="flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Product Form */}
      {step === "form" && (
        <form
          onSubmit={handleSubmit}
          className="max-h-[70vh] space-y-6 overflow-y-auto pr-1"
        >
          {/* Basic Info */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white/90">
              Basic Info
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="prodName">
                  Name <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="prodName"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Product name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="prodSku">SKU</Label>
                  <Input
                    id="prodSku"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="e.g. IPHONE-15"
                  />
                </div>
                {showBarcode && (
                  <div>
                    <Label htmlFor="prodBarcode">Barcode</Label>
                    <Input
                      id="prodBarcode"
                      value={form.barcode}
                      onChange={(e) =>
                        setForm({ ...form, barcode: e.target.value })
                      }
                      placeholder="e.g. 1234567890123"
                    />
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="prodCategory">Category</Label>
                <select
                  id="prodCategory"
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                  className={`${selectClasses} ${form.categoryId ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="prodImage">Image URL</Label>
                <Input
                  id="prodImage"
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm({ ...form, imageUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white/90">
              Pricing
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="prodSalesPrice">Sales Price</Label>
                <Input
                  id="prodSalesPrice"
                  type="number"
                  value={form.salesPrice}
                  onChange={(e) =>
                    setForm({ ...form, salesPrice: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              {showPurchaseCost && (
                <div>
                  <Label htmlFor="prodPurchaseCost">Purchase Cost</Label>
                  <Input
                    id="prodPurchaseCost"
                    type="number"
                    value={form.purchaseCost}
                    onChange={(e) =>
                      setForm({ ...form, purchaseCost: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
            <div className="mt-3">
              <Label htmlFor="prodUom">Unit of Measure</Label>
              <select
                id="prodUom"
                value={form.unitOfMeasureId}
                onChange={(e) =>
                  setForm({ ...form, unitOfMeasureId: e.target.value })
                }
                className={`${selectClasses} ${form.unitOfMeasureId ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}
              >
                <option value="">Select unit</option>
                {uoms.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.abbreviation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Inventory Fields (INVENTORY only) */}
          {showInventoryFields && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white/90">
                Inventory
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="prodQty">Qty on Hand</Label>
                    <Input
                      id="prodQty"
                      type="number"
                      value={form.quantityOnHand}
                      onChange={(e) =>
                        setForm({ ...form, quantityOnHand: e.target.value })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prodReorderPt">Reorder Point</Label>
                    <Input
                      id="prodReorderPt"
                      type="number"
                      value={form.reorderPoint}
                      onChange={(e) =>
                        setForm({ ...form, reorderPoint: e.target.value })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prodReorderQty">Reorder Qty</Label>
                    <Input
                      id="prodReorderQty"
                      type="number"
                      value={form.reorderQuantity}
                      onChange={(e) =>
                        setForm({ ...form, reorderQuantity: e.target.value })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
                {showPreferredVendor && (
                  <div>
                    <Label htmlFor="prodVendor">Preferred Vendor</Label>
                    <select
                      id="prodVendor"
                      value={form.preferredVendorId}
                      onChange={(e) =>
                        setForm({ ...form, preferredVendorId: e.target.value })
                      }
                      className={`${selectClasses} ${form.preferredVendorId ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}
                    >
                      <option value="">Select vendor</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <Label htmlFor="prodAssetAccount">Inventory Asset Account</Label>
                  <select
                    id="prodAssetAccount"
                    value={form.inventoryAssetAccountId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        inventoryAssetAccountId: e.target.value,
                      })
                    }
                    className={`${selectClasses} ${form.inventoryAssetAccountId ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}
                  >
                    <option value="">Auto-assign (Inventory Asset)</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountNumber} - {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Bundle Items (BUNDLE only) */}
          {isBundle && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white/90">
                Bundle Items
              </h3>
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    value={bundleSearch}
                    onChange={(e) => handleBundleSearch(e.target.value)}
                    placeholder="Search products to add..."
                  />
                  {bundleSearchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                      {bundleSearchResults.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => addBundleItem(item)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <span className="text-gray-900 dark:text-white/90">
                            {item.name}
                          </span>
                          {item.sku && (
                            <span className="text-xs text-gray-400">
                              ({item.sku})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {bundleItems.length > 0 && (
                  <div className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    {bundleItems.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center gap-3"
                      >
                        <span className="flex-1 text-sm text-gray-900 dark:text-white/90">
                          {item.name}
                        </span>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateBundleItemQty(
                              item.productId,
                              parseInt(e.target.value, 10) || 1
                            )
                          }
                          className="h-8 w-16 rounded border border-gray-300 px-2 text-center text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white/90"
                        />
                        <button
                          type="button"
                          onClick={() => removeBundleItem(item.productId)}
                          className="rounded p-1 text-gray-400 hover:text-red-500"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {bundleItems.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Search and add at least one product to the bundle.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tax & Accounts */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white/90">
              Tax & Accounts
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch
                  label="Taxable"
                  defaultChecked={form.taxable}
                  onChange={(checked) => setForm({ ...form, taxable: checked })}
                />
              </div>
              {form.taxable && (
                <div className="w-40">
                  <Label htmlFor="prodTaxRate">Tax Rate (%)</Label>
                  <Input
                    id="prodTaxRate"
                    type="number"
                    value={form.taxRate}
                    onChange={(e) =>
                      setForm({ ...form, taxRate: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="prodIncomeAcct">Income Account</Label>
                  <select
                    id="prodIncomeAcct"
                    value={form.incomeAccountId}
                    onChange={(e) =>
                      setForm({ ...form, incomeAccountId: e.target.value })
                    }
                    className={`${selectClasses} ${form.incomeAccountId ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}
                  >
                    <option value="">Auto-assign</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountNumber} - {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                {showPurchaseCost && (
                  <div>
                    <Label htmlFor="prodExpenseAcct">Expense Account</Label>
                    <select
                      id="prodExpenseAcct"
                      value={form.expenseAccountId}
                      onChange={(e) =>
                        setForm({ ...form, expenseAccountId: e.target.value })
                      }
                      className={`${selectClasses} ${form.expenseAccountId ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}
                    >
                      <option value="">Auto-assign</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.accountNumber} - {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Descriptions */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white/90">
              Descriptions
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="prodSalesDesc">Sales Description</Label>
                <TextArea
                  value={form.salesDescription}
                  onChange={(val) =>
                    setForm({ ...form, salesDescription: val })
                  }
                  placeholder="Description shown on invoices"
                  rows={2}
                />
              </div>
              {showPurchaseCost && (
                <div>
                  <Label htmlFor="prodPurchaseDesc">Purchase Description</Label>
                  <TextArea
                    value={form.purchaseDescription}
                    onChange={(val) =>
                      setForm({ ...form, purchaseDescription: val })
                    }
                    placeholder="Description shown on purchase orders"
                    rows={2}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep("type")}
            >
              Back
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? "Creating..." : "Save Product"}
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default CreateProductModal;
