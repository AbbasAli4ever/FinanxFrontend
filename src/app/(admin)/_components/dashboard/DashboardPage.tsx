"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import dashboardService from "@/services/dashboardService";
import type {
  PeriodParams,
  FinancialOverview,
  RevenueTrend,
  InvoiceAnalytics,
  BillAnalytics,
  TopCustomersData,
  TopVendorsData,
  CashFlowOverview,
  ExpenseBreakdown,
  InventoryStats,
  ProjectOverview,
  RecentActivity,
  PeriodComparison,
} from "@/types/dashboard";

import PeriodSelector from "./PeriodSelector";
import KpiCards from "./KpiCards";
import RevenueTrendChart from "./RevenueTrendChart";
import InvoiceAnalyticsCard from "./InvoiceAnalyticsCard";
import BillAnalyticsCard from "./BillAnalyticsCard";
import TopCustomersChart from "./TopCustomersChart";
import TopVendorsChart from "./TopVendorsChart";
import CashFlowCard from "./CashFlowCard";
import RecentActivityFeed from "./RecentActivityFeed";
import ExpenseBreakdownCard from "./ExpenseBreakdownCard";
import InventoryStatsCard from "./InventoryStatsCard";
import ProjectOverviewCard from "./ProjectOverviewCard";
import PeriodComparisonCards from "./PeriodComparisonCards";

const DEFAULT_PERIOD: PeriodParams = { period: "this_month" };

const DashboardPage: React.FC = () => {
  const { token } = useAuth();
  const [period, setPeriod] = useState<PeriodParams>(DEFAULT_PERIOD);

  // Period-sensitive data
  const [financial, setFinancial] = useState<FinancialOverview | null>(null);
  const [trend, setTrend] = useState<RevenueTrend | null>(null);
  const [invoiceAnalytics, setInvoiceAnalytics] = useState<InvoiceAnalytics | null>(null);
  const [billAnalytics, setBillAnalytics] = useState<BillAnalytics | null>(null);
  const [topCustomers, setTopCustomers] = useState<TopCustomersData | null>(null);
  const [topVendors, setTopVendors] = useState<TopVendorsData | null>(null);
  const [expenses, setExpenses] = useState<ExpenseBreakdown | null>(null);
  const [comparison, setComparison] = useState<PeriodComparison | null>(null);
  const [periodLoading, setPeriodLoading] = useState(true);

  // Period-independent data
  const [cashFlow, setCashFlow] = useState<CashFlowOverview | null>(null);
  const [inventory, setInventory] = useState<InventoryStats | null>(null);
  const [projects, setProjects] = useState<ProjectOverview | null>(null);
  const [activity, setActivity] = useState<RecentActivity | null>(null);
  const [staticLoading, setStaticLoading] = useState(true);

  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchPeriodData = useCallback(
    async (p: PeriodParams, t: string) => {
      setPeriodLoading(true);
      const results = await Promise.allSettled([
        dashboardService.getFinancialOverview(p, t),
        dashboardService.getRevenueTrend(p, t),
        dashboardService.getInvoiceAnalytics(p, t),
        dashboardService.getBillAnalytics(p, t),
        dashboardService.getTopCustomers({ ...p, limit: 10 }, t),
        dashboardService.getTopVendors({ ...p, limit: 10 }, t),
        dashboardService.getExpenseBreakdown(p, t),
        dashboardService.getPeriodComparison(p, t),
      ]);

      if (results[0].status === "fulfilled") setFinancial(results[0].value);
      if (results[1].status === "fulfilled") setTrend(results[1].value);
      if (results[2].status === "fulfilled") setInvoiceAnalytics(results[2].value);
      if (results[3].status === "fulfilled") setBillAnalytics(results[3].value);
      if (results[4].status === "fulfilled") setTopCustomers(results[4].value);
      if (results[5].status === "fulfilled") setTopVendors(results[5].value);
      if (results[6].status === "fulfilled") setExpenses(results[6].value);
      if (results[7].status === "fulfilled") setComparison(results[7].value);

      setPeriodLoading(false);
      setLastRefreshed(new Date());
    },
    []
  );

  const fetchStaticData = useCallback(async (t: string) => {
    setStaticLoading(true);
    const results = await Promise.allSettled([
      dashboardService.getCashFlow(t),
      dashboardService.getInventoryStats(10, t),
      dashboardService.getProjectOverview(t),
      dashboardService.getRecentActivity(20, t),
    ]);

    if (results[0].status === "fulfilled") setCashFlow(results[0].value);
    if (results[1].status === "fulfilled") setInventory(results[1].value);
    if (results[2].status === "fulfilled") setProjects(results[2].value);
    if (results[3].status === "fulfilled") setActivity(results[3].value);

    setStaticLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    if (!token) return;
    fetchPeriodData(period, token);
    fetchStaticData(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Re-fetch period data on period change (not on mount — handled above)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!mounted) { setMounted(true); return; }
    if (!token) return;
    fetchPeriodData(period, token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const handleRefresh = () => {
    if (!token) return;
    fetchPeriodData(period, token);
    fetchStaticData(token);
  };

  const handlePeriodChange = (p: PeriodParams) => {
    // For custom, wait until both dates are set
    if (p.period === "custom" && (!p.startDate || !p.endDate)) {
      setPeriod(p);
      return;
    }
    setPeriod(p);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
      <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Financial overview and analytics
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PeriodSelector value={period} onChange={handlePeriodChange} />
            <button
              onClick={handleRefresh}
              disabled={periodLoading || staticLoading}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              title="Refresh all data"
            >
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={(periodLoading || staticLoading) ? "animate-spin" : ""}
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Refresh
            </button>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Updated {lastRefreshed.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {/* KPI Cards */}
        <KpiCards data={financial} loading={periodLoading} />

        {/* Revenue vs Expense Trend */}
        <RevenueTrendChart data={trend} loading={periodLoading} />

        {/* Invoice & Bill Analytics */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <InvoiceAnalyticsCard data={invoiceAnalytics} loading={periodLoading} />
          <BillAnalyticsCard data={billAnalytics} loading={periodLoading} />
        </div>

        {/* Top Customers & Vendors */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <TopCustomersChart data={topCustomers} loading={periodLoading} />
          <TopVendorsChart data={topVendors} loading={periodLoading} />
        </div>

        {/* Cash Flow + Recent Activity */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <CashFlowCard data={cashFlow} loading={staticLoading} />
          </div>
          <RecentActivityFeed data={activity} loading={staticLoading} />
        </div>

        {/* Expense Breakdown + Inventory */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ExpenseBreakdownCard data={expenses} loading={periodLoading} />
          <InventoryStatsCard data={inventory} loading={staticLoading} />
        </div>

        {/* Project Overview */}
        <ProjectOverviewCard data={projects} loading={staticLoading} />

        {/* Period Comparison */}
        <PeriodComparisonCards data={comparison} loading={periodLoading} />
      </div>
    </div>
  );
};

export default DashboardPage;
