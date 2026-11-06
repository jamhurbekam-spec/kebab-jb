import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Boxes,
  Receipt,
  FileSpreadsheet,
  Settings,
} from 'lucide-react';

import { AppState, TabType } from '../types';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  lowStockCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, lowStockCount = 0 }) => {
  const navItems: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Utama', icon: LayoutDashboard },
    { id: 'pos', label: 'Penjualan', icon: ShoppingCart },
    { id: 'products', label: 'Produk', icon: UtensilsCrossed },
    { id: 'inventory', label: 'Stok', icon: Boxes, badge: lowStockCount },
    { id: 'expenses', label: 'Biaya', icon: Receipt },
    { id: 'reports', label: 'Laporan', icon: FileSpreadsheet },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-3 left-0 right-0 z-40 px-2 flex justify-center pointer-events-none">
      <div className="w-full max-w-[430px] bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-xl rounded-2xl p-1.5 flex items-center justify-between pointer-events-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-b from-red-50 to-amber-50 text-red-700 font-semibold shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-red-700 stroke-[2.2]' : 'stroke-[1.8]'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white font-bold text-[9px] rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-bold text-red-800' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
