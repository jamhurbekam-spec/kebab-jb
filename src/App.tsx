import React, { useState, useEffect, useMemo } from 'react';
import { AppState, TabType, Product, Ingredient, SaleTransaction, PurchaseItem, ExpenseItem, BusinessSettings } from './types';
import { loadAppState, saveAppState, getInitialEmptyState } from './services/storage';
import { AndroidFrame } from './components/AndroidFrame';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { SalesPOS } from './components/SalesPOS';
import { ProductManagement } from './components/ProductManagement';
import { InventoryManagement } from './components/InventoryManagement';
import { ExpensesManagement } from './components/ExpensesManagement';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { BagiKopiModal } from './components/BagiKopiModal';
import { GuideModal } from './components/GuideModal';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isBagiKopiOpen, setIsBagiKopiOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Sync to localStorage whenever appState updates
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Calculate low stock alert count for Navbar badge
  const lowStockCount = useMemo(() => {
    return appState.ingredients.filter((ing) => ing.stock <= ing.minStockAlert).length;
  }, [appState.ingredients]);

  // Transaction handlers
  const handleSaveTransaction = (transaction: SaleTransaction, updatedIngredients: Ingredient[]) => {
    setAppState((prev) => ({
      ...prev,
      transactions: [transaction, ...prev.transactions],
      ingredients: updatedIngredients,
    }));
  };

  const handleCancelTransaction = (transactionId: string) => {
    setAppState((prev) => {
      const targetTx = prev.transactions.find((t) => t.id === transactionId);
      if (!targetTx || targetTx.status === 'cancelled') return prev;

      // Restore ingredient stock
      const updatedIngredients = [...prev.ingredients];
      targetTx.items.forEach((item) => {
        const product = prev.products.find((p) => p.id === item.productId);
        if (product && product.recipe) {
          product.recipe.forEach((r) => {
            const ingIdx = updatedIngredients.findIndex((i) => i.id === r.ingredientId);
            if (ingIdx !== -1) {
              const returnedStock = r.amount * item.quantity;
              updatedIngredients[ingIdx] = {
                ...updatedIngredients[ingIdx],
                stock: updatedIngredients[ingIdx].stock + returnedStock,
                lastUpdated: new Date().toISOString(),
              };
            }
          });
        }
      });

      const updatedTransactions = prev.transactions.map((t) =>
        t.id === transactionId ? { ...t, status: 'cancelled' as const } : t
      );

      return {
        ...prev,
        transactions: updatedTransactions,
        ingredients: updatedIngredients,
      };
    });
  };

  // Product handlers
  const handleSaveProduct = (product: Product) => {
    setAppState((prev) => {
      const exists = prev.products.some((p) => p.id === product.id);
      const updatedProducts = exists
        ? prev.products.map((p) => (p.id === product.id ? product : p))
        : [product, ...prev.products];
      return { ...prev, products: updatedProducts };
    });
  };

  const handleDeleteProduct = (productId: string) => {
    setAppState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== productId),
    }));
  };

  // Ingredient handlers
  const handleSaveIngredient = (ingredient: Ingredient) => {
    setAppState((prev) => {
      const exists = prev.ingredients.some((i) => i.id === ingredient.id);
      const updatedIngredients = exists
        ? prev.ingredients.map((i) => (i.id === ingredient.id ? ingredient : i))
        : [...prev.ingredients, ingredient];
      return { ...prev, ingredients: updatedIngredients };
    });
  };

  const handleDeleteIngredient = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((i) => i.id !== id),
    }));
  };

  const handleAdjustStock = (id: string, delta: number, reason: string) => {
    setAppState((prev) => {
      const updatedIngredients = prev.ingredients.map((i) => {
        if (i.id === id) {
          return {
            ...i,
            stock: Math.max(0, i.stock + delta),
            lastUpdated: new Date().toISOString(),
            notes: reason,
          };
        }
        return i;
      });
      return { ...prev, ingredients: updatedIngredients };
    });
  };

  // Purchase handlers
  const handleSavePurchase = (purchase: PurchaseItem, updatedIngredient: Ingredient) => {
    setAppState((prev) => ({
      ...prev,
      purchases: [purchase, ...prev.purchases],
      ingredients: prev.ingredients.map((i) => (i.id === updatedIngredient.id ? updatedIngredient : i)),
    }));
  };

  const handleUpdatePurchase = (purchase: PurchaseItem, updatedIngredient: Ingredient) => {
    setAppState((prev) => ({
      ...prev,
      purchases: prev.purchases.map((p) => (p.id === purchase.id ? purchase : p)),
      ingredients: prev.ingredients.map((i) => (i.id === updatedIngredient.id ? updatedIngredient : i)),
    }));
  };

  const handleDeletePurchase = (purchaseId: string) => {
    setAppState((prev) => {
      const target = prev.purchases.find((p) => p.id === purchaseId);
      if (!target) return prev;

      // Deduct stock that was previously added by this purchase
      const updatedIngredients = prev.ingredients.map((ing) => {
        if (ing.id === target.ingredientId) {
          return {
            ...ing,
            stock: Math.max(0, ing.stock - target.quantity),
            lastUpdated: new Date().toISOString(),
          };
        }
        return ing;
      });

      return {
        ...prev,
        purchases: prev.purchases.filter((p) => p.id !== purchaseId),
        ingredients: updatedIngredients,
      };
    });
  };

  const handleBatchImportPurchases = (newPurchases: PurchaseItem[], updatedIngredients: Ingredient[]) => {
    setAppState((prev) => ({
      ...prev,
      purchases: [...newPurchases, ...prev.purchases],
      ingredients: updatedIngredients,
    }));
  };

  // Expense handlers
  const handleSaveExpense = (expense: ExpenseItem) => {
    setAppState((prev) => {
      const exists = prev.expenses.some((e) => e.id === expense.id);
      const updatedExpenses = exists
        ? prev.expenses.map((e) => (e.id === expense.id ? expense : e))
        : [expense, ...prev.expenses];
      return { ...prev, expenses: updatedExpenses };
    });
  };

  const handleDeleteExpense = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  };

  // Settings & System handlers
  const handleUpdateSettings = (settings: BusinessSettings) => {
    setAppState((prev) => ({ ...prev, settings }));
  };

  const handleRestoreState = (newState: AppState) => {
    setAppState(newState);
  };

  const handleResetAllData = () => {
    const empty = getInitialEmptyState();
    setAppState(empty);
  };

  return (
    <AndroidFrame
      businessName={appState.settings.businessName}
      onOpenBagiKopi={() => setIsBagiKopiOpen(true)}
      onOpenGuide={() => setIsGuideOpen(true)}
    >
      {/* Active Tab Screen Component */}
      <div className="flex-1 flex flex-col">
        {activeTab === 'dashboard' && <Dashboard appState={appState} />}

        {activeTab === 'pos' && (
          <SalesPOS
            appState={appState}
            onSaveTransaction={handleSaveTransaction}
            onCancelTransaction={handleCancelTransaction}
          />
        )}

        {activeTab === 'products' && (
          <ProductManagement
            appState={appState}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onNavigateToInventory={() => setActiveTab('inventory')}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManagement
            appState={appState}
            onSaveIngredient={handleSaveIngredient}
            onDeleteIngredient={handleDeleteIngredient}
            onAdjustStock={handleAdjustStock}
            onSavePurchase={handleSavePurchase}
            onUpdatePurchase={handleUpdatePurchase}
            onDeletePurchase={handleDeletePurchase}
            onBatchImportPurchases={handleBatchImportPurchases}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesManagement
            appState={appState}
            onSaveExpense={handleSaveExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'reports' && <ReportsView appState={appState} />}

        {activeTab === 'settings' && (
          <SettingsView
            appState={appState}
            onUpdateSettings={handleUpdateSettings}
            onRestoreState={handleRestoreState}
            onResetAllData={handleResetAllData}
          />
        )}
      </div>

      {/* Android Bottom Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lowStockCount={lowStockCount}
      />

      {/* Bagi Kopi Modal (GoPay Jamhur 08179015181 & Konfirmasi WA) */}
      <BagiKopiModal
        isOpen={isBagiKopiOpen}
        onClose={() => setIsBagiKopiOpen(false)}
      />

      {/* Panduan KebabKu & Rumus Laba Rugi Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </AndroidFrame>
  );
}
