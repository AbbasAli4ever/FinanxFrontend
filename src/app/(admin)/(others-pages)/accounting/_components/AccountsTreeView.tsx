"use client";

import React, { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import type { AccountTreeNode, AccountTreeData } from "@/types/accounts";

interface AccountsTreeViewProps {
  treeData: AccountTreeData;
  onEdit: (node: AccountTreeNode) => void;
  onDelete: (node: AccountTreeNode) => void;
}

const GROUP_ORDER = ["Assets", "Liabilities", "Equity", "Income", "Expenses"];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

interface TreeNodeProps {
  node: AccountTreeNode;
  onEdit: (node: AccountTreeNode) => void;
  onDelete: (node: AccountTreeNode) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className="group flex items-center gap-2 border-b border-gray-100 px-4 py-2.5 transition hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
        style={{ paddingLeft: `${16 + node.depth * 24}px` }}
      >
        {/* Expand/Collapse chevron */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition ${
            hasChildren
              ? "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              : "invisible"
          }`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className={`transition-transform ${expanded ? "rotate-90" : ""}`}
          >
            <path
              d="M5.25 3.5L8.75 7L5.25 10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Account Number */}
        <span className="w-16 shrink-0 font-mono text-sm text-gray-500 dark:text-gray-400">
          {node.accountNumber || "—"}
        </span>

        {/* Account Name */}
        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white/90">
          {node.name}
        </span>

        {/* Badges */}
        {node.isSystemAccount && (
          <Badge size="sm" color="primary" variant="light">
            System
          </Badge>
        )}
        {hasChildren && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {node.children.length} sub
          </span>
        )}

        {/* Balance */}
        <span className="w-28 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-white/90">
          {formatCurrency(node.currentBalance)}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={() => onEdit(node)}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            title="Edit account"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M11.333 2.00004C11.51 1.82274 11.7214 1.68342 11.9542 1.59009C12.187 1.49676 12.4365 1.4514 12.6873 1.45669C12.9381 1.46198 13.1854 1.51772 13.4141 1.62082C13.6427 1.72392 13.8481 1.87216 14.0179 2.05671C14.1876 2.24126 14.3184 2.45851 14.4025 2.69523C14.4866 2.93195 14.5224 3.18329 14.5074 3.43399C14.4925 3.68469 14.4272 3.93002 14.3153 4.15528C14.2034 4.38053 14.0473 4.58108 13.8567 4.74537L5.17133 13.4307L1.33333 14.6667L2.56933 10.8287L11.333 2.00004Z"
                stroke="currentColor"
                strokeWidth="1.33"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(node)}
            disabled={node.isSystemAccount}
            className={`rounded-lg p-1.5 transition ${
              node.isSystemAccount
                ? "cursor-not-allowed text-gray-300 dark:text-gray-600"
                : "text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            }`}
            title={
              node.isSystemAccount
                ? "System accounts cannot be deleted"
                : "Delete account"
            }
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 4H14M5.333 4V2.667C5.333 2.313 5.474 1.974 5.724 1.724C5.974 1.474 6.313 1.333 6.667 1.333H9.333C9.687 1.333 10.026 1.474 10.276 1.724C10.526 1.974 10.667 2.313 10.667 2.667V4M12.667 4V13.333C12.667 13.687 12.526 14.026 12.276 14.276C12.026 14.526 11.687 14.667 11.333 14.667H4.667C4.313 14.667 3.974 14.526 3.724 14.276C3.474 14.026 3.333 13.687 3.333 13.333V4H12.667Z"
                stroke="currentColor"
                strokeWidth="1.33"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const AccountsTreeView: React.FC<AccountsTreeViewProps> = ({
  treeData,
  onEdit,
  onDelete,
}) => {
  const hasAnyAccounts = GROUP_ORDER.some(
    (group) => treeData[group] && treeData[group].length > 0
  );

  if (!hasAnyAccounts) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white/80 p-8 text-center dark:border-gray-700 dark:bg-gray-900/60">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No accounts found.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {GROUP_ORDER.map((group) => {
        const nodes = treeData[group];
        if (!nodes || nodes.length === 0) return null;

        return (
          <div key={group}>
            {/* Group Header */}
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-800 dark:bg-gray-800/50">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 dark:text-gray-300">
                {group}
              </span>
            </div>

            {/* Tree Nodes */}
            {nodes.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default AccountsTreeView;
