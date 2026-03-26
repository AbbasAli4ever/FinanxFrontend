"use client";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import { useSidebar } from "@/context/SidebarContext";
import GlobalSearchBar from "@/components/search/GlobalSearchBar";
import CompanySwitcher from "@/components/company/CompanySwitcher";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 flex w-full bg-white border-b border-gray-200 z-99999 dark:border-gray-700 dark:bg-gray-900" style={{ height: "48px" }}>
      <div className="flex items-center justify-between w-full px-4 lg:px-5 gap-3">
        {/* Left: mobile toggle + logo / desktop search */}
        <div className="flex items-center gap-3">
          {/* Mobile-only hamburger */}
          <button
            className="flex lg:hidden items-center justify-center w-8 h-8 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-150 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            onClick={toggleMobileSidebar}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z" fill="currentColor" />
              </svg>
            ) : (
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z" fill="currentColor" />
              </svg>
            )}
          </button>

          {/* Mobile logo */}
          <Link href="/" className="lg:hidden">
            <Image width={32} height={32} src="/images/logo/f-logo.png" alt="Logo" />
          </Link>

          {/* Desktop search */}
          <div className="hidden lg:block">
            <GlobalSearchBar inputRef={inputRef} />
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5">
          {/* Mobile menu toggle (three-dot) */}
          <button
            onClick={toggleApplicationMenu}
            className="flex items-center justify-center w-8 h-8 rounded text-gray-500 hover:bg-gray-100 transition-colors duration-150 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z" fill="currentColor" />
            </svg>
          </button>

          {/* Action row */}
          <div className={`${isApplicationMenuOpen ? "flex" : "hidden"} lg:flex items-center gap-1.5`}>
            {/* Company switcher */}
            <div className="hidden sm:block">
              <CompanySwitcher variant="header" />
            </div>

            {/* Invite User */}
            <Link
              href="/users"
              className="hidden sm:inline-flex items-center gap-1.5 rounded border border-brand-500 bg-brand-500 px-3 h-8 text-[12px] font-medium text-white hover:bg-brand-600 hover:border-brand-600 transition-all duration-150 active:scale-[0.98]"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M8 2C8.41421 2 8.75 2.33579 8.75 2.75V7.25H13.25C13.6642 7.25 14 7.58579 14 8C14 8.41421 13.6642 8.75 13.25 8.75H8.75V13.25C8.75 13.6642 8.41421 14 8 14C7.58579 14 7.25 13.6642 7.25 13.25V8.75H2.75C2.33579 8.75 2 8.41421 2 8C2 7.58579 2.33579 7.25 2.75 7.25H7.25V2.75C7.25 2.33579 7.58579 2 8 2Z" fill="currentColor" />
              </svg>
              Invite User
            </Link>

            {/* <ThemeToggleButton /> */}
            <NotificationDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
