import React, { useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Search,
  Scale,
  DollarSign,
  TrendingUp,
  X,
  AlertCircle,
  Check,
  PackagePlus,
} from 'lucide-react';
import { AppState, Product, RecipeItem } from '../types';
import { formatRupiah, formatNumber, generateId } from '../utils/formatters';
import { calculateProductHPP } from '../services/storage';
import { ConfirmModal } from './ConfirmModal';

interface ProductManagementProps {
  appState: AppState;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onNavigateToInventory: () => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  appState,
  onSaveProduct,
  onDeleteProduct,
  onNavigateToInventory,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('Kebab Daging Sapi');
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [recipe, setRecipe] = useState<RecipeItem[]>([]);

  // Category Options
  const categories = useMemo(() => {
    const list = [...appState.settings.customProductCategories];
    appState.products.forEach((p) => {
      if (p.category && !list.includes(p.category)) {
        list.push(p.category);
      }
    });
    return list;
  }, [appState.settings.customProductCategories, appState.products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return appState.products.filter((p) => {
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [appState.products, selectedCategory, searchQuery]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory(categories[0] || 'Kebab Daging Sapi');
    setCustomCategoryInput('');
    setPrice('');
    setDescription('');
    setRecipe([]);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category);
    setCustomCategoryInput('');
    setPrice(String(product.price));
    setDescription(product.description || '');
    setRecipe(product.recipe ? [...product.recipe] : []);
    setIsModalOpen(true);
  };

  // Recipe item adjustments
  const handleAddRecipeIngredient = (ingredientId: string) => {
    if (recipe.some((r) => r.ingredientId === ingredientId)) return;
    const ing = appState.ingredients.find((i) => i.id === ingredientId);
    if (!ing) return;

    setRecipe((prev) => [
      ...prev,
      {
        ingredientId,
        amount: ing.unit === 'gram' ? 30 : 1,
      },
    ]);
  };

  const handleUpdateRecipeAmount = (ingredientId: string, amount: number) => {
    setRecipe((prev) =>
      prev.map((r) => (r.ingredientId === ingredientId ? { ...r, amount: Math.max(0.1, amount) } : r))
    );
  };

  const handleRemoveRecipeIngredient = (ingredientId: string) => {
    setRecipe((prev) => prev.filter((r) => r.ingredientId !== ingredientId));
  };

  // Live Modal HPP Calculation
  const modalHpp = useMemo(() => {
    let sum = 0;
    recipe.forEach((item) => {
      const ing = appState.ingredients.find((i) => i.id === item.ingredientId);
      if (ing) {
        sum += (ing.unitCost || 0) * item.amount;
      }
    });
    return Math.round(sum);
  }, [recipe, appState.ingredients]);

  const numPrice = parseFloat(price.replace(/[^0-9]/g, '')) || 0;
  const modalProfit = Math.max(0, numPrice - modalHpp);
  const modalMargin = numPrice > 0 ? Math.round((modalProfit / numPrice) * 100) : 0;

  // Save Product
  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama produk kebab wajib diisi.');
      return;
    }
    if (numPrice <= 0) {
      alert('Harga jual produk harus lebih dari Rp 0.');
      return;
    }

    const finalCategory = category === 'Lainnya (Buat Baru)' ? customCategoryInput.trim() || 'Menu Lain' : category;

    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : generateId('PROD'),
      name: name.trim(),
      category: finalCategory,
      price: numPrice,
      recipe,
      description: description.trim() || undefined,
      isActive: true,
    };

    onSaveProduct(newProduct);
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-3 pb-20">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-stone-900 tracking-tight flex items-center gap-1.5">
            <UtensilsCrossed className="w-4 h-4 text-red-700" />
            Menu Produk Kebab
          </h2>
          <p className="text-[11px] text-stone-500 font-medium">
            Kelola menu, resep takaran porsi, dan HPP otomatis
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white text-xs font-bold py-2 px-3.5 rounded-2xl flex items-center gap-1.5 shadow-sm active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Menu</span>
        </button>
      </div>

      {/* Search and Category Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Cari produk kebab..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-2xl pl-9 pr-3 py-2 text-xs text-stone-800 focus:outline-hidden"
          />
        </div>

        {categories.length > 0 && (
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
        )}
      </div>

      {/* Product List or Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-6 text-center bg-white rounded-3xl border border-dashed border-stone-300">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center mb-3">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-stone-800">
            {appState.products.length === 0 ? 'Belum Ada Produk Kebab' : 'Produk Tidak Ditemukan'}
          </h3>
          <p className="text-xs text-stone-500 max-w-xs mt-1">
            {appState.products.length === 0
              ? 'Tambahkan menu pertama Anda seperti Kebab Original, Kebab Jumbo, atau Kebab Spesial dengan resep bahan bakunya.'
              : 'Sesuaikan filter pencarian untuk melihat produk.'}
          </p>
          {appState.products.length === 0 && (
            <button
              onClick={handleOpenAddModal}
              className="mt-4 py-2 px-4 bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-red-700 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk Sekarang</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredProducts.map((product) => {
            const hpp = calculateProductHPP(product, appState.ingredients);
            const profit = product.price - hpp;
            const margin = product.price > 0 ? Math.round((profit / product.price) * 100) : 0;
            const recipeCount = product.recipe?.length || 0;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-2xs space-y-2.5 hover:border-red-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-md inline-block">
                      {product.category}
                    </span>
                    <h3 className="font-bold text-sm text-stone-900 mt-1">{product.name}</h3>
                    {product.description && (
                      <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">{product.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(product)}
                      className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition"
                      title="Edit Produk"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setProductToDelete(product)}
                      className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition cursor-pointer"
                      title="Hapus Produk"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Price, HPP, and Margin Metrics */}
                <div className="grid grid-cols-3 gap-2 bg-stone-50 rounded-xl p-2.5 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Harga Jual</span>
                    <span className="font-bold text-stone-900">{formatRupiah(product.price)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">HPP Porsi</span>
                    <span className="font-bold text-red-800">{formatRupiah(hpp)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">Estimasi Untung</span>
                    <span className="font-bold text-emerald-700">
                      {formatRupiah(profit)} <span className="text-[10px]">({margin}%)</span>
                    </span>
                  </div>
                </div>

                {/* Recipe Summary */}
                <div className="text-[11px] text-stone-500 flex items-center justify-between pt-1">
                  <span className="flex items-center gap-1 text-stone-600">
                    <Scale className="w-3.5 h-3.5 text-amber-600" />
                    <span>Komposisi: {recipeCount} bahan baku</span>
                  </span>
                  {recipeCount === 0 && (
                    <span className="text-amber-700 font-medium text-[10px]">
                      Belum diatur resep
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-end justify-center p-0 md:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-red-800" />
                {editingProduct ? 'Edit Menu Kebab' : 'Tambah Menu Kebab Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitProduct} className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Nama Produk */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Nama Menu Kebab *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Kebab Sapi Jumbo, Kebab Keju"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-red-700/30"
                />
              </div>

              {/* Kategori Dropdown */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Kategori Menu *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-hidden"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="Lainnya (Buat Baru)">+ Tambah Kategori Baru</option>
                </select>

                {category === 'Lainnya (Buat Baru)' && (
                  <input
                    type="text"
                    placeholder="Ketik nama kategori baru..."
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    className="mt-2 w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800"
                  />
                )}
              </div>

              {/* Harga Jual */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Harga Jual per Porsi (Rp) *
                </label>
                <input
                  type="number"
                  required
                  min="500"
                  placeholder="Contoh: 20000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-red-700/30"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Deskripsi / Keterangan (opsional)
                </label>
                <input
                  type="text"
                  placeholder="Tortilla 22cm, daging sapi panggang melimpah"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-hidden"
                />
              </div>

              {/* Recipe Composer (Komposisi Bahan Baku per Porsi) */}
              <div className="pt-2 border-t border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-amber-700" />
                      Komposisi Resep per 1 Porsi
                    </h4>
                    <p className="text-[10px] text-stone-400">
                      Bahan yang otomatis berkurang saat menu ini terjual
                    </p>
                  </div>
                </div>

                {appState.ingredients.length === 0 ? (
                  <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-2xl text-xs text-amber-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Belum ada bahan baku terdaftar.</span>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Anda dapat menyimpan produk ini sekarang, lalu tambahkan bahan baku di menu "Stok & Beli" untuk menghubungkan resep dan menghitung HPP otomatis.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Select Ingredient Dropdown */}
                    <div className="flex items-center gap-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddRecipeIngredient(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                        className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-hidden"
                      >
                        <option value="" disabled>
                          + Pilih Bahan Baku untuk Ditambahkan...
                        </option>
                        {appState.ingredients
                          .filter((ing) => !recipe.some((r) => r.ingredientId === ing.id))
                          .map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({formatRupiah(ing.unitCost)} / {ing.unit})
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Active Recipe Table */}
                    {recipe.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {recipe.map((item) => {
                          const ing = appState.ingredients.find((i) => i.id === item.ingredientId);
                          if (!ing) return null;
                          const itemCost = Math.round((ing.unitCost || 0) * item.amount);

                          return (
                            <div
                              key={item.ingredientId}
                              className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                            >
                              <div className="flex-1">
                                <span className="font-semibold text-stone-800">{ing.name}</span>
                                <div className="text-[10px] text-stone-400">
                                  @{formatRupiah(ing.unitCost)}/{ing.unit} = {formatRupiah(itemCost)}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  step="any"
                                  min="0.01"
                                  value={item.amount}
                                  onChange={(e) =>
                                    handleUpdateRecipeAmount(
                                      item.ingredientId,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-16 bg-white border border-stone-200 rounded-lg px-2 py-1 text-center font-bold text-stone-800 text-xs"
                                />
                                <span className="text-[11px] text-stone-500 w-10 truncate">{ing.unit}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRecipeIngredient(item.ingredientId)}
                                  className="text-stone-400 hover:text-rose-600 p-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Automatic Financial Simulation Card */}
              <div className="p-3 bg-stone-900 text-white rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Harga Jual Porsi:</span>
                  <span className="font-semibold text-white">{formatRupiah(numPrice)}</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>Modal HPP Bahan per Porsi:</span>
                  <span className="font-semibold text-red-300">- {formatRupiah(modalHpp)}</span>
                </div>
                <div className="pt-1.5 border-t border-stone-800 flex justify-between font-bold">
                  <span className="text-stone-200">Estimasi Keuntungan:</span>
                  <span className="text-amber-300">
                    {formatRupiah(modalProfit)} ({modalMargin}%)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white text-xs font-bold shadow-sm transition"
                >
                  {editingProduct ? 'Perbarui Menu' : 'Simpan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(productToDelete)}
        title="Hapus Menu Kebab?"
        message="Apakah Anda yakin ingin menghapus menu produk ini dari daftar jualan?"
        itemName={productToDelete?.name}
        confirmLabel="Ya, Hapus Menu"
        cancelLabel="Batal"
        isDanger={true}
        onConfirm={() => {
          if (productToDelete) {
            onDeleteProduct(productToDelete.id);
            setProductToDelete(null);
          }
        }}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
};
