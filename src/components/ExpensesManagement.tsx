import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  X,
  Info,
  DollarSign,
  TrendingDown,
  Building,
  Coins,
} from 'lucide-react';
import { AppState, ExpenseItem, ExpenseClassification } from '../types';
import { formatRupiah, formatDateShort, getTodayDateString, generateId } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

interface ExpensesManagementProps {
  appState: AppState;
  onSaveExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpensesManagement: React.FC<ExpensesManagementProps> = ({
  appState,
  onSaveExpense,
  onDeleteExpense,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseItem | null>(null);

  // Form Fields
  const [category, setCategory] = useState<string>('Gas LPG');
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('');
  const [classification, setClassification] = useState<ExpenseClassification>('operasional');
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());

  // Filters
  const [filterClass, setFilterClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Available categories
  const categories = useMemo(() => {
    const list = [...appState.settings.customExpenseCategories];
    appState.expenses.forEach((e) => {
      if (e.category && !list.includes(e.category)) {
        list.push(e.category);
      }
    });
    return list;
  }, [appState.settings.customExpenseCategories, appState.expenses]);

  // Summaries
  const summaries = useMemo(() => {
    let operational = 0;
    let asset = 0;
    let capital = 0;

    appState.expenses.forEach((e) => {
      if (e.classification === 'operasional') operational += e.amount || 0;
      else if (e.classification === 'aset') asset += e.amount || 0;
      else if (e.classification === 'modal_usaha') capital += e.amount || 0;
    });

    return {
      operational,
      asset,
      capital,
      total: operational + asset,
    };
  }, [appState.expenses]);

  // Filtered List
  const filteredExpenses = useMemo(() => {
    return appState.expenses
      .filter((e) => {
        const matchClass = filterClass === 'all' || e.classification === filterClass;
        const matchSearch =
          !searchQuery ||
          e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchClass && matchSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appState.expenses, filterClass, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setCategory(categories[0] || 'Gas LPG');
    setCustomCategoryInput('');
    setClassification('operasional');
    setDescription('');
    setAmount('');
    setDate(getTodayDateString());
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setCategory(expense.category);
    setCustomCategoryInput('');
    setClassification(expense.classification);
    setDescription(expense.description);
    setAmount(String(expense.amount));
    setDate(expense.date);
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Nominal pengeluaran harus lebih dari Rp 0.');
      return;
    }

    const finalCat = category === 'Lainnya (Buat Baru)' ? customCategoryInput.trim() || 'Lainnya' : category;

    const newExpense: ExpenseItem = {
      id: editingExpense ? editingExpense.id : generateId('EXP'),
      date,
      category: finalCat,
      classification,
      description: description.trim(),
      amount: numAmount,
    };

    onSaveExpense(newExpense);
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-3 pb-20">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-stone-900 tracking-tight flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-red-700" />
            Pengeluaran Usaha
          </h2>
          <p className="text-[11px] text-stone-500 font-medium">
            Catat operasional, aset peralatan, dan modal
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white text-xs font-bold py-2 px-3.5 rounded-2xl flex items-center gap-1.5 shadow-sm active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Biaya</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white p-3 rounded-2xl border border-stone-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Biaya Operasional</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-sm font-black text-stone-900">
            {formatRupiah(summaries.operational)}
          </div>
          <div className="text-[10px] text-stone-400">Gas, listrik, bensin, sewa</div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-stone-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Aset & Peralatan</span>
            <Building className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-sm font-black text-stone-900">
            {formatRupiah(summaries.asset)}
          </div>
          <div className="text-[10px] text-stone-400">Burner, wajan, gerobak</div>
        </div>
      </div>

      {/* Search and Classification Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Cari gas, bensin, listrik, sewa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-2xl pl-9 pr-3 py-2 text-xs text-stone-800 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'operasional', label: 'Operasional' },
            { id: 'aset', label: 'Aset / Alat' },
            { id: 'modal_usaha', label: 'Modal Usaha' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterClass(tab.id)}
              className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                filterClass === tab.id
                  ? 'bg-red-800 text-white font-bold shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expense List / Empty State */}
      {filteredExpenses.length === 0 ? (
        <div className="min-h-[250px] flex flex-col items-center justify-center p-6 text-center bg-white rounded-3xl border border-dashed border-stone-300">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center mb-2.5">
            <Receipt className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-stone-800">
            {appState.expenses.length === 0 ? 'Belum Ada Pengeluaran' : 'Pengeluaran Tidak Ditemukan'}
          </h4>
          <p className="text-xs text-stone-500 max-w-xs mt-1">
            {appState.expenses.length === 0
              ? 'Catat biaya operasional seperti gas LPG, bensin, atau sewa lapak agar laba bersih terhitung akurat.'
              : 'Sesuaikan filter pencarian untuk melihat data.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredExpenses.map((exp) => (
            <div
              key={exp.id}
              className="bg-white rounded-2xl p-3 border border-stone-200/90 shadow-2xs text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-stone-900">{exp.category}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      exp.classification === 'operasional'
                        ? 'bg-rose-50 text-rose-700'
                        : exp.classification === 'aset'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {exp.classification === 'operasional'
                      ? 'Operasional'
                      : exp.classification === 'aset'
                      ? 'Aset Peralatan'
                      : 'Modal Usaha'}
                  </span>
                </div>
                <span className="text-[11px] text-stone-400">{formatDateShort(exp.date)}</span>
              </div>

              {exp.description && (
                <div className="text-stone-500 text-[11px]">{exp.description}</div>
              )}

              <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between">
                <span className="font-black text-sm text-stone-900">
                  {formatRupiah(exp.amount)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(exp)}
                    className="w-7 h-7 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 flex items-center justify-center"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setExpenseToDelete(exp)}
                    className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center cursor-pointer transition"
                    title="Hapus Pengeluaran"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-end justify-center p-0 md:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-red-800" />
                {editingExpense ? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {/* Category Dropdown */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">Kategori Pengeluaran *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="Lainnya (Buat Baru)">+ Tambah Kategori Baru</option>
                </select>

                {category === 'Lainnya (Buat Baru)' && (
                  <input
                    type="text"
                    placeholder="Nama kategori pengeluaran baru..."
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    className="mt-2 w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-stone-800"
                  />
                )}
              </div>

              {/* Classification Selector */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Klasifikasi Jenis Biaya *
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'operasional', label: 'Operasional', desc: 'Kurangi Laba' },
                    { id: 'aset', label: 'Aset / Alat', desc: 'Barang Modal' },
                    { id: 'modal_usaha', label: 'Modal Usaha', desc: 'Setor Kas' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setClassification(item.id as ExpenseClassification)}
                      className={`p-2 rounded-xl border text-center transition ${
                        classification === item.id
                          ? 'bg-red-50 border-red-800 text-red-800 font-bold'
                          : 'bg-stone-50 border-stone-200 text-stone-600'
                      }`}
                    >
                      <div className="text-xs">{item.label}</div>
                      <div className="text-[9px] text-stone-400 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">Nominal Biaya (Rp) *</label>
                <input
                  type="number"
                  required
                  min="100"
                  placeholder="Contoh: 25000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-bold text-stone-900 focus:outline-hidden"
                />
              </div>

              {/* Date */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">Tanggal Pengeluaran *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
                />
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">Keterangan / Catatan</label>
                <input
                  type="text"
                  placeholder="Misal: Isi ulang gas 3kg, bensin motor operasional"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
                />
              </div>

              {/* Accounting Guidance Note */}
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Pengeluaran <b>Operasional</b> akan otomatis mengurangi Keuntungan Bersih. Pembelian persediaan bahan baku dicatat terpisah di menu Stok & Beli.
                </span>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Expense Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(expenseToDelete)}
        title="Hapus Pengeluaran?"
        message="Apakah Anda yakin ingin menghapus catatan pengeluaran ini?"
        itemName={expenseToDelete ? `${expenseToDelete.category} - ${formatRupiah(expenseToDelete.amount)} (${expenseToDelete.date})` : undefined}
        confirmLabel="Ya, Hapus Pengeluaran"
        cancelLabel="Batal"
        isDanger={true}
        onConfirm={() => {
          if (expenseToDelete) {
            onDeleteExpense(expenseToDelete.id);
            setExpenseToDelete(null);
          }
        }}
        onCancel={() => setExpenseToDelete(null)}
      />
    </div>
  );
};
