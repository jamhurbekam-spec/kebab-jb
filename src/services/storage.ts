import { AppState, Ingredient, Product, SaleTransaction, PurchaseItem, ExpenseItem, BusinessSettings } from '../types';

const STORAGE_KEY = 'kebabku_data_v1';

export const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'KebabKu',
  tagline: 'Kelola Usaha Kebab Praktis & Otomatis',
  ownerName: '',
  phone: '',
  address: '',
  currency: 'Rp',
  defaultMinStock: 5,
  customProductCategories: [
    'Kebab Daging Sapi',
    'Kebab Ayam',
    'Kebab Sosis',
    'Burger Kebab',
    'Menu Spesial & Jumbo',
    'Minuman & Paket Hemat',
  ],
  customIngredientCategories: [
    'Kulit & Roti',
    'Daging & Isian',
    'Sayuran Segar',
    'Saus & Mayones',
    'Keju & Topping',
    'Kemasan & Pembungkus',
    'Bahan Lainnya',
  ],
  customExpenseCategories: [
    'Gas LPG',
    'Bensin & Transport',
    'Listrik',
    'Air',
    'Plastik Kemasan & Kresek',
    'Tisu & Kebersihan',
    'Sewa Tempat / Lapak',
    'Peralatan Usaha',
    'Gaji Karyawan',
    'Lainnya',
  ],
};

/**
 * STRICT REQUIREMENT: Initial state must be completely EMPTY of sample records.
 * No dummy products, no dummy ingredients, no dummy transactions, no dummy expenses, no dummy purchases.
 */
export function getInitialEmptyState(): AppState {
  return {
    products: [],
    ingredients: [],
    transactions: [],
    purchases: [],
    expenses: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialEmptyState();
      saveAppState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return {
      products: Array.isArray(parsed.products) ? parsed.products : [],
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      purchases: Array.isArray(parsed.purchases) ? parsed.purchases : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      settings: {
        ...DEFAULT_SETTINGS,
        ...(parsed.settings || {}),
      },
    };
  } catch (error) {
    console.error('Failed to parse stored data, resetting to empty state:', error);
    const initial = getInitialEmptyState();
    saveAppState(initial);
    return initial;
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

/**
 * Calculates Cost of Goods Sold (HPP) per portion of a product
 * by summing (ingredient unitCost * recipeItem amount)
 */
export function calculateProductHPP(product: Product, ingredients: Ingredient[]): number {
  if (!product.recipe || product.recipe.length === 0) {
    return 0;
  }

  let totalHpp = 0;
  for (const recipeItem of product.recipe) {
    const ing = ingredients.find((i) => i.id === recipeItem.ingredientId);
    if (ing && recipeItem.amount > 0) {
      totalHpp += (ing.unitCost || 0) * recipeItem.amount;
    }
  }

  return Math.round(totalHpp);
}

/**
 * Stock requirement checker before committing a transaction.
 * Returns missing ingredients list if any ingredient stock is insufficient.
 */
export function checkStockSufficiency(
  items: { product: Product; quantity: number }[],
  ingredients: Ingredient[]
): {
  isSufficient: boolean;
  warnings: {
    ingredientName: string;
    required: number;
    available: number;
    unit: string;
    deficit: number;
  }[];
} {
  const requiredStockMap: Record<string, number> = {};

  for (const item of items) {
    if (!item.product.recipe) continue;
    for (const recipeItem of item.product.recipe) {
      const current = requiredStockMap[recipeItem.ingredientId] || 0;
      requiredStockMap[recipeItem.ingredientId] = current + recipeItem.amount * item.quantity;
    }
  }

  const warnings: {
    ingredientName: string;
    required: number;
    available: number;
    unit: string;
    deficit: number;
  }[] = [];

  for (const [ingredientId, needed] of Object.entries(requiredStockMap)) {
    const ing = ingredients.find((i) => i.id === ingredientId);
    if (!ing) continue;
    if (ing.stock < needed) {
      warnings.push({
        ingredientName: ing.name,
        required: needed,
        available: ing.stock,
        unit: ing.unit,
        deficit: Math.max(0, needed - ing.stock),
      });
    }
  }

  return {
    isSufficient: warnings.length === 0,
    warnings,
  };
}

/**
 * Export complete backup as JSON
 */
export function exportBackup(state: AppState): string {
  const exportPayload = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    appName: 'KebabKu',
    data: state,
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Import backup JSON
 */
export function validateAndImportBackup(jsonString: string): { success: boolean; state?: AppState; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    const data = parsed.data || parsed;

    if (!Array.isArray(data.products) || !Array.isArray(data.ingredients)) {
      return { success: false, error: 'Format berkas cadangan tidak valid (kurang tabel produk atau bahan).' };
    }

    const state: AppState = {
      products: data.products,
      ingredients: data.ingredients,
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
      purchases: Array.isArray(data.purchases) ? data.purchases : [],
      expenses: Array.isArray(data.expenses) ? data.expenses : [],
      settings: {
        ...DEFAULT_SETTINGS,
        ...(data.settings || {}),
      },
    };

    saveAppState(state);
    return { success: true, state };
  } catch (err) {
    return { success: false, error: 'Gagal memproses berkas JSON: ' + (err instanceof Error ? err.message : String(err)) };
  }
}
