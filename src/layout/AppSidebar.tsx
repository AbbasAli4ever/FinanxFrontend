"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  HiOutlineHome,
  HiOutlineChartBar,
  HiOutlineCurrencyDollar,
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
  HiOutlineOfficeBuilding,
  HiChevronLeft,
  HiChevronRight,
  HiChevronDown,
  HiChevronUp,
} from "react-icons/hi";
import { MdOutlineAccountBalance } from "react-icons/md";
import { BsBank2 } from "react-icons/bs";
import UserDropdown from "@/components/header/UserDropdown";
import CompanySwitcher from "@/components/company/CompanySwitcher";
import { useSidebar } from "@/context/SidebarContext";

type NavChild = {
  name: string;
  path: string;
  icon: React.ReactNode;
};

type NavGroup = {
  name: string;
  icon: React.ReactNode;
  children?: NavChild[];
  path?: string;
};

const navGroups: NavGroup[] = [
  {
    name: "Home",
    icon: <HiOutlineHome className="w-[18px] h-[18px]" />,
    path: "/",
  },
  {
    name: "Sales",
    icon: <HiOutlineDocumentText className="w-[18px] h-[18px]" />,
    children: [
      { name: "Invoices", path: "/invoices", icon: <HiOutlineDocumentText className="w-4 h-4" /> },
      { name: "Estimates", path: "/estimates", icon: <HiOutlineDocumentReport className="w-4 h-4" /> },
      { name: "Sales Orders", path: "/sales-orders", icon: <HiOutlineTag className="w-4 h-4" /> },
      { name: "Credit Notes", path: "/credit-notes", icon: <HiOutlineReceiptRefund className="w-4 h-4" /> },
      { name: "Customers", path: "/customers", icon: <HiOutlineIdentification className="w-4 h-4" /> },
    ],
  },
  {
    name: "Purchases",
    icon: <HiOutlineShoppingCart className="w-[18px] h-[18px]" />,
    children: [
      { name: "Bills", path: "/bills", icon: <HiOutlineClipboardList className="w-4 h-4" /> },
      { name: "Expenses", path: "/expenses", icon: <HiOutlineCurrencyDollar className="w-4 h-4" /> },
      { name: "Purchase Orders", path: "/purchase-orders", icon: <HiOutlineShoppingCart className="w-4 h-4" /> },
      { name: "Debit Notes", path: "/debit-notes", icon: <HiOutlineDocumentRemove className="w-4 h-4" /> },
      { name: "Vendors", path: "/vendors", icon: <HiOutlineTruck className="w-4 h-4" /> },
    ],
  },
  {
    name: "Accounting",
    icon: <MdOutlineAccountBalance className="w-[18px] h-[18px]" />,
    children: [
      { name: "Chart of Accounts", path: "/accounting", icon: <MdOutlineAccountBalance className="w-4 h-4" /> },
      { name: "Journal Entries", path: "/journal-entries", icon: <HiOutlineBookOpen className="w-4 h-4" /> },
      { name: "Banking", path: "/banking", icon: <BsBank2 className="w-4 h-4" /> },
      { name: "Recurring", path: "/recurring", icon: <HiOutlineRefresh className="w-4 h-4" /> },
    ],
  },
  {
    name: "Inventory",
    icon: <HiOutlineArchive className="w-[18px] h-[18px]" />,
    children: [
      { name: "Products", path: "/products", icon: <HiOutlineCube className="w-4 h-4" /> },
      { name: "Inventory", path: "/inventory", icon: <HiOutlineArchive className="w-4 h-4" /> },
    ],
  },
  {
    name: "Payroll",
    icon: <HiOutlineOfficeBuilding className="w-[18px] h-[18px]" />,
    children: [
      { name: "Payroll", path: "/payroll", icon: <HiOutlineOfficeBuilding className="w-4 h-4" /> },
      { name: "Time Tracking", path: "/time-tracking", icon: <HiOutlineClock className="w-4 h-4" /> },
      { name: "Projects", path: "/projects", icon: <HiOutlineBriefcase className="w-4 h-4" /> },
    ],
  },
  {
    name: "Reports",
    icon: <HiOutlineChartBar className="w-[18px] h-[18px]" />,
    children: [
      { name: "Reports", path: "/reports", icon: <HiOutlineChartBar className="w-4 h-4" /> },
      { name: "Tax Management", path: "/tax-management", icon: <HiOutlineReceiptTax className="w-4 h-4" /> },
      { name: "Data I/O", path: "/data-io", icon: <HiOutlineUpload className="w-4 h-4" /> },
    ],
  },
  {
    name: "Settings",
    icon: <HiOutlineAdjustments className="w-[18px] h-[18px]" />,
    children: [
      { name: "Users", path: "/users", icon: <HiOutlineUserGroup className="w-4 h-4" /> },
      { name: "Roles", path: "/roles", icon: <HiOutlineShieldCheck className="w-4 h-4" /> },
      { name: "Currencies", path: "/currencies", icon: <HiOutlineGlobe className="w-4 h-4" /> },
      { name: "Audit Trail", path: "/audit-trail", icon: <HiOutlineClipboardCheck className="w-4 h-4" /> },
    ],
  },
  {
    name: "Search",
    icon: <HiOutlineSearch className="w-[18px] h-[18px]" />,
    path: "/search",
  },
  {
    name: "Alerts",
    icon: <HiOutlineBell className="w-[18px] h-[18px]" />,
    path: "/notifications",
  },
];

// Flyout rendered via portal to escape overflow clipping
interface FlyoutProps {
  group: NavGroup;
  anchorTop: number;
  sidebarRight: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onNavigate: () => void;
  isChildActive: (path: string) => boolean;
}

const FlyoutPanel: React.FC<FlyoutProps> = ({
  group,
  anchorTop,
  sidebarRight,
  onMouseEnter,
  onMouseLeave,
  onNavigate,
  isChildActive,
}) => {
  if (!group.children) return null;

  return createPortal(
    <div
      style={{ position: "fixed", top: anchorTop, left: sidebarRight + 6, zIndex: 9999 }}
      className="w-52 py-1.5 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header */}
      <div className="px-3 pt-1 pb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {group.name}
        </span>
      </div>
      <div className="h-px bg-gray-100 dark:bg-gray-700 mx-2 mb-1" />
      {/* Children */}
      <ul className="flex flex-col gap-px px-1.5">
        {group.children.map((child) => {
          const active = isChildActive(child.path);
          return (
            <li key={child.name}>
              <Link
                href={child.path}
                onClick={onNavigate}
                className={`
                  flex items-center gap-2.5 px-2 py-1.5 rounded text-[12px] font-medium
                  transition-all duration-150 group
                  ${active
                    ? "bg-brand-100 text-brand-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                  }
                `}
              >
                <span className={`flex shrink-0 items-center ${active ? "text-brand-600" : "text-gray-400 group-hover:text-brand-500"}`}>
                  {child.icon}
                </span>
                <span className="truncate">{child.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>,
    document.body
  );
};

const AppSidebar: React.FC = () => {
  const pathname = usePathname();
  const { isExpanded, toggleSidebar } = useSidebar();

  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [flyoutPos, setFlyoutPos] = useState<{ top: number; right: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Need to know we're mounted before using createPortal
  useEffect(() => { setMounted(true); }, []);

  // Auto-open the active group based on current route
  useEffect(() => {
    const active = navGroups.find((g) => {
      if (g.path) return g.path === "/" ? pathname === "/" : pathname.startsWith(g.path);
      return g.children?.some((c) => pathname.startsWith(c.path));
    });
    if (active?.children) setOpenGroup(active.name);
  }, [pathname]);

  // Close flyout when sidebar expands
  useEffect(() => {
    if (isExpanded) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setHoveredGroup(null);
      setFlyoutPos(null);
    }
  }, [isExpanded]);

  const cancelHide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    if (isExpanded) return;
    cancelHide();
    hideTimer.current = setTimeout(() => {
      setHoveredGroup(null);
      setFlyoutPos(null);
    }, 120);
  }, [isExpanded, cancelHide]);

  const toggleGroup = useCallback((name: string) => {
    setOpenGroup((prev) => (prev === name ? null : name));
  }, []);

  const isGroupActive = useCallback(
    (group: NavGroup) => {
      if (group.path) {
        return group.path === "/" ? pathname === "/" : pathname.startsWith(group.path);
      }
      return group.children?.some((c) => pathname.startsWith(c.path)) ?? false;
    },
    [pathname]
  );

  const isChildActive = useCallback(
    (path: string) => pathname.startsWith(path),
    [pathname]
  );

  const handleMouseEnter = useCallback((name: string, el: HTMLLIElement | null) => {
    if (isExpanded || !el) return;
    cancelHide();
    const rect = el.getBoundingClientRect();
    setFlyoutPos({ top: rect.top, right: rect.right });
    setHoveredGroup(name);
  }, [isExpanded, cancelHide]);

  const handleMouseLeave = useCallback(() => {
    if (isExpanded) return;
    scheduleHide();
  }, [isExpanded, scheduleHide]);

  const activeGroup = hoveredGroup ? navGroups.find((g) => g.name === hoveredGroup) : null;

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
        <Link
          href="/"
          className="flex items-center justify-center w-9 h-9 rounded transition-all duration-150 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
        >
          <Image src="/images/logo/f-logo.png" alt="Logo" width={28} height={28} />
        </Link>

        {isExpanded && (
          <span className="ml-2 text-[13px] font-semibold text-gray-700 dark:text-gray-200 truncate flex-1">
            FinanX
          </span>
        )}

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
          {isExpanded ? <HiChevronLeft className="w-4 h-4" /> : <HiChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav scroll area */}
      <div className="flex flex-col overflow-y-auto no-scrollbar flex-1 py-2">
        <nav className="flex-1">
          <ul className="flex flex-col gap-px">
            {navGroups.map((group) => {
              const groupActive = isGroupActive(group);
              const isOpen = openGroup === group.name;
              const isLeaf = !group.children;

              return (
                <li
                  key={group.name}
                  className="w-full px-1.5"
                  ref={(el) => {
                    // attach hover handlers via ref so we can read getBoundingClientRect
                  }}
                  onMouseEnter={(e) => handleMouseEnter(group.name, e.currentTarget as HTMLLIElement)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Group header */}
                  {isLeaf ? (
                    <Link
                      href={group.path!}
                      title={group.name}
                      className={`
                        relative flex items-center gap-2.5 w-full rounded
                        transition-all duration-150 group overflow-hidden
                        ${isExpanded ? "px-3 py-2" : "flex-col px-1 py-[7px] justify-center"}
                        ${groupActive
                          ? "bg-brand-100 text-brand-700"
                          : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        }
                      `}
                    >
                      <span className={`flex shrink-0 items-center justify-center transition-colors duration-150 ${groupActive ? "text-brand-600" : "text-gray-400 group-hover:text-brand-500"}`}>
                        {group.icon}
                      </span>
                      {isExpanded ? (
                        <span className={`text-[13px] font-medium leading-none truncate ${groupActive ? "text-brand-700" : "text-gray-500 group-hover:text-gray-700"}`}>
                          {group.name}
                        </span>
                      ) : (
                        <span className={`text-[9px] font-semibold leading-none tracking-wider truncate max-w-full px-0.5 uppercase ${groupActive ? "text-brand-600" : "text-gray-400 group-hover:text-gray-500"}`}>
                          {group.name}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <button
                      onClick={() => isExpanded && toggleGroup(group.name)}
                      title={group.name}
                      className={`
                        relative flex items-center gap-2.5 w-full rounded
                        transition-all duration-150 group overflow-hidden
                        ${isExpanded ? "px-3 py-2" : "flex-col px-1 py-[7px] justify-center"}
                        ${groupActive
                          ? "bg-brand-50 text-brand-700"
                          : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        }
                      `}
                    >
                      <span className={`flex shrink-0 items-center justify-center transition-colors duration-150 ${groupActive ? "text-brand-600" : "text-gray-400 group-hover:text-brand-500"}`}>
                        {group.icon}
                      </span>
                      {isExpanded ? (
                        <>
                          <span className={`flex-1 text-left text-[13px] font-medium leading-none truncate ${groupActive ? "text-brand-700" : "text-gray-500 group-hover:text-gray-700"}`}>
                            {group.name}
                          </span>
                          <span className={`shrink-0 transition-colors duration-150 ${groupActive ? "text-brand-500" : "text-gray-300 group-hover:text-gray-400"}`}>
                            {isOpen ? <HiChevronUp className="w-3.5 h-3.5" /> : <HiChevronDown className="w-3.5 h-3.5" />}
                          </span>
                        </>
                      ) : (
                        <span className={`text-[9px] font-semibold leading-none tracking-wider truncate max-w-full px-0.5 uppercase ${groupActive ? "text-brand-600" : "text-gray-400 group-hover:text-gray-500"}`}>
                          {group.name}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Expanded: inline accordion children */}
                  {isExpanded && !isLeaf && isOpen && group.children && (
                    <ul className="mt-0.5 ml-3 pl-3 border-l border-gray-200 dark:border-gray-700 flex flex-col gap-px">
                      {group.children.map((child) => {
                        const childActive = isChildActive(child.path);
                        return (
                          <li key={child.name}>
                            <Link
                              href={child.path}
                              className={`
                                flex items-center gap-2 px-2 py-1.5 rounded text-[12px] font-medium
                                transition-all duration-150 group
                                ${childActive
                                  ? "bg-brand-100 text-brand-700"
                                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                }
                              `}
                            >
                              <span className={`flex shrink-0 items-center ${childActive ? "text-brand-600" : "text-gray-400 group-hover:text-brand-500"}`}>
                                {child.icon}
                              </span>
                              <span className="truncate">{child.name}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
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

      {/* Collapsed flyout — rendered via portal to escape overflow clipping */}
      {mounted && !isExpanded && activeGroup?.children && flyoutPos && (
        <FlyoutPanel
          group={activeGroup}
          anchorTop={flyoutPos.top}
          sidebarRight={flyoutPos.right}
          onMouseEnter={cancelHide}
          onMouseLeave={scheduleHide}
          onNavigate={() => {
            cancelHide();
            setHoveredGroup(null);
            setFlyoutPos(null);
          }}
          isChildActive={isChildActive}
        />
      )}
    </aside>
  );
};

export default AppSidebar;
