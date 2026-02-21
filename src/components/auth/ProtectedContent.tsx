"use client";

import React from "react";
import { usePermissions } from "@/context/PermissionsContext";

interface ProtectedContentProps {
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProtectedContent: React.FC<ProtectedContentProps> = ({
  permission,
  anyOf,
  allOf,
  children,
  fallback = null,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } =
    usePermissions();

  if (loading) return null;

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (anyOf) {
    hasAccess = hasAnyPermission(anyOf);
  } else if (allOf) {
    hasAccess = hasAllPermissions(allOf);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default ProtectedContent;
