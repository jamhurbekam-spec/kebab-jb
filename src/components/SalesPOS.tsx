import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Printer,
  Share2,
  ReceiptText,
  Calendar,
  X,
  Clock,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppState, Product, SaleTransaction, SaleItem, Ingredient } from '../types';
import { formatRupiah, formatNumber, formatDateTime, formatDateShort, generateId } from '../utils/formatters';
import { calculateProductHPP, checkStockSufficiency } from '../services/storage';
import { ConfirmModal } from './ConfirmModal';

interface SalesPOSProps {
  appState: AppState;
  onSaveTransaction: (transaction: SaleTransaction, updatedIngredients: Ingredient[]) => void;
  onCancelTransaction: (transactionId: string) => void;
}

interface CartEntry {
  product: Product;
  quantity: number;
}

export const SalesPOS: React.FC<SalesPOSProps> = ({
  appState,
  onSaveTransaction,
  onCancelTransaction,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'pos' | 'history'>('pos');

  // POS State
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer / QRIS'>('Tunai');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [cancelModalTx, setCancelModalTx] = useState<SaleTransaction | null>(null);

  // Modals
  const [stockWarningModal, setStockWarningModal] = useState<{
    show: boolean;
    warnings: { ingredientName: string; required: number; available: number; unit: string; deficit: number }[];
  }>({ show: false, warnings: [] });

  const [lastCompletedTx, setLastCompletedTx] = useState<SaleTransaction | null>(null);
  const [selectedHistoryTx, setSelectedHistoryTx] = useState<SaleTransaction | null>(null);

  // History Filters
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyDateFilter, setHistoryDateFilter] = useState<'all' | 'today' | '7days'>('today');

  // Categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('Semua');
    appState.products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [appState.products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return appState.products.filter((p) => {
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch && p.isActive !== false;
    });
  }, [appState.products, selectedCategory, searchQuery]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const totalAmount = Math.max(0, cartSubtotal - discount);

  const numCashGiven = parseFloat(cashGiven.replace(/[^0-9]/g, '')) || 0;
  const changeAmount = paymentMethod === 'Tunai' ? Math.max(0, numCashGiven - totalAmount) : 0;

  // Add to Cart
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartEntry[];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscount(0);
    setCashGiven('');
    setNotes('');
  };

  // Pre-checkout stock check
  const handleInitiateCheckout = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'Tunai' && numCashGiven > 0 && numCashGiven < totalAmount) {
      alert(`Uang tunai yang diterima (${formatRupiah(numCashGiven)}) kurang dari total tagihan (${formatRupiah(totalAmount)}).`);
      return;
    }

    const check = checkStockSufficiency(cart, appState.ingredients);
    if (!check.isSufficient) {
      setStockWarningModal({
        show: true,
        warnings: check.warnings,
      });
      return;
    }

    processSaveTransaction();
  };

  // Commit Transaction
  const processSaveTransaction = () => {
    setStockWarningModal({ show: false, warnings: [] });

    // Prepare Sale Items with snapshot HPP
    let totalTxHpp = 0;
    const saleItems: SaleItem[] = cart.map((entry) => {
      const unitHpp = calculateProductHPP(entry.product, appState.ingredients);
      const itemSubtotal = entry.product.price * entry.quantity;
      const itemTotalHpp = unitHpp * entry.quantity;
      totalTxHpp += itemTotalHpp;

      return {
        productId: entry.product.id,
        productName: entry.product.name,
        quantity: entry.quantity,
        unitPrice: entry.product.price,
        subtotal: itemSubtotal,
        unitHpp,
        totalHpp: itemTotalHpp,
      };
    });

    const newTx: SaleTransaction = {
      id: generateId('TRX'),
      date: new Date().toISOString(),
      items: saleItems,
      subtotal: cartSubtotal,
      discount,
      totalAmount,
      totalHpp: totalTxHpp,
      grossProfit: totalAmount - totalTxHpp,
      paymentMethod,
      cashGiven: paymentMethod === 'Tunai' ? (numCashGiven || totalAmount) : undefined,
      change: paymentMethod === 'Tunai' ? changeAmount : undefined,
      notes: notes.trim() || undefined,
      status: 'completed',
    };

    // Auto reduce ingredients stock
    const updatedIngredients = [...appState.ingredients];
    cart.forEach((entry) => {
      if (!entry.product.recipe) return;
      entry.product.recipe.forEach((recipeItem) => {
        const ingIndex = updatedIngredients.findIndex((i) => i.id === recipeItem.ingredientId);
        if (ingIndex !== -1) {
          const needed = recipeItem.amount * entry.quantity;
          updatedIngredients[ingIndex] = {
            ...updatedIngredients[ingIndex],
            stock: Math.max(0, updatedIngredients[ingIndex].stock - needed),
            lastUpdated: new Date().toISOString(),
          };
        }
      });
    });

    onSaveTransaction(newTx, updatedIngredients);

    // Fire celebration confetti
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore in environments without canvas
    }

    setLastCompletedTx(newTx);
    handleClearCart();
    setIsCartOpen(false);
  };

  // Transaction History filtering
  const filteredHistory = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysStr = sevenDaysAgo.toISOString().split('T')[0];

    return appState.transactions
      .filter((tx) => {
        if (historyDateFilter === 'today') {
          if (!tx.date.startsWith(todayStr)) return false;
        } else if (historyDateFilter === '7days') {
          if (tx.date.split('T')[0] < sevenDaysStr) return false;
        }

        if (historySearch) {
          const q = historySearch.toLowerCase();
          const matchId = tx.id.toLowerCase().includes(q);
          const matchCust = tx.customerName?.toLowerCase().includes(q);
          const matchItem = tx.items.some((i) => i.productName.toLowerCase().includes(q));
          return matchId || matchCust || matchItem;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appState.transactions, historyDateFilter, historySearch]);

  return (
    <div className="flex-1 flex flex-col p-4 space-y-3">
      {/* Sub-tab Navigation */}
      <div className="flex bg-stone-200/80 p-1 rounded-2xl">
        <button
          onClick={() => setActiveSubTab('pos')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'pos'
              ? 'bg-red-800 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Kasir Penjualan</span>
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'history'
              ? 'bg-red-800 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <ReceiptText className="w-3.5 h-3.5" />
          <span>Riwayat ({appState.transactions.length})</span>
        </button>
      </div>

      {activeSubTab === 'pos' ? (
        <>
          {/* Search and Category Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Cari menu kebab..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-2xl pl-9 pr-3 py-2 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-red-700/30"
              />
            </div>

            {categories.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-red-800 text-white font-bold shadow-xs'
                        : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Grid / Empty State */}
          {filteredProducts.length === 0 ? (
            <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center p-6 text-center bg-white rounded-3xl border border-dashed border-stone-300">
              <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <ShoppingCart className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-stone-800">
                {appState.products.length === 0
                  ? 'Belum Ada Produk Kebab'
                  : 'Menu Tidak Ditemukan'}
              </h3>
              <p className="text-xs text-stone-500 max-w-xs mt-1">
                {appState.products.length === 0
                  ? 'Buka menu "Produk" di navigasi bawah untuk menambahkan varian kebab dan komposisi resep bahan.'
                  : 'Coba ubah kata kunci pencarian atau pilih kategori lain.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 pb-20">
              {filteredProducts.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                const hpp = calculateProductHPP(product, appState.ingredients);
                const profitEstimate = product.price - hpp;

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-xs flex flex-col justify-between hover:border-red-300 transition"
                  >
                    <div>
                      <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-1.5 py-0.5 rounded-md inline-block">
                        {product.category || 'Kebab'}
                      </span>
                      <h4 className="font-bold text-xs text-stone-900 mt-1 line-clamp-1">
                        {product.name}
                      </h4>
                      <div className="text-xs font-black text-amber-700 mt-0.5">
                        {formatRupiah(product.price)}
                      </div>
                      <div className="text-[10px] text-stone-400 mt-1 flex items-center justify-between">
                        <span>HPP: {formatRupiah(hpp)}</span>
                        <span className="text-emerald-700 font-semibold">+{formatRupiah(profitEstimate)}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                      {inCart ? (
                        <div className="flex items-center gap-2 w-full justify-between">
                          <button
                            onClick={() => handleUpdateQuantity(product.id, -1)}
                            className="w-7 h-7 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center hover:bg-stone-200 active:scale-95"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-stone-900">{inCart.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(product.id, 1)}
                            className="w-7 h-7 rounded-xl bg-red-800 text-white flex items-center justify-center hover:bg-red-700 active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="w-full py-1.5 px-2 bg-gradient-to-r from-red-800 to-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Pilih</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating Cart Bar (Appears when cart has items) */}
          {cart.length > 0 && !isCartOpen && (
            <div className="fixed bottom-16 left-0 right-0 px-4 flex justify-center z-30 pointer-events-none">
              <div className="w-full max-w-[420px] bg-stone-900 text-white rounded-2xl p-3 shadow-2xl flex items-center justify-between pointer-events-auto border border-stone-700/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-xs">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </div>
                  <div>
                    <div className="text-[11px] text-stone-400">Total Tagihan</div>
                    <div className="text-sm font-black text-amber-300">
                      {formatRupiah(totalAmount)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="bg-red-700 hover:bg-red-600 text-white text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition active:scale-95"
                >
                  <span>Lihat Pesanan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Riwayat Transaksi Sub-Tab */
        <div className="space-y-3 pb-20">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Cari ID transaksi / pelanggan..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-2xl pl-9 pr-3 py-2 text-xs text-stone-800 focus:outline-hidden"
              />
            </div>
            <div className="flex bg-white border border-stone-200 rounded-2xl p-0.5 text-xs font-medium">
              <button
                onClick={() => setHistoryDateFilter('today')}
                className={`px-2.5 py-1.5 rounded-xl transition ${
                  historyDateFilter === 'today' ? 'bg-red-800 text-white font-bold' : 'text-stone-600'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setHistoryDateFilter('7days')}
                className={`px-2.5 py-1.5 rounded-xl transition ${
                  historyDateFilter === '7days' ? 'bg-red-800 text-white font-bold' : 'text-stone-600'
                }`}
              >
                7 Hari
              </button>
              <button
                onClick={() => setHistoryDateFilter('all')}
                className={`px-2.5 py-1.5 rounded-xl transition ${
                  historyDateFilter === 'all' ? 'bg-red-800 text-white font-bold' : 'text-stone-600'
                }`}
              >
                Semua
              </button>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="min-h-[250px] flex flex-col items-center justify-center p-6 text-center bg-white rounded-3xl border border-stone-200 text-stone-500">
              <ReceiptText className="w-8 h-8 text-stone-300 mb-2" />
              <p className="text-xs font-semibold">Belum Ada Riwayat Transaksi</p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Setiap transaksi yang disimpan akan otomatis muncul di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredHistory.map((tx) => {
                const isCancelled = tx.status === 'cancelled';
                const totalQty = tx.items.reduce((s, i) => s + i.quantity, 0);

                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedHistoryTx(tx)}
                    className={`bg-white rounded-2xl p-3 border transition cursor-pointer ${
                      isCancelled
                        ? 'border-rose-200 bg-rose-50/40 opacity-75'
                        : 'border-stone-200/80 hover:border-red-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-stone-800">{tx.id}</span>
                        {isCancelled && (
                          <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
                            DIBATALKAN
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500">{formatDateTime(tx.date)}</span>
                    </div>

                    <div className="mt-1.5 text-xs text-stone-600 flex items-center justify-between">
                      <span className="truncate max-w-[200px]">
                        {tx.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                      </span>
                      <span className="font-bold text-stone-900 text-sm">
                        {formatRupiah(tx.totalAmount)}
                      </span>
                    </div>

                    <div className="mt-1 pt-1 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                      <span>Metode: {tx.paymentMethod}</span>
                      <span className="text-emerald-700 font-semibold">
                        Laba: {formatRupiah(tx.grossProfit)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Cart Modal / Checkout Bottom Sheet */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center p-0 md:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-red-800" />
                <h3 className="font-bold text-sm text-stone-900">Pesanan Pelanggan</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-200/80 flex items-center justify-center text-stone-600 hover:bg-stone-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Item List */}
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 border border-stone-100"
                  >
                    <div className="flex-1 pr-2">
                      <h5 className="font-bold text-xs text-stone-900">{item.product.name}</h5>
                      <span className="text-[11px] text-amber-800 font-semibold">
                        {formatRupiah(item.product.price)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-700"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, 1)}
                        className="w-6 h-6 rounded-lg bg-red-800 text-white flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="w-6 h-6 rounded-lg text-rose-500 hover:bg-rose-50 flex items-center justify-center ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount Input */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600 font-medium">Diskon / Potongan (Rp):</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-28 bg-white border border-stone-200 rounded-xl px-2 py-1 text-right text-xs font-bold text-stone-800 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Tunai')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      paymentMethod === 'Tunai'
                        ? 'border-red-800 bg-red-50 text-red-800'
                        : 'border-stone-200 text-stone-600 bg-white'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Tunai (Cash)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Transfer / QRIS')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      paymentMethod === 'Transfer / QRIS'
                        ? 'border-red-800 bg-red-50 text-red-800'
                        : 'border-stone-200 text-stone-600 bg-white'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Transfer / QRIS</span>
                  </button>
                </div>
              </div>

              {/* If Tunai: Cash Amount & Change Calculation */}
              {paymentMethod === 'Tunai' && (
                <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-950">Uang Diterima:</span>
                    <input
                      type="text"
                      placeholder={formatRupiah(totalAmount)}
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      className="w-36 bg-white border border-amber-300 rounded-xl px-2.5 py-1 text-right text-xs font-bold text-stone-900 focus:outline-hidden"
                    />
                  </div>

                  {/* Fast Cash Buttons */}
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      type="button"
                      onClick={() => setCashGiven(String(totalAmount))}
                      className="px-2 py-0.5 bg-amber-200/80 hover:bg-amber-300 text-amber-900 text-[10px] font-bold rounded-lg"
                    >
                      Uang Pas
                    </button>
                    {[20000, 50000, 100000].map((nominal) => {
                      if (nominal < totalAmount) return null;
                      return (
                        <button
                          key={nominal}
                          type="button"
                          onClick={() => setCashGiven(String(nominal))}
                          className="px-2 py-0.5 bg-white border border-amber-300 text-amber-900 text-[10px] font-semibold rounded-lg hover:bg-amber-100"
                        >
                          {formatRupiah(nominal)}
                        </button>
                      );
                    })}
                  </div>

                  {numCashGiven >= totalAmount && (
                    <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 text-xs">
                      <span className="font-bold text-emerald-800">Kembalian:</span>
                      <span className="font-black text-sm text-emerald-700">
                        {formatRupiah(changeAmount)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Optional Order Note (No Name Input) */}
              <div>
                <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                  Catatan Pesanan (opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: pedas sedang, tanpa timun"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-hidden"
                />
              </div>

              {/* Total Summary */}
              <div className="bg-stone-900 text-white p-3.5 rounded-2xl space-y-1 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} item)</span>
                  <span>{formatRupiah(cartSubtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Diskon</span>
                    <span>- {formatRupiah(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-stone-700">
                  <span>Total Tagihan</span>
                  <span className="text-amber-300">{formatRupiah(totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearCart}
                className="py-2.5 px-3 rounded-2xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-100"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleInitiateCheckout}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Transaksi (Bayar)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Insufficiency Warning Modal */}
      {stockWarningModal.show && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-sm text-stone-900">Peringatan: Stok Bahan Tidak Cukup</h4>
              <p className="text-xs text-stone-500 mt-1">
                Beberapa bahan baku berada di bawah kebutuhan resep penjualan ini:
              </p>
            </div>

            <div className="bg-stone-50 rounded-2xl p-3 space-y-2 border border-stone-200 max-h-40 overflow-y-auto">
              {stockWarningModal.warnings.map((w, idx) => (
                <div key={idx} className="text-xs flex items-center justify-between border-b border-stone-200/60 pb-1">
                  <div>
                    <span className="font-bold text-stone-800">{w.ingredientName}</span>
                    <div className="text-[10px] text-stone-500">
                      Tersedia: {w.available} {w.unit} | Butuh: {w.required} {w.unit}
                    </div>
                  </div>
                  <span className="text-rose-600 font-bold text-xs">
                    Kurang {w.deficit} {w.unit}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-stone-500 text-center italic">
              Apakah Anda tetap ingin melanjutkan transaksi ini? (Stok akan berkurang hingga 0).
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStockWarningModal({ show: false, warnings: [] })}
                className="flex-1 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold"
              >
                Batal / Periksa
              </button>
              <button
                type="button"
                onClick={processSaveTransaction}
                className="flex-1 py-2 rounded-xl bg-red-800 text-white text-xs font-bold hover:bg-red-700"
              >
                Ya, Tetap Lanjut
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed Transaction Digital Receipt Modal */}
      {lastCompletedTx && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-stone-900 text-sm">Transaksi Berhasil Disimpan</h4>
              <p className="text-xs text-stone-500">Stok bahan baku otomatis berkurang.</p>
            </div>

            {/* Receipt Box */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-dashed border-stone-300 space-y-2 text-xs">
              <div className="text-center pb-2 border-b border-stone-200">
                <div className="font-black text-stone-800">{appState.settings.businessName}</div>
                <div className="text-[10px] text-stone-400">{lastCompletedTx.id}</div>
                <div className="text-[10px] text-stone-400">{formatDateTime(lastCompletedTx.date)}</div>
              </div>

              <div className="space-y-1 py-1">
                {lastCompletedTx.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {it.productName} x {it.quantity}
                    </span>
                    <span className="font-semibold">{formatRupiah(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              {lastCompletedTx.discount > 0 && (
                <div className="flex justify-between text-amber-700 pt-1 border-t border-stone-200">
                  <span>Diskon</span>
                  <span>- {formatRupiah(lastCompletedTx.discount)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-stone-200 text-sm">
                <span>Total Bayar</span>
                <span>{formatRupiah(lastCompletedTx.totalAmount)}</span>
              </div>

              <div className="text-[11px] text-stone-500 flex justify-between">
                <span>Metode: {lastCompletedTx.paymentMethod}</span>
                {lastCompletedTx.change !== undefined && (
                  <span>Kembalian: {formatRupiah(lastCompletedTx.change)}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 px-3 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-stone-50"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Nota</span>
              </button>
              <button
                type="button"
                onClick={() => setLastCompletedTx(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-red-800 text-white text-xs font-bold hover:bg-red-700"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Detail Modal with Cancellation Action */}
      {selectedHistoryTx && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div>
                <h4 className="font-bold text-stone-900 text-sm">Rincian Transaksi</h4>
                <span className="text-[11px] text-stone-400">{selectedHistoryTx.id}</span>
              </div>
              <button
                onClick={() => setSelectedHistoryTx(null)}
                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-stone-500">
                <span>Waktu</span>
                <span className="font-medium text-stone-800">{formatDateTime(selectedHistoryTx.date)}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Status</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    selectedHistoryTx.status === 'cancelled'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {selectedHistoryTx.status === 'cancelled' ? 'Dibatalkan' : 'Selesai'}
                </span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Metode Pembayaran</span>
                <span className="font-medium text-stone-800">{selectedHistoryTx.paymentMethod}</span>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <span className="font-bold text-stone-700 block mb-1">Item Penjualan:</span>
                {selectedHistoryTx.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between py-0.5">
                    <span>
                      {i.productName} ({i.quantity}x @{formatRupiah(i.unitPrice)})
                    </span>
                    <span className="font-semibold">{formatRupiah(i.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-stone-100 flex justify-between font-bold text-stone-900 text-sm">
                <span>Total Penjualan</span>
                <span className="text-amber-800">{formatRupiah(selectedHistoryTx.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-stone-500">
                <span>HPP Modal Terpakai</span>
                <span>{formatRupiah(selectedHistoryTx.totalHpp)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-emerald-700 font-bold">
                <span>Keuntungan Kotor Transaksi</span>
                <span>{formatRupiah(selectedHistoryTx.grossProfit)}</span>
              </div>
            </div>

            {/* Cancel Transaction Button (Stock Reversal) */}
            {selectedHistoryTx.status !== 'cancelled' && (
              <div className="pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setCancelModalTx(selectedHistoryTx)}
                  className="w-full py-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Batalkan Transaksi & Kembalikan Stok</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Transaction Cancellation */}
      <ConfirmModal
        isOpen={Boolean(cancelModalTx)}
        title="Batalkan Transaksi?"
        message="Apakah Anda yakin ingin membatalkan transaksi ini? Stok bahan baku yang telah digunakan akan otomatis dikembalikan ke inventori."
        itemName={cancelModalTx ? `${cancelModalTx.id} - ${formatRupiah(cancelModalTx.totalAmount)}` : undefined}
        confirmLabel="Ya, Batalkan"
        cancelLabel="Kembali"
        isDanger={true}
        onConfirm={() => {
          if (cancelModalTx) {
            onCancelTransaction(cancelModalTx.id);
            setCancelModalTx(null);
            setSelectedHistoryTx(null);
          }
        }}
        onCancel={() => setCancelModalTx(null)}
      />
    </div>
  );
};
