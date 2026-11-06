import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Receipt,
  Layers,
  Coins,
  AlertTriangle,
  Calendar,
  BarChart3,
  Flame,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { AppState } from '../types';
import { formatRupiah, formatNumber, getTodayDateString } from '../utils/formatters';

interface DashboardProps {
  appState: AppState;
}

export const Dashboard: React.FC<DashboardProps> = ({ appState }) => {
  const [chartMode, setChartMode] = useState<'daily' | 'monthly'>('daily');
  const todayStr = getTodayDateString();

  // Metrics for Today
  const {
    todaySales,
    todayKebabCount,
    todayHpp,
    todayExpenses,
    todayNetProfit,
    todayGrossProfit,
    todayTxCount,
  } = useMemo(() => {
    const todayTransactions = appState.transactions.filter(
      (tx) => tx.status !== 'cancelled' && tx.date.startsWith(todayStr)
    );

    let sales = 0;
    let kebabs = 0;
    let hpp = 0;

    todayTransactions.forEach((tx) => {
      sales += tx.totalAmount || 0;
      hpp += tx.totalHpp || 0;
      tx.items.forEach((item) => {
        kebabs += item.quantity || 0;
      });
    });

    const todayOpExpenses = appState.expenses
      .filter((exp) => exp.date === todayStr && exp.classification === 'operasional')
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);

    const gross = sales - hpp;
    const net = gross - todayOpExpenses;

    return {
      todaySales: sales,
      todayKebabCount: kebabs,
      todayHpp: hpp,
      todayExpenses: todayOpExpenses,
      todayNetProfit: net,
      todayGrossProfit: gross,
      todayTxCount: todayTransactions.length,
    };
  }, [appState.transactions, appState.expenses, todayStr]);

  // Inventory Status
  const { totalIngredients, availableIngredients, lowStockIngredients, totalInventoryValuation } = useMemo(() => {
    let available = 0;
    let low = 0;
    let valuation = 0;

    appState.ingredients.forEach((ing) => {
      if (ing.stock > 0) available++;
      if (ing.stock <= ing.minStockAlert) low++;
      valuation += (ing.stock || 0) * (ing.unitCost || 0);
    });

    return {
      totalIngredients: appState.ingredients.length,
      availableIngredients: available,
      lowStockIngredients: low,
      totalInventoryValuation: valuation,
    };
  }, [appState.ingredients]);

  // Daily Chart Data: Last 7 Days
  const dailyData = useMemo(() => {
    const days: { date: string; label: string; sales: number; qty: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });

      const txs = appState.transactions.filter(
        (tx) => tx.status !== 'cancelled' && tx.date.startsWith(dateString)
      );

      const daySales = txs.reduce((acc, t) => acc + (t.totalAmount || 0), 0);
      const dayQty = txs.reduce((acc, t) => acc + t.items.reduce((s, it) => s + (it.quantity || 0), 0), 0);

      days.push({
        date: dateString,
        label: dayLabel,
        sales: daySales,
        qty: dayQty,
      });
    }

    const maxSales = Math.max(...days.map((d) => d.sales), 100000);
    return { days, maxSales };
  }, [appState.transactions]);

  // Monthly Chart Data: Last 6 Months
  const monthlyData = useMemo(() => {
    const months: { key: string; label: string; sales: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('id-ID', { month: 'short' });

      const txs = appState.transactions.filter(
        (tx) => tx.status !== 'cancelled' && tx.date.startsWith(yearMonth)
      );

      const monthSales = txs.reduce((acc, t) => acc + (t.totalAmount || 0), 0);
      months.push({
        key: yearMonth,
        label: monthLabel,
        sales: monthSales,
      });
    }

    const maxMonthSales = Math.max(...months.map((m) => m.sales), 200000);
    return { months, maxMonthSales };
  }, [appState.transactions]);

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4">
      {/* Executive Financial Performance Card */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 text-white rounded-3xl p-4.5 shadow-xl border border-stone-800 relative overflow-hidden">
        {/* Subtle decorative radial glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Top Header of Card */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-[11px] font-black uppercase tracking-wider text-stone-300">
              Ringkasan Hari Ini
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-stone-800/80 px-2.5 py-1 rounded-full text-[10px] text-stone-300 font-medium border border-stone-700/60">
            <Calendar className="w-3 h-3 text-amber-400" />
            <span>{todayFormatted}</span>
          </div>
        </div>

        {/* Highlight: Keuntungan Bersih */}
        <div className="mt-3.5 flex items-start justify-between">
          <div>
            <span className="text-[11px] text-stone-400 font-semibold tracking-wide flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              Keuntungan Bersih Hari Ini
            </span>
            <div className="text-3xl font-black tracking-tight text-white mt-1">
              {formatRupiah(todayNetProfit)}
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">
              Omzet dikurangi HPP bahan baku & biaya operasional
            </div>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
              todayNetProfit > 0
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : todayNetProfit === 0
                ? 'bg-stone-800 text-stone-400 border-stone-700'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            }`}
          >
            {todayNetProfit > 0 ? '● Untung' : todayNetProfit === 0 ? '● Impas' : '● Rugi'}
          </div>
        </div>

        {/* Micro-metrics Trio */}
        <div className="mt-4 pt-3 border-t border-stone-800 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-stone-800/40 rounded-xl p-1.5">
            <span className="text-[10px] text-stone-400 block">Omzet</span>
            <span className="font-bold text-amber-300 text-xs">{formatRupiah(todaySales)}</span>
          </div>
          <div className="bg-stone-800/40 rounded-xl p-1.5">
            <span className="text-[10px] text-stone-400 block">Terjual</span>
            <span className="font-bold text-white text-xs">{formatNumber(todayKebabCount)} Porsi</span>
          </div>
          <div className="bg-stone-800/40 rounded-xl p-1.5">
            <span className="text-[10px] text-stone-400 block">Modal HPP</span>
            <span className="font-bold text-red-300 text-xs">{formatRupiah(todayHpp)}</span>
          </div>
        </div>
      </div>

      {/* Grid Ringkasan 4 Kartu Utama Hari Ini */}
      <div className="grid grid-cols-2 gap-3">
        {/* 1. Total Penjualan Hari Ini */}
        <div className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
              Penjualan Hari Ini
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-bold text-stone-900 leading-snug">
              {formatRupiah(todaySales)}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5 font-medium">
              {todayTxCount} Transaksi
            </div>
          </div>
        </div>

        {/* 2. Jumlah Kebab Terjual */}
        <div className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
              Kebab Terjual
            </span>
            <div className="w-7 h-7 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-bold text-stone-900 leading-snug">
              {formatNumber(todayKebabCount)} <span className="text-xs font-normal text-stone-500">Porsi</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5 font-medium">
              Total porsi hari ini
            </div>
          </div>
        </div>

        {/* 3. Modal Bahan Terpakai (HPP) */}
        <div className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
              HPP Bahan Terpakai
            </span>
            <div className="w-7 h-7 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-bold text-stone-900 leading-snug">
              {formatRupiah(todayHpp)}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5 font-medium">
              Modal dari porsi terjual
            </div>
          </div>
        </div>

        {/* 4. Total Pengeluaran Hari Ini */}
        <div className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
              Pengeluaran Hari Ini
            </span>
            <div className="w-7 h-7 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-bold text-stone-900 leading-snug">
              {formatRupiah(todayExpenses)}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5 font-medium">
              Biaya operasional
            </div>
          </div>
        </div>
      </div>

      {/* Ringkasan Laba Rugi Hari Ini (Comprehensive Breakdown) */}
      <div className="bg-white rounded-3xl p-4 border border-stone-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-red-700" />
            Ringkasan Laba Rugi Hari Ini
          </h2>
          <span className="text-[11px] text-stone-400 font-medium">Otomatis Terhitung</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-stone-100">
            <span className="text-stone-600">Total Omzet Penjualan</span>
            <span className="font-semibold text-stone-900">{formatRupiah(todaySales)}</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-stone-100">
            <span className="text-stone-600">Modal Bahan Baku Terpakai (HPP)</span>
            <span className="font-semibold text-red-600">- {formatRupiah(todayHpp)}</span>
          </div>
          <div className="flex items-center justify-between py-1 bg-amber-50/60 px-2 rounded-lg font-medium">
            <span className="text-amber-900">Keuntungan Kotor (Omzet - HPP)</span>
            <span className="font-bold text-amber-900">{formatRupiah(todayGrossProfit)}</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-stone-100">
            <span className="text-stone-600">Biaya Operasional (Gas, Bensin, dll)</span>
            <span className="font-semibold text-red-600">- {formatRupiah(todayExpenses)}</span>
          </div>
          <div className="flex items-center justify-between pt-2 px-2 py-1.5 bg-stone-900 text-white rounded-xl font-bold">
            <span className="text-stone-200">Keuntungan Bersih (Laba Bersih)</span>
            <span className={`text-sm ${todayNetProfit >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
              {formatRupiah(todayNetProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Ringkasan Stok Bahan Baku Tersedia */}
      <div className="bg-white rounded-3xl p-4 border border-stone-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-4 h-4 text-amber-600" />
            Ketersediaan Stok Bahan Baku
          </h2>
          <span className="text-[11px] text-stone-500 font-medium">
            {totalIngredients} Bahan Terdaftar
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900">
                {availableIngredients} <span className="text-[10px] font-normal text-stone-500">Bahan</span>
              </div>
              <div className="text-[10px] text-stone-500">Stok Tersedia</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-900">
                {lowStockIngredients} <span className="text-[10px] font-normal text-amber-700">Bahan</span>
              </div>
              <div className="text-[10px] text-amber-700">Hampir Habis</div>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
          <span className="text-stone-500">Estimasi Nilai Persediaan Bahan:</span>
          <span className="font-bold text-stone-900">{formatRupiah(totalInventoryValuation)}</span>
        </div>
      </div>

      {/* Grafik Penjualan Harian dan Bulanan */}
      <div className="bg-white rounded-3xl p-4 border border-stone-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-red-700" />
            <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              {chartMode === 'daily' ? 'Grafik Penjualan 7 Hari' : 'Grafik Penjualan Bulanan'}
            </h2>
          </div>
          {/* Toggle Daily / Monthly */}
          <div className="bg-stone-100 p-0.5 rounded-xl flex items-center text-[10px] font-semibold">
            <button
              onClick={() => setChartMode('daily')}
              className={`px-2 py-0.5 rounded-lg transition ${
                chartMode === 'daily' ? 'bg-white text-red-800 shadow-2xs font-bold' : 'text-stone-500'
              }`}
            >
              Harian
            </button>
            <button
              onClick={() => setChartMode('monthly')}
              className={`px-2 py-0.5 rounded-lg transition ${
                chartMode === 'monthly' ? 'bg-white text-red-800 shadow-2xs font-bold' : 'text-stone-500'
              }`}
            >
              Bulanan
            </button>
          </div>
        </div>

        {/* Chart View */}
        {chartMode === 'daily' ? (
          <div>
            <div className="h-36 flex items-end justify-between gap-1 pt-4 pb-1 border-b border-stone-100">
              {dailyData.days.map((day) => {
                const heightPercent = Math.max(
                  (day.sales / dailyData.maxSales) * 100,
                  day.sales > 0 ? 8 : 2
                );
                const isToday = day.date === todayStr;

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="text-[9px] text-stone-400 font-semibold mb-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      {formatRupiah(day.sales)}
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 relative ${
                        isToday
                          ? 'bg-gradient-to-t from-red-700 to-amber-500'
                          : day.sales > 0
                          ? 'bg-gradient-to-t from-stone-400 to-amber-400'
                          : 'bg-stone-200'
                      }`}
                    >
                      {day.qty > 0 && (
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-stone-700">
                          {day.qty}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] mt-1.5 font-medium ${isToday ? 'text-red-700 font-bold' : 'text-stone-500'}`}>
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[10px] text-stone-400 mt-2">
              <span>* Batang menunjukkan omzet & jumlah porsi terjual</span>
              <span className="font-medium text-stone-500">Maks: {formatRupiah(dailyData.maxSales)}</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="h-36 flex items-end justify-between gap-2 pt-4 pb-1 border-b border-stone-100">
              {monthlyData.months.map((m) => {
                const heightPercent = Math.max(
                  (m.sales / monthlyData.maxMonthSales) * 100,
                  m.sales > 0 ? 8 : 2
                );
                return (
                  <div key={m.key} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="text-[9px] text-stone-400 font-semibold mb-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      {formatRupiah(m.sales)}
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[32px] rounded-t-lg transition-all duration-300 ${
                        m.sales > 0
                          ? 'bg-gradient-to-t from-red-800 to-orange-500'
                          : 'bg-stone-200'
                      }`}
                    ></div>
                    <span className="text-[10px] mt-1.5 text-stone-500 font-medium">
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[10px] text-stone-400 mt-2">
              <span>* Penjualan per bulan dalam tahun berjalan</span>
              <span className="font-medium text-stone-500">Maks: {formatRupiah(monthlyData.maxMonthSales)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Note: Strictly NO transaction button or add data button on dashboard, as requested! */}
      <div className="p-3 bg-stone-100/70 border border-stone-200/60 rounded-2xl text-[11px] text-stone-500 text-center">
        Data diperbarui secara real-time dari setiap transaksi kasir, pembelian bahan, dan pencatatan biaya.
      </div>
    </div>
  );
};
