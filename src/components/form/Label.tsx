import { FC, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface LabelProps {
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

const Label: FC<LabelProps> = ({ htmlFor, children, className }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={twMerge(
        "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400",
        className
      )}
    >
      {children}
    </label>
  );
};

export default Label;
