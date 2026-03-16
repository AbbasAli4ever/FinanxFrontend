import React from "react";

type BadgeVariant = "light" | "solid";
type BadgeSize = "sm" | "md";
type BadgeColor =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "light"
  | "dark";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  color?: BadgeColor;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({
  variant = "light",
  color = "primary",
  size = "md",
  startIcon,
  endIcon,
  children,
}) => {
  const baseStyles =
    "inline-flex items-center px-2 py-0.5 justify-center gap-1 rounded font-medium leading-none";

  const sizeStyles = {
    sm: "text-[10px]",
    md: "text-[11px]",
  };

  const variants = {
    light: {
      primary:
        "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
      success:
        "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
      error:
        "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
      warning:
        "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
      info: "bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/15 dark:text-blue-light-400",
      light: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400",
      dark: "bg-gray-700 text-white dark:bg-gray-600 dark:text-gray-100",
    },
    solid: {
      primary: "bg-brand-500 text-white",
      success: "bg-success-500 text-white",
      error: "bg-error-500 text-white",
      warning: "bg-warning-500 text-white",
      info: "bg-blue-light-500 text-white",
      light: "bg-gray-400 text-white",
      dark: "bg-gray-700 text-white",
    },
  };

  const sizeClass = sizeStyles[size];
  const colorStyles = variants[variant][color];

  return (
    <span className={`${baseStyles} ${sizeClass} ${colorStyles}`}>
      {startIcon && <span className="shrink-0">{startIcon}</span>}
      {children}
      {endIcon && <span className="shrink-0">{endIcon}</span>}
    </span>
  );
};

export default Badge;
