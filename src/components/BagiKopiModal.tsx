import React, { useState } from 'react';
import { Coffee, Copy, Check, MessageCircle, X, Heart, Sparkles, Send } from 'lucide-react';

interface BagiKopiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BagiKopiModal: React.FC<BagiKopiModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedNominal, setSelectedNominal] = useState<number | null>(20000);

  if (!isOpen) return null;

  const gopayNumber = '08179015181';
  const gopayName = 'Jamhur';
  const waNumber = '628179015181';

  const handleCopy = () => {
    navigator.clipboard.writeText(gopayNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const nominalText = selectedNominal
    ? `sebesar Rp ${selectedNominal.toLocaleString('id-ID')}`
    : 'secangkir kopi';

  const waMessage = encodeURIComponent(
    `Halo Mas Jamhur, saya pengguna aplikasi KebabKu. Saya sudah kirim dukungan bagi kopi ${nominalText} via GoPay ke ${gopayNumber} a/n ${gopayName}. Terima kasih banyak atas aplikasinya, sangat membantu usaha!`
  );

  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl relative border border-stone-200/90 text-stone-800 space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-stone-950 flex items-center justify-center mx-auto shadow-md ring-4 ring-amber-100">
            <Coffee className="w-7 h-7" />
          </div>
          <h3 className="font-black text-base text-stone-900 tracking-tight flex items-center justify-center gap-1.5">
            <span>Bagi Kopi KebabKu</span>
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed px-2">
            Terima kasih telah menggunakan KebabKu! Traktir secangkir kopi untuk mendukung kelanjutan aplikasi ini.
          </p>
        </div>

        {/* GoPay Box */}
        <div className="bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 rounded-2xl p-3.5 border border-sky-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <span className="font-black text-xs text-sky-900 tracking-wide">GOPAY</span>
            </div>
            <span className="text-[11px] font-bold text-sky-800 bg-sky-100/90 px-2 py-0.5 rounded-full">
              a/n {gopayName}
            </span>
          </div>

          <div className="bg-white rounded-xl p-2.5 border border-sky-200/90 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-stone-400 uppercase font-semibold">Nomor GoPay</div>
              <div className="font-mono text-base font-black text-stone-900 tracking-wider">
                {gopayNumber}
              </div>
            </div>

            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-2xs ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-sky-600 hover:bg-sky-500 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Nominal Pilihan Santai */}
        <div>
          <span className="text-[11px] font-bold text-stone-600 block mb-1.5">
            Pilih Nominal (Opsional):
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {[10000, 20000, 50000].map((nominal) => (
              <button
                key={nominal}
                onClick={() => setSelectedNominal(nominal)}
                className={`py-1.5 px-2 rounded-xl font-bold border transition text-center ${
                  selectedNominal === nominal
                    ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-2xs'
                    : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                }`}
              >
                Rp {nominal.toLocaleString('id-ID')}
              </button>
            ))}
          </div>
        </div>

        {/* WhatsApp Confirmation Button */}
        <div className="space-y-2 pt-1">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md transition active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Konfirmasi ke WhatsApp (Jamhur)</span>
          </a>

          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-medium text-stone-500 hover:text-stone-700 text-center"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
