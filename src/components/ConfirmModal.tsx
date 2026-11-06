import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'Konfirmasi Hapus',
  message = 'Apakah Anda yakin ingin menghapus data ini?',
  itemName,
  confirmLabel = 'Ya, Hapus',
  cancelLabel = 'Batal',
  isDanger = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl relative border border-stone-200/90 text-stone-800 space-y-4">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="text-center space-y-2 pt-1">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-sm ring-4 ${
              isDanger
                ? 'bg-rose-100 text-rose-600 ring-rose-50'
                : 'bg-amber-100 text-amber-700 ring-amber-50'
            }`}
          >
            {isDanger ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <h3 className="font-black text-base text-stone-900 tracking-tight">{title}</h3>
          <p className="text-xs text-stone-500 leading-relaxed px-2">
            {message}
          </p>
          {itemName && (
            <div className="mt-2 py-1.5 px-3 bg-stone-100 rounded-xl font-bold text-xs text-stone-800 max-w-xs mx-auto truncate border border-stone-200">
              "{itemName}"
            </div>
          )}
        </div>

        <p className="text-[11px] text-stone-400 text-center italic">
          Data yang dihapus tidak dapat dipulihkan kembali.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-100 active:scale-95 transition cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 px-3 rounded-xl text-white text-xs font-bold shadow-md active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-amber-600 hover:bg-amber-500'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
