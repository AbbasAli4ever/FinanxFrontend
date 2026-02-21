"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import productsService from "@/services/productsService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface DeleteProductModalProps {
  isOpen: boolean;
  productId: string | null;
  productName: string;
  onClose: () => void;
  onDeleted: () => void;
}

const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
  isOpen,
  productId,
  productName,
  onClose,
  onDeleted,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!token || !productId) return;

    setError("");
    setLoading(true);

    try {
      await productsService.deleteProduct(productId, token);
      onDeleted();
      onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Deactivate Product
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to deactivate{" "}
          <strong className="text-gray-900 dark:text-white">
            {productName}
          </strong>
          ? The product will be marked as inactive and hidden from active
          listings. This action can be reversed by editing the product.
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleDelete}
          disabled={loading}
          className="bg-error-500 hover:bg-error-600"
        >
          {loading ? "Deactivating..." : "Deactivate"}
        </Button>
      </div>
    </Modal>
  );
};

export default DeleteProductModal;
