import React, { useState, useMemo, useRef } from 'react';
import {
  Boxes,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Search,
  FileSpreadsheet,
  Download,
  Upload,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Calendar,
  Layers,
  ShoppingBag,
} from 'lucide-react';
import { AppState, Ingredient, PurchaseItem, UnitType } from '../types';
import { formatRupiah, formatNumber, formatDateShort, getTodayDateString, generateId } from '../utils/formatters';
import { downloadPurchaseTemplate, parsePurchasesExcelFile, ParsedPurchaseRow } from '../services/excelService';
import { ConfirmModal } from './ConfirmModal';

interface InventoryManagementProps {
  appState: AppState;
  onSaveIngredient: (ingredient: Ingredient) => void;
  onDeleteIngredient: (id: string) => void;
  onAdjustStock: (id: string, delta: number, reason: string) => void;
  onSavePurchase: (purchase: PurchaseItem, updatedIngredient: Ingredient) => void;
  onUpdatePurchase: (purchase: PurchaseItem, updatedIngredient: Ingredient) => void;
  onDeletePurchase: (id: string) => void;
  onBatchImportPurchases: (newPurchases: PurchaseItem[], updatedIngredients: Ingredient[]) => void;
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({
  appState,
  onSaveIngredient,
  onDeleteIngredient,
  onAdjustStock,
  onSavePurchase,
  onUpdatePurchase,
  onDeletePurchase,
  onBatchImportPurchases,
}) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'purchases'>('stock');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(false);

  // Modals
  const [isAddIngredientModalOpen, setIsAddIngredientModalOpen] = useState<boolean>(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [ingredientToDelete, setIngredientToDelete] = useState<Ingredient | null>(null);

  const [adjustStockModal, setAdjustStockModal] = useState<{
    show: boolean;
    ingredient: Ingredient | null;
    type: 'in' | 'out';
  }>({ show: false, ingredient: null, type: 'in' });
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState<boolean>(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseItem | null>(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState<PurchaseItem | null>(null);

  // Excel Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelPreviewModal, setExcelPreviewModal] = useState<{
    show: boolean;
    validRows: ParsedPurchaseRow[];
    errors: string[];
  }>({ show: false, validRows: [], errors: [] });
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Ingredient Form State
  const [ingName, setIngName] = useState<string>('');
  const [ingCategory, setIngCategory] = useState<string>('Kulit & Roti');
  const [ingStock, setIngStock] = useState<string>('0');
  const [ingUnit, setIngUnit] = useState<UnitType>('pcs');
  const [ingUnitCost, setIngUnitCost] = useState<string>('');
  const [ingMinAlert, setIngMinAlert] = useState<string>(String(appState.settings.defaultMinStock || 5));
  const [ingNotes, setIngNotes] = useState<string>('');

  // Purchase Form State
  const [purIngredientId, setPurIngredientId] = useState<string>('');
  const [purQuantity, setPurQuantity] = useState<string>('');
  const [purPricePerUnit, setPurPricePerUnit] = useState<string>('');
  const [purSupplier, setPurSupplier] = useState<string>('');
  const [purDate, setPurDate] = useState<string>(getTodayDateString());
  const [purNotes, setPurNotes] = useState<string>('');

  const availableUnits: UnitType[] = [
    'pcs',
    'lembar',
    'gram',
    'kg',
    'ml',
    'liter',
    'bungkus',
    'botol',
    'butir',
    'roll',
    'porsi',
  ];

  // Categories
  const categories = useMemo(() => {
    const list = [...appState.settings.customIngredientCategories];
    appState.ingredients.forEach((i) => {
      if (i.category && !list.includes(i.category)) {
        list.push(i.category);
      }
    });
    return list;
  }, [appState.settings.customIngredientCategories, appState.ingredients]);

  // Filtered Ingredients
  const filteredIngredients = useMemo(() => {
    return appState.ingredients.filter((ing) => {
      const matchCat = selectedCategory === 'Semua' || ing.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        ing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ing.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLow = !showLowStockOnly || ing.stock <= ing.minStockAlert;
      return matchCat && matchSearch && matchLow;
    });
  }, [appState.ingredients, selectedCategory, searchQuery, showLowStockOnly]);

  // Open Ingredient Form
  const handleOpenAddIngredient = () => {
    setEditingIngredient(null);
    setIngName('');
    setIngCategory(categories[0] || 'Kulit & Roti');
    setIngStock('0');
    setIngUnit('pcs');
    setIngUnitCost('');
    setIngMinAlert(String(appState.settings.defaultMinStock || 5));
    setIngNotes('');
    setIsAddIngredientModalOpen(true);
  };

  const handleOpenEditIngredient = (ing: Ingredient) => {
    setEditingIngredient(ing);
    setIngName(ing.name);
    setIngCategory(ing.category);
    setIngStock(String(ing.stock));
    setIngUnit(ing.unit);
    setIngUnitCost(String(ing.unitCost));
    setIngMinAlert(String(ing.minStockAlert));
    setIngNotes(ing.notes || '');
    setIsAddIngredientModalOpen(true);
  };

  const handleSaveIngredientForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingName.trim()) {
      alert('Nama bahan baku wajib diisi.');
      return;
    }

    const newIng: Ingredient = {
      id: editingIngredient ? editingIngredient.id : generateId('ING'),
      name: ingName.trim(),
      category: ingCategory,
      stock: parseFloat(ingStock) || 0,
      unit: ingUnit,
      unitCost: parseFloat(ingUnitCost) || 0,
      minStockAlert: parseFloat(ingMinAlert) || 0,
      lastUpdated: new Date().toISOString(),
      notes: ingNotes.trim() || undefined,
    };

    onSaveIngredient(newIng);
    setIsAddIngredientModalOpen(false);
  };

  // Stock In / Out Adjustment
  const handleApplyAdjustment = () => {
    if (!adjustStockModal.ingredient) return;
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Jumlah penyesuaian stok harus lebih dari 0.');
      return;
    }

    const delta = adjustStockModal.type === 'in' ? amount : -amount;
    onAdjustStock(
      adjustStockModal.ingredient.id,
      delta,
      adjustReason.trim() || (adjustStockModal.type === 'in' ? 'Stok Masuk Manual' : 'Stok Keluar / Terbuang')
    );
    setAdjustStockModal({ show: false, ingredient: null, type: 'in' });
    setAdjustAmount('');
    setAdjustReason('');
  };

  // Open Purchase Modal
  const handleOpenPurchaseModal = () => {
    setEditingPurchase(null);
    setPurIngredientId(appState.ingredients[0]?.id || '');
    setPurQuantity('');
    setPurPricePerUnit(appState.ingredients[0] ? String(appState.ingredients[0].unitCost) : '');
    setPurSupplier('');
    setPurDate(getTodayDateString());
    setPurNotes('');
    setIsPurchaseModalOpen(true);
  };

  const handleOpenEditPurchase = (purchase: PurchaseItem) => {
    setEditingPurchase(purchase);
    setPurIngredientId(purchase.ingredientId);
    setPurQuantity(String(purchase.quantity));
    setPurPricePerUnit(String(purchase.pricePerUnit));
    setPurSupplier(purchase.supplier || '');
    setPurDate(purchase.date);
    setPurNotes(purchase.notes || '');
    setIsPurchaseModalOpen(true);
  };

  const handleSavePurchaseForm = (e: React.FormEvent) => {
    e.preventDefault();
    const ing = appState.ingredients.find((i) => i.id === purIngredientId);
    if (!ing) {
      alert('Pilih bahan baku yang dibeli.');
      return;
    }
    const qty = parseFloat(purQuantity);
    const price = parseFloat(purPricePerUnit);

    if (isNaN(qty) || qty <= 0) {
      alert('Jumlah pembelian harus lebih dari 0.');
      return;
    }
    if (isNaN(price) || price < 0) {
      alert('Harga beli satuan harus valid.');
      return;
    }

    const total = Math.round(qty * price);

    if (editingPurchase) {
      const stockDiff = qty - editingPurchase.quantity;
      const updatedPurchase: PurchaseItem = {
        ...editingPurchase,
        date: purDate,
        ingredientId: ing.id,
        ingredientName: ing.name,
        supplier: purSupplier.trim() || undefined,
        quantity: qty,
        unit: ing.unit,
        pricePerUnit: price,
        totalPrice: total,
        notes: purNotes.trim() || undefined,
      };

      const updatedIng: Ingredient = {
        ...ing,
        stock: Math.max(0, ing.stock + stockDiff),
        unitCost: price > 0 ? price : ing.unitCost,
        lastUpdated: new Date().toISOString(),
      };

      onUpdatePurchase(updatedPurchase, updatedIng);
    } else {
      const purchase: PurchaseItem = {
        id: generateId('BELI'),
        date: purDate,
        ingredientId: ing.id,
        ingredientName: ing.name,
        supplier: purSupplier.trim() || undefined,
        quantity: qty,
        unit: ing.unit,
        pricePerUnit: price,
        totalPrice: total,
        notes: purNotes.trim() || undefined,
      };

      const updatedIng: Ingredient = {
        ...ing,
        stock: ing.stock + qty,
        unitCost: price > 0 ? price : ing.unitCost,
        lastUpdated: new Date().toISOString(),
      };

      onSavePurchase(purchase, updatedIng);
    }
    setIsPurchaseModalOpen(false);
  };

  // Excel File Upload & Validation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await parsePurchasesExcelFile(file);
      setExcelPreviewModal({
        show: true,
        validRows: result.validRows,
        errors: result.errors,
      });
    } catch (err) {
      alert('Gagal membaca berkas Excel: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCommitExcelImport = () => {
    const { validRows } = excelPreviewModal;
    if (validRows.length === 0) return;

    const newPurchases: PurchaseItem[] = [];
    const updatedIngredients = [...appState.ingredients];

    validRows.forEach((row) => {
      let targetIng = updatedIngredients.find(
        (i) => i.name.toLowerCase() === row.ingredientName.toLowerCase()
      );

      if (!targetIng) {
        // Create new ingredient if not found
        targetIng = {
          id: generateId('ING'),
          name: row.ingredientName,
          category: row.category || 'Daging & Isian',
          stock: row.quantity,
          unit: row.unit,
          unitCost: row.pricePerUnit,
          minStockAlert: appState.settings.defaultMinStock || 5,
          lastUpdated: new Date().toISOString(),
        };
        updatedIngredients.push(targetIng);
      } else {
        // Update stock
        targetIng.stock += row.quantity;
        if (row.pricePerUnit > 0) {
          targetIng.unitCost = row.pricePerUnit;
        }
        targetIng.lastUpdated = new Date().toISOString();
      }

      newPurchases.push({
        id: generateId('BELI'),
        date: row.date,
        ingredientId: targetIng.id,
        ingredientName: targetIng.name,
        supplier: row.supplier || undefined,
        quantity: row.quantity,
        unit: row.unit,
        pricePerUnit: row.pricePerUnit,
        totalPrice: row.totalPrice,
        notes: row.notes || 'Impor Excel',
      });
    });

    onBatchImportPurchases(newPurchases, updatedIngredients);
    setExcelPreviewModal({ show: false, validRows: [], errors: [] });
    alert(`Berhasil mengimpor ${newPurchases.length} data pembelian bahan baku! Stok telah bertambah.`);
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-3 pb-20">
      {/* Sub-tab Navigation */}
      <div className="flex bg-stone-200/80 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'stock' ? 'bg-red-800 text-white shadow-xs' : 'text-stone-600'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Stok Bahan Baku ({appState.ingredients.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('purchases')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'purchases' ? 'bg-red-800 text-white shadow-xs' : 'text-stone-600'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Pembelian / Restock ({appState.purchases.length})</span>
        </button>
      </div>

      {activeTab === 'stock' ? (
        <>
          {/* Header & Add Button */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-stone-900">Persediaan Bahan</h3>
              <p className="text-[11px] text-stone-500">Stok berkurang otomatis dari penjualan</p>
            </div>
            <button
              onClick={handleOpenAddIngredient}
              className="bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white text-xs font-bold py-2 px-3.5 rounded-2xl flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Bahan</span>
            </button>
          </div>

          {/* Search, Filter, and Low Stock Warning Toggle */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Cari kulit, daging, saus..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-2xl pl-9 pr-3 py-2 text-xs text-stone-800 focus:outline-hidden"
                />
              </div>

              <button
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 border transition ${
                  showLowStockOnly
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Menipis</span>
              </button>
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedCategory('Semua')}
                className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                  selectedCategory === 'Semua'
                    ? 'bg-red-800 text-white font-bold'
                    : 'bg-white text-stone-600 border border-stone-200'
                }`}
              >
                Semua
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-red-800 text-white font-bold'
                      : 'bg-white text-stone-600 border border-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredient List / Empty State */}
          {filteredIngredients.length === 0 ? (
            <div className="min-h-[280px] flex flex-col items-center justify-center p-6 text-center bg-white rounded-3xl border border-dashed border-stone-300">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <Boxes className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-stone-800">
                {appState.ingredients.length === 0 ? 'Belum Ada Bahan Baku' : 'Bahan Baku Tidak Ditemukan'}
              </h4>
              <p className="text-xs text-stone-500 max-w-xs mt-1">
                {appState.ingredients.length === 0
                  ? 'Catat bahan baku seperti Kulit Tortilla, Daging Kebab, Saus Sambal, Mayones, dan Keju untuk melacak persediaan.'
                  : 'Coba ubah filter pencarian atau matikan filter stok menipis.'}
              </p>
              {appState.ingredients.length === 0 && (
                <button
                  onClick={handleOpenAddIngredient}
                  className="mt-4 py-2 px-4 bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-red-700 active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Bahan Baku Pertama</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredIngredients.map((ing) => {
                const isLow = ing.stock <= ing.minStockAlert;
                const totalValue = Math.round(ing.stock * ing.unitCost);

                return (
                  <div
                    key={ing.id}
                    className={`bg-white rounded-2xl p-3.5 border transition ${
                      isLow ? 'border-amber-300 bg-amber-50/20 shadow-xs' : 'border-stone-200/90 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                            {ing.category}
                          </span>
                          {isLow && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Stok Menipis
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-stone-900 mt-1">{ing.name}</h4>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          Harga Beli: {formatRupiah(ing.unitCost)} / {ing.unit}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-black text-stone-900">
                          {formatNumber(ing.stock)}{' '}
                          <span className="text-xs font-medium text-stone-500">{ing.unit}</span>
                        </div>
                        <div className="text-[10px] text-stone-400">
                          Nilai: {formatRupiah(totalValue)}
                        </div>
                      </div>
                    </div>

                    {/* Stock In / Stock Out Quick Action Buttons */}
                    <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setAdjustStockModal({ show: true, ingredient: ing, type: 'in' })}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg flex items-center gap-1 transition"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>Stok Masuk</span>
                        </button>
                        <button
                          onClick={() => setAdjustStockModal({ show: true, ingredient: ing, type: 'out' })}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold rounded-lg flex items-center gap-1 transition"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>Stok Keluar</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditIngredient(ing)}
                          className="w-7 h-7 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 flex items-center justify-center"
                          title="Edit Bahan"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setIngredientToDelete(ing)}
                          className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center cursor-pointer"
                          title="Hapus Bahan"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Pembelian / Restock Tab */
        <div className="space-y-3">
          {/* Header & Excel Tools */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-stone-900">Pembelian Bahan Baku</h3>
              <p className="text-[11px] text-stone-500">Stok otomatis bertambah setelah disimpan</p>
            </div>
            <button
              onClick={handleOpenPurchaseModal}
              disabled={appState.ingredients.length === 0}
              className="bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold py-2 px-3.5 rounded-2xl flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Pembelian</span>
            </button>
          </div>

          {/* Excel Import & Template Download Buttons Card */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-amber-950">Fitur Excel Pembelian</span>
              </div>
            </div>
            <p className="text-[11px] text-amber-900/80 leading-relaxed">
              Catat pembelian banyak bahan sekaligus menggunakan file Excel, atau unduh template kosong siap pakai.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={downloadPurchaseTemplate}
                className="flex-1 py-1.5 px-2.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Template Excel</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex-1 py-1.5 px-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isImporting ? 'Membaca...' : 'Impor File Excel'}</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
            </div>
          </div>

          {/* Purchase History */}
          {appState.purchases.length === 0 ? (
            <div className="min-h-[220px] flex flex-col items-center justify-center p-6 text-center bg-white rounded-3xl border border-stone-200 text-stone-500">
              <ShoppingBag className="w-8 h-8 text-stone-300 mb-2" />
              <p className="text-xs font-semibold">Belum Ada Riwayat Pembelian Bahan</p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Gunakan tombol "Catat Pembelian" atau impor berkas Excel di atas.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {appState.purchases.map((pur) => (
                <div
                  key={pur.id}
                  className="bg-white rounded-2xl p-3 border border-stone-200 shadow-2xs text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900">{pur.ingredientName}</span>
                    <span className="text-[11px] text-stone-400">{formatDateShort(pur.date)}</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span>
                      {pur.quantity} {pur.unit} @ {formatRupiah(pur.pricePerUnit)}
                    </span>
                    <span className="font-bold text-stone-900 text-sm">
                      {formatRupiah(pur.totalPrice)}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] text-stone-400">
                      {pur.supplier ? `Pemasok: ${pur.supplier}` : 'Pembelian Bahan'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditPurchase(pur)}
                        className="w-7 h-7 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 flex items-center justify-center cursor-pointer transition"
                        title="Edit Pembelian"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setPurchaseToDelete(pur)}
                        className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center cursor-pointer transition"
                        title="Hapus Pembelian"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Ingredient Modal */}
      {isAddIngredientModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-end justify-center p-0 md:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-red-800" />
                {editingIngredient ? 'Edit Bahan Baku' : 'Tambah Bahan Baku Baru'}
              </h3>
              <button
                onClick={() => setIsAddIngredientModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredientForm} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Nama Bahan Baku *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Daging Kebab Sapi, Kulit Tortilla, Saus Sambal"
                  value={ingName}
                  onChange={(e) => setIngName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Kategori Bahan *</label>
                <select
                  value={ingCategory}
                  onChange={(e) => setIngCategory(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Jumlah Stok Awal *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0"
                    placeholder="0"
                    value={ingStock}
                    onChange={(e) => setIngStock(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Satuan Pengukuran *</label>
                  <select
                    value={ingUnit}
                    onChange={(e) => setIngUnit(e.target.value as UnitType)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
                  >
                    {availableUnits.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Harga Beli Satuan (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Contoh: 1500"
                    value={ingUnitCost}
                    onChange={(e) => setIngUnitCost(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Harga per 1 {ingUnit}</span>
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Batas Minimum Peringatan</label>
                  <input
                    type="number"
                    min="0"
                    value={ingMinAlert}
                    onChange={(e) => setIngMinAlert(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Alert jika stok &le; angka ini</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Catatan Tambahan (opsional)</label>
                <input
                  type="text"
                  placeholder="Merek, vendor langganan, dll."
                  value={ingNotes}
                  onChange={(e) => setIngNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddIngredientModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold"
                >
                  Simpan Bahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock In / Out Adjustment Modal */}
      {adjustStockModal.show && adjustStockModal.ingredient && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h4 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                {adjustStockModal.type === 'in' ? (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    <span>Penyesuaian Stok Masuk</span>
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="w-4 h-4 text-rose-600" />
                    <span>Penyesuaian Stok Keluar</span>
                  </>
                )}
              </h4>
              <button
                onClick={() => setAdjustStockModal({ show: false, ingredient: null, type: 'in' })}
                className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <span className="text-stone-500">Bahan Baku:</span>
              <div className="font-bold text-sm text-stone-900">{adjustStockModal.ingredient.name}</div>
              <div className="text-[11px] text-stone-400">
                Stok Saat Ini: {adjustStockModal.ingredient.stock} {adjustStockModal.ingredient.unit}
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Jumlah {adjustStockModal.type === 'in' ? 'Ditambahkan' : 'Dikeluarkan'} ({adjustStockModal.ingredient.unit}) *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="0"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-bold focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Alasan / Keterangan</label>
              <input
                type="text"
                placeholder={
                  adjustStockModal.type === 'in'
                    ? 'Bonus vendor, retur, dll'
                    : 'Bahan rusak, basi, tumpah, dll'
                }
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustStockModal({ show: false, ingredient: null, type: 'in' })}
                className="flex-1 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyAdjustment}
                className={`flex-1 py-2 rounded-xl text-white font-bold ${
                  adjustStockModal.type === 'in' ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-rose-700 hover:bg-rose-600'
                }`}
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Purchase Modal */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-end justify-center p-0 md:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-red-800" />
                {editingPurchase ? 'Edit Pembelian Bahan' : 'Catat Pembelian Bahan Baku'}
              </h3>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePurchaseForm} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Pilih Bahan Baku *</label>
                <select
                  value={purIngredientId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setPurIngredientId(id);
                    const selected = appState.ingredients.find((i) => i.id === id);
                    if (selected) {
                      setPurPricePerUnit(String(selected.unitCost));
                    }
                  }}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
                >
                  {appState.ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.unit}) - Sisa Stok: {ing.stock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Jumlah Beli *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.01"
                    placeholder="Contoh: 10"
                    value={purQuantity}
                    onChange={(e) => setPurQuantity(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Harga Beli Satuan (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Contoh: 85000"
                    value={purPricePerUnit}
                    onChange={(e) => setPurPricePerUnit(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="p-3 bg-stone-900 text-white rounded-xl flex items-center justify-between">
                <span className="text-stone-300">Total Biaya Pembelian:</span>
                <span className="text-sm font-black text-amber-300">
                  {formatRupiah((parseFloat(purQuantity) || 0) * (parseFloat(purPricePerUnit) || 0))}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Nama Pemasok (opsional)</label>
                  <input
                    type="text"
                    placeholder="Supplier Kebab Jaya"
                    value={purSupplier}
                    onChange={(e) => setPurSupplier(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Tanggal Pembelian</label>
                  <input
                    type="date"
                    value={purDate}
                    onChange={(e) => setPurDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Nomor nota, keterangan belanja"
                  value={purNotes}
                  onChange={(e) => setPurNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold cursor-pointer"
                >
                  {editingPurchase ? 'Perbarui Pembelian' : 'Simpan Pembelian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Preview & Validation Modal */}
      {excelPreviewModal.show && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-3 text-xs max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h4 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Validasi Impor Excel Pembelian</span>
              </h4>
              <button
                onClick={() => setExcelPreviewModal({ show: false, validRows: [], errors: [] })}
                className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Error notifications if any */}
            {excelPreviewModal.errors.length > 0 && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-1 text-rose-800">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Ditemukan {excelPreviewModal.errors.length} Kesalahan Data:</span>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-0.5 text-[11px]">
                  {excelPreviewModal.errors.map((err, i) => (
                    <div key={i}>&bull; {err}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Valid Rows Preview */}
            <div className="flex-1 overflow-y-auto space-y-2">
              <div className="font-semibold text-stone-700 flex justify-between">
                <span>Data Valid ({excelPreviewModal.validRows.length} baris):</span>
                <span>
                  Total:{' '}
                  {formatRupiah(
                    excelPreviewModal.validRows.reduce((s, r) => s + r.totalPrice, 0)
                  )}
                </span>
              </div>

              {excelPreviewModal.validRows.length === 0 ? (
                <div className="p-6 text-center text-stone-400 border border-dashed border-stone-300 rounded-2xl">
                  Tidak ada baris data valid yang dapat dimasukkan.
                </div>
              ) : (
                excelPreviewModal.validRows.map((row, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-stone-900">{row.ingredientName}</div>
                      <div className="text-[10px] text-stone-400">
                        {row.quantity} {row.unit} @ {formatRupiah(row.pricePerUnit)} | {row.date}
                      </div>
                    </div>
                    <span className="font-bold text-stone-800">{formatRupiah(row.totalPrice)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex items-center gap-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setExcelPreviewModal({ show: false, validRows: [], errors: [] })}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={excelPreviewModal.validRows.length === 0}
                onClick={handleCommitExcelImport}
                className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold"
              >
                Konfirmasi Impor ({excelPreviewModal.validRows.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Ingredient Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(ingredientToDelete)}
        title="Hapus Bahan Baku?"
        message="Apakah Anda yakin ingin menghapus bahan baku ini dari daftar persediaan?"
        itemName={ingredientToDelete ? `${ingredientToDelete.name} (Sisa: ${ingredientToDelete.stock} ${ingredientToDelete.unit})` : undefined}
        confirmLabel="Ya, Hapus Bahan"
        cancelLabel="Batal"
        isDanger={true}
        onConfirm={() => {
          if (ingredientToDelete) {
            onDeleteIngredient(ingredientToDelete.id);
            setIngredientToDelete(null);
          }
        }}
        onCancel={() => setIngredientToDelete(null)}
      />

      {/* Delete Purchase Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(purchaseToDelete)}
        title="Hapus Catatan Pembelian?"
        message="Apakah Anda yakin ingin menghapus catatan pembelian ini? Stok bahan baku yang bersangkutan akan otomatis dikurangi kembali."
        itemName={purchaseToDelete ? `${purchaseToDelete.ingredientName} (${purchaseToDelete.quantity} ${purchaseToDelete.unit})` : undefined}
        confirmLabel="Ya, Hapus Pembelian"
        cancelLabel="Batal"
        isDanger={true}
        onConfirm={() => {
          if (purchaseToDelete) {
            onDeletePurchase(purchaseToDelete.id);
            setPurchaseToDelete(null);
          }
        }}
        onCancel={() => setPurchaseToDelete(null)}
      />
    </div>
  );
};
