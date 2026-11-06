import React, { useState } from 'react';
import {
  BookOpen,
  Calculator,
  HelpCircle,
  X,
  TrendingUp,
  Receipt,
  Boxes,
  UtensilsCrossed,
  ArrowRight,
  CheckCircle2,
  Info,
  Scale,
  DollarSign,
} from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'rumus' | 'alur' | 'stok'>('rumus');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200 text-stone-800">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-red-800 to-amber-700 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-amber-200" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight leading-tight">Panduan KebabKu</h3>
              <p className="text-[10px] text-amber-200/90">Cara Pakai & Logika Hitung Laba Rugi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-stone-100 p-1 border-b border-stone-200 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('rumus')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'rumus' ? 'bg-white text-red-800 shadow-2xs' : 'text-stone-600'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Rumus Laba Rugi</span>
          </button>
          <button
            onClick={() => setActiveTab('alur')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'alur' ? 'bg-white text-red-800 shadow-2xs' : 'text-stone-600'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Alur Usaha</span>
          </button>
          <button
            onClick={() => setActiveTab('stok')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'stok' ? 'bg-white text-red-800 shadow-2xs' : 'text-stone-600'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Stok & Persediaan</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-stone-700">
          {/* TAB 1: RUMUS LABA RUGI */}
          {activeTab === 'rumus' && (
            <div className="space-y-3.5">
              <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-2xl">
                <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                  <Calculator className="w-4 h-4 text-amber-700" />
                  Prinsip Akuntansi KebabKu
                </span>
                <p className="text-[11px] text-amber-900 mt-1 leading-relaxed">
                  Aplikasi KebabKu memisahkan antara <b>Modal Bahan Terpakai (HPP)</b>, <b>Biaya Operasional Rutin</b>, dan <b>Pembelian Persediaan</b> agar laba yang dihitung 100% akurat tanpa salah mengira persediaan bahan sebagai kerugian.
                </p>
              </div>

              {/* Rumus Utama Card */}
              <div className="bg-stone-900 text-white p-4 rounded-2xl space-y-2.5">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Rumus Utama Laba Rugi
                </div>

                <div className="space-y-1.5 font-mono text-[11px] bg-stone-950 p-3 rounded-xl border border-stone-800">
                  <div className="text-white">
                    1. <span className="text-amber-300 font-bold">Omzet Penjualan</span> = Total harga kebab yang dibeli pelanggan
                  </div>
                  <div className="text-red-400">
                    2. <span className="font-bold">HPP Produk Terjual</span> = Jumlah takaran bahan x Harga beli bahan
                  </div>
                  <div className="text-emerald-400 border-t border-stone-800 pt-1">
                    3. <span className="font-bold">Keuntungan Kotor</span> = Omzet Penjualan - HPP Terpakai
                  </div>
                  <div className="text-red-400">
                    4. <span className="font-bold">Biaya Operasional</span> = Gas LPG + Bensin + Sewa + Listrik + dll.
                  </div>
                  <div className="text-amber-300 font-bold border-t border-amber-500/40 pt-1 text-xs">
                    5. KEUNTUNGAN BERSIH = Keuntungan Kotor - Biaya Operasional
                  </div>
                </div>
              </div>

              {/* Contoh Nyata Simulasi Perhitungan */}
              <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl space-y-2">
                <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-red-700" />
                  Contoh Simulasi 1 Porsi Kebab Jumbo:
                </h4>

                <div className="space-y-1 text-[11px] bg-white p-2.5 rounded-xl border border-stone-200">
                  <div className="flex justify-between">
                    <span>1 Lembar Tortilla (Harga beli @Rp 1.500)</span>
                    <span className="font-medium">Rp 1.500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>50 gram Daging Kebab (Beli @Rp 90.000/kg)</span>
                    <span className="font-medium">Rp 4.500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>20 gram Saus & Mayones</span>
                    <span className="font-medium">Rp 500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1 Slice Keju</span>
                    <span className="font-medium">Rp 1.000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1 Kantong Kertas Kebab</span>
                    <span className="font-medium">Rp 300</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-stone-100 pt-1 text-red-700">
                    <span>Total HPP per Porsi:</span>
                    <span>Rp 7.800</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] bg-white p-2.5 rounded-xl border border-stone-200">
                  <div className="flex justify-between">
                    <span>Harga Jual Kebab Jumbo:</span>
                    <span className="font-bold text-stone-900">Rp 20.000</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>HPP Modal Terpakai:</span>
                    <span>- Rp 7.800</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700 pt-0.5 border-t border-stone-100">
                    <span>Keuntungan Kotor per Porsi:</span>
                    <span>Rp 12.200 (Margin 61%)</span>
                  </div>
                </div>

                <p className="text-[10px] text-stone-500 italic">
                  Jika hari ini Anda menjual <b>20 porsi</b>, Keuntungan Kotor = 20 x Rp 12.200 = <b>Rp 244.000</b>. Jika biaya gas & bensin hari ini <b>Rp 44.000</b>, maka <b>Keuntungan Bersih</b> Anda hari ini adalah <b>Rp 200.000</b>.
                </p>
              </div>

              {/* Mengapa Beli Bahan Bukan Kerugian Langsung? */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-[11px] text-blue-950 space-y-1">
                <span className="font-bold flex items-center gap-1 text-blue-900">
                  <Info className="w-3.5 h-3.5" />
                  Kenapa Pembelian Bahan Tidak Langsung Masuk Rugi?
                </span>
                <p className="leading-relaxed">
                  Jika Anda membeli daging sapi Rp 900.000 (10 kg), uang kas keluar tetapi Anda mendapatkan aset daging yang tersimpan di kulkas. Daging tersebut baru dihitung sebagai modal berkurang ketika laku terjual dalam bentuk porsi kebab (HPP). Dengan cara ini, laporan keuangan Anda tidak akan mengalami "rugi semu" saat restock bahan di awal minggu.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: ALUR KERJA CEPAT */}
          {activeTab === 'alur' && (
            <div className="space-y-3">
              {[
                {
                  step: '1',
                  title: 'Daftarkan Bahan Baku (Menu "Stok")',
                  desc: 'Masukkan semua bahan yang Anda gunakan: Kulit tortilla, daging kebab, sosis, sayuran, saus, mayones, keju, kemasan, dll. Lengkap dengan satuan (lembar, gram, pcs) dan harga beli per satuannya.',
                },
                {
                  step: '2',
                  title: 'Buat Menu Kebab & Resep (Menu "Produk")',
                  desc: 'Buat menu seperti Kebab Original, Jumbo, atau Spesial. Tentukan harga jual, lalu tambahkan komposisi takaran bahan untuk 1 porsi (misal 1 lembar tortilla + 50 gr daging). HPP dan estimasi keuntungan langsung terhitung otomatis!',
                },
                {
                  step: '3',
                  title: 'Lakukan Penjualan di Kasir (Menu "Penjualan")',
                  desc: 'Cukup pilih menu kebab yang dipesan pelanggan dan klik Simpan (Bayar). Pembelian tunai langsung menghitung kembalian uang. Setiap kali transaksi selesai, stok bahan baku otomatis berkurang!',
                },
                {
                  step: '4',
                  title: 'Catat Biaya Operasional (Menu "Biaya")',
                  desc: 'Catat pengeluaran harian seperti isi ulang Gas LPG, bensin, listrik, air galon, atau sewa lapak. Biaya operasional ini otomatis mengurangi laba kotor menjadi laba bersih.',
                },
                {
                  step: '5',
                  title: 'Lihat Dashboard & Unduh Laporan (Menu "Utama" & "Laporan")',
                  desc: 'Dashboard otomatis menampilkan total penjualan, porsi terjual, HPP modal terpakai, dan keuntungan bersih hari ini. Anda juga bisa mengunduh laporan bulanan dalam format PDF dan Excel.',
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-3 bg-stone-50 border border-stone-200 p-3 rounded-2xl">
                  <div className="w-7 h-7 rounded-full bg-red-800 text-white font-black flex items-center justify-center shrink-0 text-xs shadow-xs">
                    {item.step}
                  </div>
                  <div>
                    <h5 className="font-bold text-stone-900 text-xs">{item.title}</h5>
                    <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: STOK & PERSEDIAAN */}
          {activeTab === 'stok' && (
            <div className="space-y-3">
              <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl space-y-1.5">
                <span className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-amber-700" />
                  Otomasi Pengurangan & Penambahan Stok
                </span>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Anda tidak perlu lagi mencatat buku stok manual. Aplikasi KebabKu bekerja otomatis:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-stone-600">
                  <li><b>Saat Terjual</b>: Bahan baku resep menu berkurang otomatis sesuai jumlah porsi.</li>
                  <li><b>Saat Restock (Beli Bahan)</b>: Stok bahan baku bertambah otomatis begitu disimpan.</li>
                  <li><b>Jika Transaksi Dibatalkan</b>: Stok bahan yang sebelumnya terpakai otomatis dikembalikan ke inventori.</li>
                  <li><b>Stok Menipis</b>: Muncul lencana kuning "Menipis" jika sisa stok berada di bawah batas minimum yang Anda tentukan.</li>
                </ul>
              </div>

              <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl space-y-1.5">
                <span className="font-bold text-stone-900 text-xs">Impor Pembelian via Excel</span>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Di menu <b>Stok &gt; Pembelian</b>, klik <b>"Unduh Template Excel"</b>, isi daftar belanjaan bahan baku di Excel laptop/HP Anda, lalu klik <b>"Impor File Excel"</b> untuk memasukkan puluhan bahan sekaligus dalam satu klik.
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl space-y-1.5">
                <span className="font-bold text-stone-900 text-xs">Pencegahan Stok Minus</span>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Jika bahan di inventori tersisa lebih sedikit daripada kebutuhan resep kasir, aplikasi akan menampilkan pop-up peringatan sebelum Anda melanjutkan transaksi.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-red-800 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          >
            Mengerti & Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
