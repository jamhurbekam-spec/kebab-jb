export type UnitType =
  | 'pcs'
  | 'lembar'
  | 'gram'
  | 'kg'
  | 'ml'
  | 'liter'
  | 'bungkus'
  | 'botol'
  | 'butir'
  | 'roll'
  | 'porsi';

export type TabType =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'inventory'
  | 'expenses'
  | 'reports'
  | 'settings';

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: UnitType;
  unitCost: number; // Harga beli per satuan
  minStockAlert: number; // Batas minimum stok
  lastUpdated: string; // ISO date
  notes?: string;
}

export interface RecipeItem {
  ingredientId: string;
  ingredientName?: string;
  amount: number; // Takaran per porsi
  unit?: UnitType;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number; // Harga jual
  recipe: RecipeItem[];
  description?: string;
  isActive: boolean;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  unitHpp: number; // Snapshot HPP saat transaksi dibuat
  totalHpp: number;
}

export interface SaleTransaction {
  id: string; // e.g. TRX-20261105-001
  date: string; // ISO date
  items: SaleItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  totalHpp: number;
  grossProfit: number;
  paymentMethod: 'Tunai' | 'Transfer / QRIS';
  cashGiven?: number;
  change?: number;
  customerName?: string;
  notes?: string;
  status: 'completed' | 'cancelled';
}

export interface PurchaseItem {
  id: string;
  date: string;
  ingredientId: string;
  ingredientName: string;
  supplier?: string;
  quantity: number;
  unit: UnitType;
  pricePerUnit: number;
  totalPrice: number;
  paymentMethod?: string;
  notes?: string;
}

export type ExpenseClassification = 'operasional' | 'aset' | 'modal_usaha';

export interface ExpenseItem {
  id: string;
  date: string;
  category: string;
  classification: ExpenseClassification;
  description: string;
  amount: number;
  paymentMethod?: string;
}

export interface BusinessSettings {
  businessName: string;
  tagline: string;
  ownerName: string;
  phone: string;
  address: string;
  currency: string;
  defaultMinStock: number;
  customProductCategories: string[];
  customIngredientCategories: string[];
  customExpenseCategories: string[];
}

export interface AppState {
  products: Product[];
  ingredients: Ingredient[];
  transactions: SaleTransaction[];
  purchases: PurchaseItem[];
  expenses: ExpenseItem[];
  settings: BusinessSettings;
}
