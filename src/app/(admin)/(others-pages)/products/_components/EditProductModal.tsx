"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Switch from "@/components/form/switch/Switch";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import { useAuth } from "@/context/AuthContext";
import productsService from "@/services/productsService";
import categoriesService from "@/services/categoriesService";
import unitsOfMeasureService from "@/services/unitsOfMeasureService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { Product, UpdateProductRequest } from "@/types/products";
import type { Category } from "@/types/categories";
import type { UnitOfMeasure } from "@/types/unitsOfMeasure";

interface EditProductModalProps {
  isOpen: boolean;
  productId: string | null;
  onClose: () => void;
  onUpdated: () => void;
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

const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  productId,
  onClose,
  onUpdated,
  vendors,
  accounts,
}) => {
  const { token } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [uoms, setUoms] = useState<UnitOfMeasure[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
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
    reorderPoint: "",
    reorderQuantity: "",
    preferredVendorId: "",
    imageUrl: "",
    isActive: true,
  });

  // Bundle items for editing
  const [bundleItems, setBundleItems] = useState<
    { productId: string; quantity: number; name: string }[]
  >([]);
  const [bundleSearch, setBundleSearch] = useState("");
  const [bundleSearchResults, setBundleSearchResults] = useState<
    { id: string; name: string; sku: string | null; type: string }[]
  >([]);

  // Load product + reference data
  useEffect(() => {
    if (!isOpen || !token || !productId) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const [prod, cats, units] = await Promise.all([
          productsService.getProduct(productId, token),
          categoriesService.getCategories(token).catch(() => []),
          unitsOfMeasureService.getUnitsOfMeasure(token).catch(() => []),
        ]);
        setProduct(prod);
        setCategories(flattenCategories(cats));
        setUoms(units);

        setForm({
          name: prod.name,
          sku: prod.sku || "",
          barcode: prod.barcode || "",
          categoryId: prod.category?.id || "",
          salesDescription: prod.salesDescription || "",
          purchaseDescription: prod.purchaseDescription || "",
          salesPrice: prod.salesPrice?.toString() || "",
          purchaseCost: prod.purchaseCost?.toString() || "",
          unitOfMeasureId: prod.unitOfMeasure?.id || "",
          incomeAccountId: prod.incomeAccount?.id || "",
          expenseAccountId: prod.expenseAccount?.id || "",
          inventoryAssetAccountId: prod.inventoryAssetAccount?.id || "",
          taxable: prod.taxable,
          taxRate: prod.taxRate?.toString() || "",
          reorderPoint: prod.reorderPoint?.toString() || "",
          reorderQuantity: prod.reorderQuantity?.toString() || "",
          preferredVendorId: prod.preferredVendor?.id || "",
          imageUrl: prod.imageUrl || "",
          isActive: prod.isActive,
        });

        if (prod.type === "BUNDLE" && prod.bundleItems) {
          setBundleItems(
            prod.bundleItems.map((b) => ({
              productId: b.product.id,
              quantity: b.quantity,
              name: b.product.name,
            }))
          );
        }
      } catch (err) {
        setError(formatApiErrorMessage(err));
      } finally {
        setFetching(false);
      }
    };
    loadData();
  }, [isOpen, token, productId]);

  if (!product) {
    // Derived flags can't be computed without product
  }
  const isInventory = product?.type === "INVENTORY";
  const isBundle = product?.type === "BUNDLE";
  const isService = product?.type === "SERVICE";
  const showPurchaseCost = !isService;
  const showBarcode = !isService;
  const showInventoryFields = isInventory;
  const showPreferredVendor = isInventory;

  const handleClose = () => {
    setProduct(null);
    setError("");
    setBundleItems([]);
    setBundleSearch("");
    setBundleSearchResults([]);
    onClose();
  };

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
      setBundleSearchResults(
        res.items
          .filter((p) => p.type !== "BUNDLE" && p.id !== productId)
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

  const removeBundleItem = (pid: string) => {
    setBundleItems((prev) => prev.filter((b) => b.productId !== pid));
  };

  const updateBundleItemQty = (pid: string, qty: number) => {
    setBundleItems((prev) =>
      prev.map((b) =>
        b.productId === pid ? { ...b, quantity: Math.max(1, qty) } : b
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !productId || !product) return;

    setError("");
    setLoading(true);

    try {
      const body: UpdateProductRequest = {};

      if (form.name !== product.name) body.name = form.name;
      if (form.sku !== (product.sku || "")) body.sku = form.sku;
      if (showBarcode && form.barcode !== (product.barcode || ""))
        body.barcode = form.barcode;
      if (form.categoryId !== (product.category?.id || ""))
        body.categoryId = form.categoryId || undefined;
      if (form.salesDescription !== (product.salesDescription || ""))
        body.salesDescription = form.salesDescription;
      if (showPurchaseCost && form.purchaseDescription !== (product.purchaseDescription || ""))
        body.purchaseDescription = form.purchaseDescription;
      if (form.salesPrice !== (product.salesPrice?.toString() || ""))
        body.salesPrice = form.salesPrice ? parseFloat(form.salesPrice) : undefined;
      if (showPurchaseCost && form.purchaseCost !== (product.purchaseCost?.toString() || ""))
        body.purchaseCost = form.purchaseCost ? parseFloat(form.purchaseCost) : undefined;
      if (form.unitOfMeasureId !== (product.unitOfMeasure?.id || ""))
        body.unitOfMeasureId = form.unitOfMeasureId || undefined;
      if (form.incomeAccountId !== (product.incomeAccount?.id || ""))
        body.incomeAccountId = form.incomeAccountId || undefined;
      if (showPurchaseCost && form.expenseAccountId !== (product.expenseAccount?.id || ""))
        body.expenseAccountId = form.expenseAccountId || undefined;
      if (showInventoryFields && form.inventoryAssetAccountId !== (product.inventoryAssetAccount?.id || ""))
        body.inventoryAssetAccountId = form.inventoryAssetAccountId || undefined;
      if (form.taxable !== product.taxable) body.taxable = form.taxable;
      if (form.taxRate !== (product.taxRate?.toString() || ""))
        body.taxRate = form.taxRate ? parseFloat(form.taxRate) : undefined;
      if (showInventoryFields) {
        if (form.reorderPoint !== (product.reorderPoint?.toString() || ""))
          body.reorderPoint = form.reorderPoint
            ? parseInt(form.reorderPoint, 10)
            : undefined;
        if (form.reorderQuantity !== (product.reorderQuantity?.toString() || ""))
          body.reorderQuantity = form.reorderQuantity
            ? parseInt(form.reorderQuantity, 10)
            : undefined;
      }
      if (showPreferredVendor && form.preferredVendorId !== (product.preferredVendor?.id || ""))
        body.preferredVendorId = form.preferredVendorId || undefined;
      if (form.imageUrl !== (product.imageUrl || ""))
        body.imageUrl = form.imageUrl || undefined;
      if (form.isActive !== product.isActive) body.isActive = form.isActive;

      if (isBundle) {
        body.bundleItems = bundleItems.map((b) => ({
          productId: b.productId,
          quantity: b.quantity,
        }));
      }

      await productsService.updateProduct(productId, body, token);
      onUpdated();
      handleClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const typeLabel: Record<string, string> = {
    INVENTORY: "Inventory",
    NON_INVENTORY: "Non-Inventory",
    SERVICE: "Service",
    BUNDLE: "Bundle",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-2xl p-6 lg:p-8"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Edit Product
        </h2>
        {product && (
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Type:
            </p>
            <Badge size="sm" color="primary" variant="light">
              {typeLabel[product.type] || product.type}
            </Badge>
            <p className="text-xs text-gray-400">(cannot be changed)</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      {fetching ? (
        <div className="flex items-center justify-center gap-2 py-12">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Loading product...
          </span>
        </div>
      ) : product ? (
        <form
          onSubmit={handleSubmit}
          className="max-h-[70vh] space-y-6 overflow-y-auto pr-1"
        >
          {/* Active/Inactive */}
          <div className="flex items-center gap-3">
            <Switch
              label={form.isActive ? "Active" : "Inactive"}
              defaultChecked={form.isActive}
              onChange={(checked) => setForm({ ...form, isActive: checked })}
            />
          </div>

          {/* Basic Info */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white/90">
              Basic Info
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="editProdName">
                  Name <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="editProdName"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="editProdSku">SKU</Label>
                  <Input
                    id="editProdSku"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  />
                </div>
                {showBarcode && (
                  <div>
                    <Label htmlFor="editProdBarcode">Barcode</Label>
                    <Input
                      id="editProdBarcode"
                      value={form.barcode}
                      onChange={(e) =>
                        setForm({ ...form, barcode: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="editProdCategory">Category</Label>
                <select
                  id="editProdCategory"
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
                <Label htmlFor="editProdImage">Image URL</Label>
                <Input
                  id="editProdImage"
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm({ ...form, imageUrl: e.target.value })
                  }
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
                <Label htmlFor="editProdPrice">Sales Price</Label>
                <Input
                  id="editProdPrice"
                  type="number"
                  value={form.salesPrice}
                  onChange={(e) =>
                    setForm({ ...form, salesPrice: e.target.value })
                  }
                />
              </div>
              {showPurchaseCost && (
                <div>
                  <Label htmlFor="editProdCost">Purchase Cost</Label>
                  <Input
                    id="editProdCost"
                    type="number"
                    value={form.purchaseCost}
                    onChange={(e) =>
                      setForm({ ...form, purchaseCost: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
            <div className="mt-3">
              <Label htmlFor="editProdUom">Unit of Measure</Label>
              <select
                id="editProdUom"
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

          {/* Inventory (INVENTORY only) */}
          {showInventoryFields && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white/90">
                Inventory
              </h3>
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Current Qty: <strong className="text-gray-900 dark:text-white">{product.quantityOnHand}</strong> (use Stock Adjustment to change)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="editProdReorder">Reorder Point</Label>
                    <Input
                      id="editProdReorder"
                      type="number"
                      value={form.reorderPoint}
                      onChange={(e) =>
                        setForm({ ...form, reorderPoint: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="editProdReorderQty">Reorder Qty</Label>
                    <Input
                      id="editProdReorderQty"
                      type="number"
                      value={form.reorderQuantity}
                      onChange={(e) =>
                        setForm({ ...form, reorderQuantity: e.target.value })
                      }
                    />
                  </div>
                </div>
                {showPreferredVendor && (
                  <div>
                    <Label htmlFor="editProdVendor">Preferred Vendor</Label>
                    <select
                      id="editProdVendor"
                      value={form.preferredVendorId}
                      onChange={(e) =>
                        setForm({ ...form, preferredVendorId: e.target.value })
                      }
                      className={`${selectClasses} ${form.preferredVendorId ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}
                    >
                      <option value="">No vendor</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <Label htmlFor="editProdAssetAcct">Inventory Asset Account</Label>
                  <select
                    id="editProdAssetAcct"
                    value={form.inventoryAssetAccountId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        inventoryAssetAccountId: e.target.value,
                      })
                    }
                    className={`${selectClasses} ${form.inventoryAssetAccountId ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}
                  >
                    <option value="">Auto-assign</option>
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
                  <Label htmlFor="editProdTaxRate">Tax Rate (%)</Label>
                  <Input
                    id="editProdTaxRate"
                    type="number"
                    value={form.taxRate}
                    onChange={(e) =>
                      setForm({ ...form, taxRate: e.target.value })
                    }
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="editProdIncomeAcct">Income Account</Label>
                  <select
                    id="editProdIncomeAcct"
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
                    <Label htmlFor="editProdExpenseAcct">Expense Account</Label>
                    <select
                      id="editProdExpenseAcct"
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
                <Label>Sales Description</Label>
                <TextArea
                  value={form.salesDescription}
                  onChange={(val) =>
                    setForm({ ...form, salesDescription: val })
                  }
                  rows={2}
                />
              </div>
              {showPurchaseCost && (
                <div>
                  <Label>Purchase Description</Label>
                  <TextArea
                    value={form.purchaseDescription}
                    onChange={(val) =>
                      setForm({ ...form, purchaseDescription: val })
                    }
                    rows={2}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
};

export default EditProductModal;
