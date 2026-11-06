import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  TrendingUp,
  Receipt,
  Boxes,
  FileText,
  DollarSign,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { AppState } from '../types';
import { formatRupiah, formatNumber, formatDateShort, getTodayDateString } from '../utils/formatters';
import { exportReportToPDF } from '../services/pdfService';
import { exportReportToExcel } from '../services/excelService';

interface ReportsViewProps {
  appState: AppState;
}

type PeriodFilter = 'today' | 'yesterday' | '7days' | 'month' | 'last_month' | 'custom';

export const ReportsView: React.FC<ReportsViewProps> = ({ appState }) => {
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [customStart, setCustomStart] = useState<string>(getTodayDateString());
  const [customEnd, setCustomEnd] = useState<string>(getTodayDateString());

  // Determine date boundaries
  const { startDateStr, endDateStr, periodLabel } = useMemo(() => {
    const now = new Date();
    const todayStr = getTodayDateString();

    if (period === 'today') {
      return { startDateStr: todayStr, endDateStr: todayStr, periodLabel: 'Hari Ini' };
    }
    if (period === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
      return { startDateStr: yStr, endDateStr: yStr, periodLabel: 'Kemarin' };
    }
    if (period === '7days') {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 6);
      const past7Str = `${past7.getFullYear()}-${String(past7.getMonth() + 1).padStart(2, '0')}-${String(past7.getDate()).padStart(2, '0')}`;
      return { startDateStr: past7Str, endDateStr: todayStr, periodLabel: '7 Hari Terakhir' };
    }
    if (period === 'month') {
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      return {
        startDateStr: monthStart,
        endDateStr: todayStr,
        periodLabel: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(now),
      };
    }
    if (period === 'last_month') {
      const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const startStr = `${lastM.getFullYear()}-${String(lastM.getMonth() + 1).padStart(2, '0')}-01`;
      const endStr = `${lastMEnd.getFullYear()}-${String(lastMEnd.getMonth() + 1).padStart(2, '0')}-${String(lastMEnd.getDate()).padStart(2, '0')}`;
      return {
        startDateStr: startStr,
        endDateStr: endStr,
        periodLabel: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(lastM),
      };
    }
    // Custom
    return {
      startDateStr: customStart,
      endDateStr: customEnd,
      periodLabel: `${formatDateShort(customStart)} s/d ${formatDateShort(customEnd)}`,
    };
  }, [period, customStart, customEnd]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return appState.transactions.filter((tx) => {
      if (tx.status === 'cancelled') return false;
      const txDate = tx.date.split('T')[0];
      return txDate >= startDateStr && txDate <= endDateStr;
    });
  }, [appState.transactions, startDateStr, endDateStr]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return appState.expenses.filter((exp) => {
      return exp.date >= startDateStr && exp.date <= endDateStr;
    });
  }, [appState.expenses, startDateStr, endDateStr]);

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    return appState.purchases.filter((pur) => {
      return pur.date >= startDateStr && pur.date <= endDateStr;
    });
  }, [appState.purchases, startDateStr, endDateStr]);

  // Aggregated Report Metrics
  const reportSummary = useMemo(() => {
    let revenue = 0;
    let hpp = 0;
    let kebabsSold = 0;

    filteredTransactions.forEach((tx) => {
      revenue += tx.totalAmount || 0;
      hpp += tx.totalHpp || 0;
      tx.items.forEach((item) => {
        kebabsSold += item.quantity || 0;
      });
    });

    const grossProfit = revenue - hpp;

    const opExpenses = filteredExpenses
      .filter((e) => e.classification === 'operasional')
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const netProfit = grossProfit - opExpenses;

    const purchasesTotal = filteredPurchases.reduce((sum, p) => sum + (p.totalPrice || 0), 0);

    const inventoryValuation = appState.ingredients.reduce(
      (sum, ing) => sum + (ing.stock || 0) * (ing.unitCost || 0),
      0
    );

    return {
      totalRevenue: revenue,
      totalHpp: hpp,
      grossProfit,
      operationalExpenses: opExpenses,
      netProfit,
      kebabSold: kebabsSold,
      transactionCount: filteredTransactions.length,
      purchasesTotal,
      inventoryValuation,
    };
  }, [filteredTransactions, filteredExpenses, filteredPurchases, appState.ingredients]);

  // Download PDF
  const handleDownloadPDF = () => {
    exportReportToPDF({
      businessName: appState.settings.businessName,
      tagline: appState.settings.tagline,
      address: appState.settings.address,
      phone: appState.settings.phone,
      periodLabel,
      summary: reportSummary,
      transactions: filteredTransactions.map((tx) => ({
        id: tx.id,
        date: tx.date,
        totalAmount: tx.totalAmount,
        totalHpp: tx.totalHpp,
        grossProfit: tx.grossProfit,
        paymentMethod: tx.paymentMethod,
        itemSummary: tx.items.map((i) => `${i.productName} (${i.quantity})`).join(', '),
      })),
      expenses: filteredExpenses.map((exp) => ({
        id: exp.id,
        date: exp.date,
        category: exp.category,
        description: exp.description,
        amount: exp.amount,
      })),
    });
  };

  // Download Excel
  const handleDownloadExcel = () => {
    exportReportToExcel({
      businessName: appState.settings.businessName,
      periodLabel,
      summary: reportSummary,
      transactions: filteredTransactions.map((tx) => ({
        id: tx.id,
        date: tx.date,
        totalAmount: tx.totalAmount,
        totalHpp: tx.totalHpp,
        grossProfit: tx.grossProfit,
        paymentMethod: tx.paymentMethod,
        itemSummary: tx.items.map((i) => `${i.productName} (${i.quantity})`).join(', '),
      })),
      expenses: filteredExpenses.map((exp) => ({
        id: exp.id,
        date: exp.date,
        category: exp.category,
        classification: exp.classification,
        description: exp.description,
        amount: exp.amount,
      })),
      ingredients: appState.ingredients,
    });
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-3 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-stone-900 tracking-tight flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-red-700" />
            Laporan Keuangan & Laba Rugi
          </h2>
          <p className="text-[11px] text-stone-500 font-medium">
            Laporan otomatis periode harian, mingguan, dan bulanan
          </p>
        </div>
      </div>

      {/* Period Filter Buttons */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'yesterday', label: 'Kemarin' },
            { id: '7days', label: '7 Hari' },
            { id: 'month', label: 'Bulan Ini' },
            { id: 'last_month', label: 'Bulan Lalu' },
            { id: 'custom', label: 'Kustom' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id as PeriodFilter)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                period === item.id
                  ? 'bg-red-800 text-white font-bold shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers */}
        {period === 'custom' && (
          <div className="p-2.5 bg-white border border-stone-200 rounded-2xl flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-2 py-1 text-stone-800"
            />
            <span className="text-stone-400">s/d</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-2 py-1 text-stone-800"
            />
          </div>
        )}
      </div>

      {/* Download Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleDownloadPDF}
          className="py-2.5 px-3 bg-red-800 hover:bg-red-700 text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Unduh PDF</span>
        </button>
        <button
          onClick={handleDownloadExcel}
          className="py-2.5 px-3 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Unduh Excel (.xlsx)</span>
        </button>
      </div>

      {/* Main Income Statement Card (Laporan Laba Rugi) */}
      <div className="bg-white rounded-3xl p-4 border border-stone-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              Laporan Keuangan Periode
            </span>
            <h3 className="font-bold text-sm text-stone-900">{periodLabel}</h3>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            {reportSummary.transactionCount} Transaksi
          </span>
        </div>

        {/* Financial Flow Breakdown */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-stone-100">
            <span className="text-stone-600 font-medium">1. Total Omzet Penjualan</span>
            <span className="font-bold text-stone-900">
              {formatRupiah(reportSummary.totalRevenue)}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-stone-100">
            <span className="text-stone-600 font-medium">
              2. Modal Bahan Baku Terpakai (HPP)
            </span>
            <span className="font-bold text-red-600">
              - {formatRupiah(reportSummary.totalHpp)}
            </span>
          </div>

          <div className="flex justify-between py-1.5 px-2.5 bg-amber-50/70 rounded-xl font-bold">
            <span className="text-amber-950">= Keuntungan Kotor (Omzet - HPP)</span>
            <span className="text-amber-900">{formatRupiah(reportSummary.grossProfit)}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-stone-100">
            <span className="text-stone-600 font-medium">
              3. Total Biaya Operasional (Gas, Bensin, dll)
            </span>
            <span className="font-bold text-red-600">
              - {formatRupiah(reportSummary.operationalExpenses)}
            </span>
          </div>

          {/* Net Profit / Loss Highlight Banner */}
          <div className="mt-2 p-3 bg-stone-900 text-white rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-stone-300 font-medium uppercase tracking-wider block">
                {reportSummary.netProfit >= 0 ? 'Keuntungan Bersih (Laba Bersih)' : 'Kerugian Bersih'}
              </span>
              <div
                className={`text-lg font-black tracking-tight ${
                  reportSummary.netProfit >= 0 ? 'text-amber-300' : 'text-rose-400'
                }`}
              >
                {formatRupiah(reportSummary.netProfit)}
              </div>
            </div>
            <div
              className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                reportSummary.netProfit > 0
                  ? 'bg-emerald-500 text-white'
                  : reportSummary.netProfit === 0
                  ? 'bg-stone-700 text-stone-200'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {reportSummary.netProfit > 0 ? 'Untung' : reportSummary.netProfit === 0 ? 'Impas' : 'Rugi'}
            </div>
          </div>
        </div>
      </div>

      {/* Cashflow & Inventory Status Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">
            Pembelian Bahan Baku
          </span>
          <div className="text-sm font-black text-stone-900">
            {formatRupiah(reportSummary.purchasesTotal)}
          </div>
          <div className="text-[10px] text-stone-500">Arus kas belanja persediaan periode ini</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">
            Nilai Sisa Stok Saat Ini
          </span>
          <div className="text-sm font-black text-stone-900">
            {formatRupiah(reportSummary.inventoryValuation)}
          </div>
          <div className="text-[10px] text-stone-500">Aset bahan baku tersedia</div>
        </div>
      </div>

      {/* Note about real transactions */}
      <div className="p-3 bg-stone-100/80 rounded-2xl text-[11px] text-stone-500 text-center">
        Semua angka bersumber langsung dari pencatatan penjualan asli, komposisi resep HPP, dan pengeluaran operasional.
      </div>
    </div>
  );
};
