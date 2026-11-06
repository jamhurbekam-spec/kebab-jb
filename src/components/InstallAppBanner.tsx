import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppBannerProps {
  onOpenInstallModal: () => void;
}

export const InstallAppBanner: React.FC<InstallAppBannerProps> = ({ onOpenInstallModal }) => {
  const { isInstalled, isInstallable, triggerInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('kebabku_install_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  if (isInstalled || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('kebabku_install_banner_dismissed', 'true');
  };

  const handleAction = async () => {
    if (isInstallable) {
      const res = await triggerInstall();
      if (res === 'accepted') {
        setIsDismissed(true);
      } else {
        onOpenInstallModal();
      }
    } else {
      onOpenInstallModal();
    }
  };

  return (
    <div className="mx-3 mt-2 mb-1 p-2.5 bg-gradient-to-r from-red-800 via-amber-900 to-red-900 text-white rounded-2xl shadow-sm border border-amber-500/30 flex items-center justify-between gap-2.5 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 shadow-2xs font-bold">
          <Smartphone className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white text-[11px] truncate">
              Pasang Aplikasi KebabKu
            </span>
            <span className="bg-amber-400 text-stone-950 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider hidden sm:inline-block">
              Offline
            </span>
          </div>
          <p className="text-[10px] text-amber-100/80 truncate">
            Akses kasir & stok instan langsung dari layar utama HP
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleAction}
          className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-stone-950 font-black text-[10px] px-2.5 py-1.5 rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
        >
          <Download className="w-3 h-3 text-stone-950" />
          <span>Pasang</span>
        </button>
        <button
          onClick={handleDismiss}
          className="w-6 h-6 rounded-lg text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center transition cursor-pointer"
          title="Tutup pemberitahuan"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
