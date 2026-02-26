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
} from "react-icons/hi";
import { MdOutlineAccountBalance } from "react-icons/md";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

const navItems: NavItem[] = [
  {
    icon: <HiOutlinePlusCircle className="w-7 h-7" />,
    name: "Create",
    path: "/create",
  },
  {
    icon: <HiOutlineBookmark className="w-7 h-7" />,
    name: "Bookmarks",
    path: "/bookmarks",
  },
  {
    icon: <HiOutlineHome className="w-7 h-7" />,
    name: "Home",
    path: "/",
  },
  {
    icon: <HiOutlineSparkles className="w-7 h-7" />,
    name: "Feed",
    path: "/feed",
  },
  {
    icon: <HiOutlineChartBar className="w-7 h-7" />,
    name: "Reports",
    path: "/reports",
  },
  {
    icon: <HiOutlineViewGrid className="w-7 h-7" />,
    name: "All apps",
    path: "/all-apps",
  },
];

const pinnedItems: NavItem[] = [
  {
    icon: <MdOutlineAccountBalance className="w-7 h-7" />,
    name: "Accounting",
    path: "/accounting",
  },
  {
    icon: <HiOutlineIdentification className="w-7 h-7" />,
    name: "Customers",
    path: "/customers",
  },
  {
    icon: <HiOutlineTruck className="w-7 h-7" />,
    name: "Vendors",
    path: "/vendors",
  },
  {
    icon: <HiOutlineCube className="w-7 h-7" />,
    name: "Products",
    path: "/products",
  },
  {
    icon: <HiOutlineDocumentText className="w-7 h-7" />,
    name: "Invoices",
    path: "/invoices",
  },
  {
    icon: <HiOutlineDocumentReport className="w-7 h-7" />,
    name: "Estimates",
    path: "/estimates",
  },
  {
    icon: <HiOutlineClipboardList className="w-7 h-7" />,
    name: "Bills",
    path: "/bills",
  },
  {
    icon: <HiOutlineCurrencyDollar className="w-7 h-7" />,
    name: "Expenses",
    path: "/expenses",
  },
  {
    icon: <HiOutlineBookOpen className="w-7 h-7" />,
    name: "Journal",
    path: "/journal-entries",
  },
  {
    icon: <HiOutlineReceiptRefund className="w-7 h-7" />,
    name: "Credits",
    path: "/credit-notes",
  },
  {
    icon: <HiOutlineDocumentRemove className="w-7 h-7" />,
    name: "Debits",
    path: "/debit-notes",
  },
  {
    icon: <HiOutlineUserGroup className="w-7 h-7" />,
    name: "Users",
    path: "/users",
  },
  {
    icon: <HiOutlineShieldCheck className="w-7 h-7" />,
    name: "Roles",
    path: "/roles",
  },
  {
    icon: <HiOutlineDotsHorizontal className="w-7 h-7" />,
    name: "More",
    path: "/more",
  },
  {
    icon: <HiOutlineAdjustments className="w-7 h-7" />,
    name: "Customise",
    path: "/customise",
  },
];

const AppSidebar: React.FC = () => {
  const pathname = usePathname();

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col items-center gap-4">
      {items.map((nav) => (
        <li key={nav.name}>
          <Link
            href={nav.path}
            className="flex flex-col items-center gap-1 group"
          >
            <span
              className={`p-2 rounded-xl transition-all duration-200 ${
                isActive(nav.path)
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
            >
              {nav.icon}
            </span>
            <span
              className={`text-[11px] font-medium ${
                isActive(nav.path)
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {nav.name}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <aside className="fixed top-0 left-0 w-[90px] h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 flex flex-col">
      {/* Logo */}
      <div className="flex justify-center py-4">
        <Link href="/">
          <Image
            src="/images/logo/logo-icon.svg"
            alt="Logo"
            width={40}
            height={40}
          />
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto no-scrollbar flex-1">
        <nav className="flex-1">
          <div className="flex flex-col gap-2">
            {renderMenuItems(navItems)}

            <div className="border-t border-gray-200 dark:border-gray-800 mx-4 my-4" />

            <h2 className="text-[10px] uppercase text-center text-gray-400 font-semibold mb-2">
              Pinned
            </h2>
            {renderMenuItems(pinnedItems)}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
