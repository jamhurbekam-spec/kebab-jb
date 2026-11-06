import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  CheckCircle2,
  Share2,
  MoreVertical,
  PlusSquare,
  ShieldCheck,
  Zap,
  WifiOff,
  Flame,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, triggerInstall } = usePWAInstall();
  const [installResult, setInstallResult] = useState<'idle' | 'success' | 'dismissed'>('idle');

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const res = await triggerInstall();
    if (res === 'accepted') {
      setInstallResult('success');
      setTimeout(() => {
        onClose();
      }, 2000);
    } else if (res === 'dismissed') {
      setInstallResult('dismissed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white text-stone-900 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-stone-200 text-xs animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-800 text-white flex items-center justify-center shadow-xs">
              <Flame className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-black text-sm text-stone-900 leading-tight">Pasang Aplikasi KebabKu</h3>
              <p className="text-[10px] text-stone-500 font-medium">Instalasi langsung ke layar smartphone HP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Already Installed Notice */}
        {isInstalled ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="font-black text-stone-900 text-sm">Aplikasi Sudah Terpasang!</h4>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              KebabKu saat ini sudah aktif sebagai aplikasi di smartphone Anda. Anda dapat membukanya langsung dari layar utama HP tanpa kuota internet.
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
            >
              Tutup
            </button>
          </div>
        ) : (
          <>
            {/* Install CTA Card */}
            <div className="bg-gradient-to-br from-red-800 to-amber-900 text-white p-4 rounded-2xl space-y-3 shadow-md relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-400/20 rounded-full blur-xl pointer-events-none"></div>

              <div className="flex items-start justify-between">
                <div>
                  <span className="bg-amber-400 text-stone-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Offline First
                  </span>
                  <h4 className="font-black text-base text-white mt-1">Instal ke HP Sekarang</h4>
                </div>
                <Smartphone className="w-8 h-8 text-amber-300" />
              </div>

              <p className="text-[11px] text-amber-100/90 leading-relaxed">
                Pasang KebabKu langsung di HP Anda. Aplikasi bekerja cepat, ringan, dan 100% offline tanpa perlu koneksi internet.
              </p>

              {/* Direct Install Button */}
              <button
                onClick={handleInstallClick}
                className="w-full py-2.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:brightness-105 active:scale-98 text-stone-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-stone-950" />
                <span>{isInstallable ? 'Pasang Sekarang (1-Klik)' : 'Pasang Aplikasi KebabKu'}</span>
              </button>

              {installResult === 'success' && (
                <div className="bg-emerald-500/90 text-white text-[11px] font-bold p-2 rounded-lg text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Aplikasi berhasil dipasang di HP Anda!</span>
                </div>
              )}
            </div>

            {/* Keunggulan Instalasi */}
            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/80 space-y-2">
              <h5 className="font-bold text-stone-800 text-[11px] uppercase tracking-wide">
                Keuntungan Memasang di HP:
              </h5>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex items-center gap-1.5 text-stone-700 bg-white p-2 rounded-xl border border-stone-200/60 shadow-2xs">
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Buka instan 1 detik dari homescreen</span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-700 bg-white p-2 rounded-xl border border-stone-200/60 shadow-2xs">
                  <WifiOff className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>100% Offline tanpa kuota internet</span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-700 bg-white p-2 rounded-xl border border-stone-200/60 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Data tersimpan aman di memori HP</span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-700 bg-white p-2 rounded-xl border border-stone-200/60 shadow-2xs">
                  <Smartphone className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Tampilan layar penuh mirip native APK</span>
                </div>
              </div>
            </div>

            {/* Manual Instructions Guide */}
            <div className="space-y-2 pt-1">
              <h5 className="font-bold text-stone-800 text-[11px] flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-stone-600" />
                <span>Petunjuk Jika Pop-up Tidak Otomatis Muncul:</span>
              </h5>

              {isIOS ? (
                /* iOS Safari Instructions */
                <div className="bg-stone-100 rounded-2xl p-3 border border-stone-200 space-y-2 text-stone-700 text-[11px]">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Untuk Pengguna iPhone / iPad (Safari):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-stone-600 pl-1 leading-relaxed">
                    <li>Ketuk ikon <b>Bagikan (Share)</b> <Share2 className="w-3 h-3 inline text-blue-600" /> di menu bawah Safari.</li>
                    <li>Gulir ke bawah dan pilih <b>"Tambahkan ke Layar Utama" (Add to Home Screen)</b>.</li>
                    <li>Ketuk <b>Tambah (Add)</b> di pojok kanan atas. Ikon KebabKu siap dibuka di layar HP Anda!</li>
                  </ol>
                </div>
              ) : (
                /* Android Chrome Instructions */
                <div className="bg-stone-100 rounded-2xl p-3 border border-stone-200 space-y-2 text-stone-700 text-[11px]">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <MoreVertical className="w-3.5 h-3.5 text-stone-800" />
                    <span>Untuk Pengguna HP Android (Google Chrome):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-stone-600 pl-1 leading-relaxed">
                    <li>
                      Ketuk <b>titik tiga (⋮)</b> di pojok kanan atas browser Chrome.
                    </li>
                    <li>
                      Pilih menu <b>"Install aplikasi"</b> atau <b>"Tambahkan ke Layar Utama"</b> (Add to Home Screen).
                    </li>
                    <li>
                      Ketuk tombol <b>"Install"</b>. Aplikasi KebabKu akan terpasang di HP Anda.
                    </li>
                  </ol>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-xl text-xs transition"
            >
              Tutup
            </button>
          </>
        )}
      </div>
    </div>
  );
};
