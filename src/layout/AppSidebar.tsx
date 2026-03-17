"use client";
import React, { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  HiOutlinePlusCircle,
  HiOutlineBookmark,
  HiOutlineHome,
  HiOutlineSparkles,
  HiOutlineChartBar,
  HiOutlineViewGrid,
  HiOutlineCurrencyDollar,
  HiOutlineDotsHorizontal,
  HiOutlineAdjustments,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlineIdentification,
  HiOutlineTruck,
  HiOutlineCube,
  HiOutlineDocumentText,
  HiOutlineClipboardList,
  HiOutlineBookOpen,
  HiOutlineReceiptRefund,
  HiOutlineDocumentRemove,
  HiOutlineDocumentReport,
  HiOutlineShoppingCart,
  HiOutlineTag,
  HiOutlineArchive,
  HiOutlineRefresh,
  HiOutlineClipboardCheck,
  HiOutlineBriefcase,
  HiOutlineClock,
  HiOutlineGlobe,
  HiOutlineUpload,
  HiOutlineSearch,
  HiOutlineReceiptTax,
  HiOutlineBell,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi";
import { MdOutlineAccountBalance } from "react-icons/md";
import { BsBank2 } from "react-icons/bs";
import UserDropdown from "@/components/header/UserDropdown";
import CompanySwitcher from "@/components/company/CompanySwitcher";
import { useSidebar } from "@/context/SidebarContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

const navItems: NavItem[] = [
  { icon: <HiOutlinePlusCircle className="w-[18px] h-[18px]" />, name: "Create", path: "/create" },
  { icon: <HiOutlineBookmark className="w-[18px] h-[18px]" />, name: "Bookmarks", path: "/bookmarks" },
  { icon: <HiOutlineHome className="w-[18px] h-[18px]" />, name: "Home", path: "/" },
  { icon: <HiOutlineSparkles className="w-[18px] h-[18px]" />, name: "Feed", path: "/feed" },
  { icon: <HiOutlineChartBar className="w-[18px] h-[18px]" />, name: "Reports", path: "/reports" },
  { icon: <HiOutlineBriefcase className="w-[18px] h-[18px]" />, name: "Projects", path: "/projects" },
  { icon: <HiOutlineClock className="w-[18px] h-[18px]" />, name: "Time", path: "/time-tracking" },
  { icon: <HiOutlineGlobe className="w-[18px] h-[18px]" />, name: "Currencies", path: "/currencies" },
  { icon: <HiOutlineUpload className="w-[18px] h-[18px]" />, name: "Data I/O", path: "/data-io" },
  { icon: <HiOutlineSearch className="w-[18px] h-[18px]" />, name: "Search", path: "/search" },
  { icon: <HiOutlineReceiptTax className="w-[18px] h-[18px]" />, name: "Taxes", path: "/tax-management" },
  { icon: <HiOutlineBell className="w-[18px] h-[18px]" />, name: "Alerts", path: "/notifications" },
  { icon: <HiOutlineViewGrid className="w-[18px] h-[18px]" />, name: "All Apps", path: "/all-apps" },
];

const pinnedItems: NavItem[] = [
  { icon: <MdOutlineAccountBalance className="w-[18px] h-[18px]" />, name: "Accounting", path: "/accounting" },
  { icon: <HiOutlineIdentification className="w-[18px] h-[18px]" />, name: "Customers", path: "/customers" },
  { icon: <HiOutlineTruck className="w-[18px] h-[18px]" />, name: "Vendors", path: "/vendors" },
  { icon: <HiOutlineCube className="w-[18px] h-[18px]" />, name: "Products", path: "/products" },
  { icon: <HiOutlineDocumentText className="w-[18px] h-[18px]" />, name: "Invoices", path: "/invoices" },
  { icon: <HiOutlineDocumentReport className="w-[18px] h-[18px]" />, name: "Estimates", path: "/estimates" },
  { icon: <HiOutlineShoppingCart className="w-[18px] h-[18px]" />, name: "PO", path: "/purchase-orders" },
  { icon: <HiOutlineTag className="w-[18px] h-[18px]" />, name: "SO", path: "/sales-orders" },
  { icon: <HiOutlineArchive className="w-[18px] h-[18px]" />, name: "Inventory", path: "/inventory" },
  { icon: <BsBank2 className="w-[18px] h-[18px]" />, name: "Banking", path: "/banking" },
  { icon: <HiOutlineRefresh className="w-[18px] h-[18px]" />, name: "Recurring", path: "/recurring" },
  { icon: <HiOutlineClipboardList className="w-[18px] h-[18px]" />, name: "Bills", path: "/bills" },
  { icon: <HiOutlineCurrencyDollar className="w-[18px] h-[18px]" />, name: "Expenses", path: "/expenses" },
  { icon: <HiOutlineBookOpen className="w-[18px] h-[18px]" />, name: "Journal", path: "/journal-entries" },
  { icon: <HiOutlineReceiptRefund className="w-[18px] h-[18px]" />, name: "Credits", path: "/credit-notes" },
  { icon: <HiOutlineDocumentRemove className="w-[18px] h-[18px]" />, name: "Debits", path: "/debit-notes" },
  { icon: <HiOutlineUserGroup className="w-[18px] h-[18px]" />, name: "Users", path: "/users" },
  { icon: <HiOutlineShieldCheck className="w-[18px] h-[18px]" />, name: "Roles", path: "/roles" },
  { icon: <HiOutlineClipboardCheck className="w-[18px] h-[18px]" />, name: "Audit", path: "/audit-trail" },
  { icon: <HiOutlineDotsHorizontal className="w-[18px] h-[18px]" />, name: "More", path: "/more" },
  { icon: <HiOutlineAdjustments className="w-[18px] h-[18px]" />, name: "Customise", path: "/customise" },
];

const AppSidebar: React.FC = () => {
  const pathname = usePathname();
  const { isExpanded, toggleSidebar } = useSidebar();
  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-px">
      {items.map((nav) => {
        const active = isActive(nav.path);
        return (
          <li key={nav.name} className="w-full px-1.5">
            <Link
              href={nav.path}
              title={nav.name}
              className={`
                relative flex items-center gap-2.5 w-full rounded
                transition-all duration-150 group overflow-hidden
                ${isExpanded ? "px-3 py-2" : "flex-col px-1 py-[7px] justify-center"}
                ${active
                  ? "bg-brand-100 text-brand-700"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                }
              `}
            >
              {/* Icon */}
              <span className={`
                flex shrink-0 items-center justify-center transition-colors duration-150
                ${active ? "text-brand-600" : "text-gray-400 group-hover:text-brand-500"}
              `}>
                {nav.icon}
              </span>

              {/* Label */}
              {isExpanded ? (
                <span className={`
                  text-[13px] font-medium leading-none truncate
                  ${active ? "text-brand-700" : "text-gray-500 group-hover:text-gray-700"}
                `}>
                  {nav.name}
                </span>
              ) : (
                <span className={`
                  text-[9px] font-semibold leading-none tracking-wider truncate max-w-full px-0.5 uppercase
                  ${active ? "text-brand-600" : "text-gray-400 group-hover:text-gray-500"}
                `}>
                  {nav.name}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`
        fixed top-0 left-0 h-screen z-50 flex flex-col
        bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800
        transition-all duration-200 ease-in-out
        ${isExpanded ? "w-[220px]" : "w-[72px]"}
      `}
    >
      {/* Logo + toggle */}
      <div
        className="flex items-center shrink-0 border-b border-gray-200 dark:border-gray-800 px-1.5"
        style={{ height: "48px" }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center justify-center w-9 h-9 rounded transition-all duration-150 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
        >
          <Image
            src="/images/logo/f-logo.png"
            alt="Logo"
            width={28}
            height={28}
          />
        </Link>

        {/* App name — only when expanded */}
        {isExpanded && (
          <span className="ml-2 text-[13px] font-semibold text-gray-700 dark:text-gray-200 truncate flex-1">
            FinanX
          </span>
        )}

        {/* Toggle button — always at top-right */}
        <button
          onClick={toggleSidebar}
          className={`
            flex items-center justify-center w-7 h-7 rounded
            text-gray-400 hover:bg-gray-100 hover:text-gray-600
            dark:hover:bg-gray-800 dark:hover:text-gray-300
            transition-colors duration-150 shrink-0
            ${isExpanded ? "ml-auto" : "mx-auto mt-0"}
          `}
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded
            ? <HiChevronLeft className="w-4 h-4" />
            : <HiChevronRight className="w-4 h-4" />
          }
        </button>
      </div>

      {/* Nav scroll area */}
      <div className="flex flex-col overflow-y-auto no-scrollbar flex-1 py-2">
        <nav className="flex-1">
          {renderMenuItems(navItems)}

          {/* Divider */}
          <div className={`mx-3 my-2 flex items-center gap-1.5 ${!isExpanded && "justify-center"}`}>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            {isExpanded && (
              <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-gray-300 dark:text-gray-600 shrink-0">
                Pinned
              </span>
            )}
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {renderMenuItems(pinnedItems)}
        </nav>
      </div>

      {/* Company switcher */}
      <div className="shrink-0 border-t border-gray-200 dark:border-gray-800">
        <CompanySwitcher variant="sidebar" />
      </div>

      {/* User — bottom */}
      <div className="shrink-0 border-t border-gray-200 dark:border-gray-800">
        <UserDropdown variant="sidebar" />
      </div>
    </aside>
  );
};

export default AppSidebar;
