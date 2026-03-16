import React, { ReactNode } from "react";

interface TableProps {
  children: ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
}

interface TableCellProps {
  children: ReactNode;
  isHeader?: boolean;
  className?: string;
}

const Table: React.FC<TableProps> = ({ children, className }) => {
  return (
    <table className={`min-w-full ${className ?? ""}`}>{children}</table>
  );
};

const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return (
    <thead className={`bg-gray-50 dark:bg-gray-800/60 ${className ?? ""}`}>
      {children}
    </thead>
  );
};

const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return (
    <tbody className={`divide-y divide-gray-100 dark:divide-gray-700/60 ${className ?? ""}`}>
      {children}
    </tbody>
  );
};

const TableRow: React.FC<TableRowProps> = ({ children, className }) => {
  return (
    <tr className={`transition-colors duration-100 ${className ?? ""}`}>
      {children}
    </tr>
  );
};

const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className,
}) => {
  const CellTag = isHeader ? "th" : "td";
  const baseClass = isHeader
    ? `px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap ${className ?? ""}`
    : `px-4 py-2.5 text-[13px] text-gray-700 dark:text-gray-300 ${className ?? ""}`;
  return <CellTag className={baseClass}>{children}</CellTag>;
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
