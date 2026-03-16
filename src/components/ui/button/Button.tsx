import React, { ReactNode } from "react";

interface ButtonProps {
  type?: "button" | "submit" | "reset";
  children: ReactNode;
  size?: "sm" | "md";
  variant?: "primary" | "outline" | "ghost" | "danger";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  type = "button",
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
}) => {
  const sizeClasses = {
    sm: "h-7 px-3 text-[12px]",
    md: "h-9 px-4 text-[13px]",
  };

  const variantClasses = {
    primary:
      "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-200 dark:disabled:bg-brand-800",
    outline:
      "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-500",
    ghost:
      "bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700/50",
    danger:
      "bg-error-500 text-white hover:bg-error-600 active:bg-error-700 disabled:bg-error-200",
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center font-medium gap-1.5 rounded transition-all duration-150 active:scale-[0.98] ${sizeClasses[size]} ${variantClasses[variant]} ${
        disabled ? "cursor-not-allowed opacity-50 active:scale-100" : ""
      } ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {startIcon && <span className="flex items-center shrink-0">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center shrink-0">{endIcon}</span>}
    </button>
  );
};

export default Button;
