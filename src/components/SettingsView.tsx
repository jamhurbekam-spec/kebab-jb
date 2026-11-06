import React, { useState, useRef } from 'react';
import {
  Settings,
  Store,
  Save,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { AppState, BusinessSettings } from '../types';
import { exportBackup, validateAndImportBackup } from '../services/storage';
import { getTodayDateString } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

interface SettingsViewProps {
  appState: AppState;
  onUpdateSettings: (settings: BusinessSettings) => void;
  onRestoreState: (state: AppState) => void;
  onResetAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  appState,
  onUpdateSettings,
  onRestoreState,
  onResetAllData,
}) => {
  const [settings, setSettings] = useState<BusinessSettings>({ ...appState.settings });
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportBackup(appState);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_KebabKu_${getTodayDateString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const result = validateAndImportBackup(content);
        if (result.success && result.state) {
          onRestoreState(result.state);
          alert('Data cadangan berhasil dipulihkan!');
        } else {
          alert('Gagal memulihkan: ' + (result.error || 'Format berkas tidak valid.'));
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-stone-900 tracking-tight flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-red-700" />
            Pengaturan Aplikasi & Usaha
          </h2>
          <p className="text-[11px] text-stone-500 font-medium">
            Profil usaha, nomor WhatsApp, dan pencadangan data
          </p>
        </div>
      </div>

      {/* Business Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-4 border border-stone-200/90 shadow-2xs space-y-3.5 text-xs">
        <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <Store className="w-4 h-4 text-amber-700" />
          Identitas Usaha Kebab
        </h3>

        <div>
          <label className="font-bold text-stone-700 block mb-1">Nama Usaha Kebab *</label>
          <input
            type="text"
            required
            value={settings.businessName}
            onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="font-bold text-stone-700 block mb-1">Slogan / Tagline Usaha</label>
          <input
            type="text"
            value={settings.tagline}
            onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="font-bold text-stone-700 block mb-1">Nama Pemilik / Kasir</label>
            <input
              type="text"
              placeholder="Contoh: Budi"
              value={settings.ownerName}
              onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="font-bold text-stone-700 block mb-1">Nomor WhatsApp Usaha</label>
            <input
              type="text"
              placeholder="081234567890"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-stone-700 block mb-1">Alamat Outlet / Gerobak Kebab</label>
          <input
            type="text"
            placeholder="Jl. Raya Kebab No. 10, Jakarta"
            value={settings.address}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="font-bold text-stone-700 block mb-1">Mata Uang</label>
            <input
              type="text"
              disabled
              value="Rupiah (Rp)"
              className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-stone-500 cursor-not-allowed font-medium"
            />
          </div>
          <div>
            <label className="font-bold text-stone-700 block mb-1">Batas Minimum Stok Default</label>
            <input
              type="number"
              min="1"
              value={settings.defaultMinStock}
              onChange={(e) =>
                setSettings({ ...settings, defaultMinStock: parseInt(e.target.value) || 5 })
              }
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          {isSaved ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Pengaturan Tersimpan!</span>
            </span>
          ) : (
            <span></span>
          )}
          <button
            type="submit"
            className="py-2.5 px-4 bg-red-800 hover:bg-red-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </form>

      {/* Database Backup & Restore Section */}
      <div className="bg-white rounded-3xl p-4 border border-stone-200/90 shadow-2xs space-y-3 text-xs">
        <h3 className="font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          Pencadangan & Keamanan Data
        </h3>
        <p className="text-[11px] text-stone-500 leading-relaxed">
          Data tersimpan secara offline-first pada penyimpanan lokal perangkat Anda. Unduh berkas cadangan secara berkala agar data tidak hilang jika ganti HP.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleDownloadBackup}
            className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 border border-stone-300"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Cadangkan (JSON)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 border border-stone-300"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Pulihkan Data</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUploadBackup}
            accept=".json"
            className="hidden"
          />
        </div>

        {/* Danger Zone: Reset All Data */}
        <div className="pt-3 border-t border-stone-200/60 flex items-center justify-between">
          <div>
            <div className="font-bold text-stone-800 text-xs">Bersihkan Semua Data Usaha</div>
            <div className="text-[10px] text-stone-400">Kembalikan ke data kosong semula</div>
          </div>
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            Reset Data
          </button>
        </div>
      </div>

      {/* Reset All Data Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Bersihkan Semua Data Usaha?"
        message="PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA DATA usaha (seluruh produk, stok bahan, riwayat transaksi, dan pengeluaran)? Seluruh database akan kembali kosong seperti awal."
        confirmLabel="Ya, Bersihkan Semua"
        cancelLabel="Batal"
        isDanger={true}
        onConfirm={() => {
          onResetAllData();
          setShowResetConfirm(false);
          alert('Semua data usaha berhasil dibersihkan.');
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
