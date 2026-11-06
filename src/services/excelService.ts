import * as XLSX from 'xlsx';
import { UnitType, PurchaseItem, Ingredient } from '../types';
import { generateId, getTodayDateString } from '../utils/formatters';

export interface ParsedPurchaseRow {
  ingredientName: string;
  category: string;
  quantity: number;
  unit: UnitType;
  pricePerUnit: number;
  totalPrice: number;
  supplier: string;
  date: string;
  notes: string;
}

/**
 * Downloads a clean Excel template for raw material purchases
 */
export function downloadPurchaseTemplate(): void {
  // Column definitions with clear instructions
  const headers = [
    'Nama Bahan Baku*',
    'Kategori Bahan',
    'Jumlah Pembelian*',
    'Satuan*',
    'Harga Beli Satuan (Rp)*',
    'Nama Pemasok',
    'Tanggal Pembelian (YYYY-MM-DD)',
    'Catatan',
  ];

  // Provide clear guidance in the first data row as a placeholder/example
  const instructionRow = [
    'Contoh: Daging Kebab Sapi',
    'Daging & Isian',
    10,
    'kg',
    85000,
    'Supplier Berkah',
    getTodayDateString(),
    'Pembelian mingguan',
  ];

  const wsData = [
    headers,
    instructionRow,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 25 }, // Nama Bahan Baku
    { wch: 20 }, // Kategori
    { wch: 18 }, // Jumlah
    { wch: 12 }, // Satuan
    { wch: 22 }, // Harga Beli Satuan
    { wch: 20 }, // Pemasok
    { wch: 24 }, // Tanggal
    { wch: 25 }, // Catatan
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Pembelian');

  // Add guide sheet
  const guideData = [
    ['PANDUAN PENGISIAN TEMPLATE PEMBELIAN BAHAN BAKU KEBABKU'],
    [''],
    ['1. Kolom dengan tanda (*) wajib diisi.'],
    ['2. Nama Bahan Baku: Ketik nama bahan yang dibeli (misal: Kulit Tortilla, Saus Sambal).'],
    ['3. Satuan yang didukung: pcs, lembar, gram, kg, ml, liter, bungkus, botol, butir, roll, porsi.'],
    ['4. Jumlah Pembelian: Hanya masukkan angka (contoh: 5 atau 2.5).'],
    ['5. Harga Beli Satuan: Masukkan harga per satu satuan (contoh: 1500 atau 75000).'],
    ['6. Tanggal Pembelian: Format YYYY-MM-DD (contoh: 2026-11-05). Jika kosong, tanggal hari ini akan digunakan.'],
    ['7. Hapus baris contoh atau ganti dengan data pembelian asli Anda sebelum mengimpor.'],
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk Pengisian');

  // Save file
  XLSX.writeFile(wb, 'Template_Pembelian_Bahan_KebabKu.xlsx');
}

/**
 * Parses and validates an uploaded Excel file for purchases
 */
export async function parsePurchasesExcelFile(
  file: File
): Promise<{ validRows: ParsedPurchaseRow[]; errors: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const wb = XLSX.read(buffer, { type: 'binary', cellDates: true });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];

        if (!sheet) {
          resolve({ validRows: [], errors: ['Berkas Excel kosong atau tidak memiliki lembar kerja.'] });
          return;
        }

        const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

        if (rawData.length === 0) {
          resolve({ validRows: [], errors: ['Tidak ada data baris yang ditemukan dalam berkas Excel.'] });
          return;
        }

        const validRows: ParsedPurchaseRow[] = [];
        const errors: string[] = [];

        rawData.forEach((row, index) => {
          const rowNum = index + 2; // header is row 1

          // Extract fields with multiple possible header keys
          const name = String(
            row['Nama Bahan Baku*'] ||
            row['Nama Bahan Baku'] ||
            row['Nama Bahan'] ||
            row['Bahan'] ||
            ''
          ).trim();

          // Skip if this is the example instruction row
          if (name.toLowerCase().startsWith('contoh:')) {
            return;
          }

          if (!name) {
            errors.push(`Baris ${rowNum}: Nama bahan baku wajib diisi.`);
            return;
          }

          const rawQty = row['Jumlah Pembelian*'] || row['Jumlah Pembelian'] || row['Jumlah'] || row['Qty'];
          const qty = Number(rawQty);
          if (isNaN(qty) || qty <= 0) {
            errors.push(`Baris ${rowNum} (${name}): Jumlah pembelian harus berupa angka lebih dari 0.`);
            return;
          }

          const rawPrice =
            row['Harga Beli Satuan (Rp)*'] ||
            row['Harga Beli Satuan'] ||
            row['Harga Satuan'] ||
            row['Harga Beli'] ||
            row['Harga'];
          const price = Number(rawPrice);
          if (isNaN(price) || price < 0) {
            errors.push(`Baris ${rowNum} (${name}): Harga beli satuan harus berupa angka tidak negatif.`);
            return;
          }

          const rawUnit = String(row['Satuan*'] || row['Satuan'] || 'pcs').trim().toLowerCase();
          const validUnits: UnitType[] = [
            'pcs',
            'lembar',
            'gram',
            'kg',
            'ml',
            'liter',
            'bungkus',
            'botol',
            'butir',
            'roll',
            'porsi',
          ];
          const unit: UnitType = validUnits.includes(rawUnit as UnitType) ? (rawUnit as UnitType) : 'pcs';

          const category = String(row['Kategori Bahan'] || row['Kategori'] || 'Daging & Isian').trim();
          const supplier = String(row['Nama Pemasok'] || row['Pemasok'] || row['Supplier'] || '').trim();
          const notes = String(row['Catatan'] || '').trim();

          // Parse date
          let dateStr = getTodayDateString();
          const rawDate = row['Tanggal Pembelian (YYYY-MM-DD)'] || row['Tanggal Pembelian'] || row['Tanggal'];
          if (rawDate) {
            if (rawDate instanceof Date) {
              dateStr = rawDate.toISOString().split('T')[0];
            } else {
              const str = String(rawDate).trim();
              if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
                dateStr = str;
              }
            }
          }

          validRows.push({
            ingredientName: name,
            category: category || 'Daging & Isian',
            quantity: qty,
            unit,
            pricePerUnit: price,
            totalPrice: Math.round(qty * price),
            supplier,
            date: dateStr,
            notes,
          });
        });

        resolve({ validRows, errors });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

/**
 * Exports comprehensive financial & inventory report to Excel
 */
export function exportReportToExcel(reportData: {
  businessName: string;
  periodLabel: string;
  summary: {
    totalRevenue: number;
    totalHpp: number;
    grossProfit: number;
    operationalExpenses: number;
    netProfit: number;
    kebabSold: number;
    transactionCount: number;
    purchasesTotal: number;
    inventoryValuation: number;
  };
  transactions: {
    id: string;
    date: string;
    totalAmount: number;
    totalHpp: number;
    grossProfit: number;
    paymentMethod: string;
    itemSummary: string;
  }[];
  expenses: {
    id: string;
    date: string;
    category: string;
    classification: string;
    description: string;
    amount: number;
  }[];
  ingredients: Ingredient[];
}): void {
  const wb = XLSX.utils.book_new();

  // 1. Ringkasan Laba Rugi Sheet
  const summarySheetData = [
    [`LAPORAN KEUANGAN USAHA KEBAB - ${reportData.businessName.toUpperCase()}`],
    [`Periode: ${reportData.periodLabel}`],
    [`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`],
    [''],
    ['INDIKATOR KEUANGAN', 'NOMINAL (RP)'],
    ['Total Omzet Penjualan', reportData.summary.totalRevenue],
    ['Jumlah Porsi Terjual', reportData.summary.kebabSold],
    ['Jumlah Transaksi', reportData.summary.transactionCount],
    ['Total HPP Produk Terjual (Modal Terpakai)', reportData.summary.totalHpp],
    ['KEUNTUNGAN KOTOR (Omzet - HPP)', reportData.summary.grossProfit],
    ['Total Pengeluaran Operasional', reportData.summary.operationalExpenses],
    ['KEUNTUNGAN BERSIH (Laba Bersih)', reportData.summary.netProfit],
    [''],
    ['INFORMASI ARUS KAS & PERSEDIAAN', 'NOMINAL (RP)'],
    ['Total Pembelian Bahan Baku (Periode Ini)', reportData.summary.purchasesTotal],
    ['Estimasi Nilai Persediaan Stok Saat Ini', reportData.summary.inventoryValuation],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
  wsSummary['!cols'] = [{ wch: 45 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Laba Rugi');

  // 2. Transaksi Penjualan Sheet
  if (reportData.transactions.length > 0) {
    const trxData = reportData.transactions.map((t) => ({
      'ID Transaksi': t.id,
      'Tanggal & Waktu': t.date,
      'Menu & Jumlah': t.itemSummary,
      'Metode Bayar': t.paymentMethod,
      'Total Omzet (Rp)': t.totalAmount,
      'HPP Modal (Rp)': t.totalHpp,
      'Laba Kotor (Rp)': t.grossProfit,
    }));
    const wsTrx = XLSX.utils.json_to_sheet(trxData);
    wsTrx['!cols'] = [
      { wch: 22 },
      { wch: 20 },
      { wch: 35 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, wsTrx, 'Riwayat Penjualan');
  }

  // 3. Rincian Pengeluaran Sheet
  if (reportData.expenses.length > 0) {
    const expData = reportData.expenses.map((e) => ({
      'Tanggal': e.date,
      'Kategori': e.category,
      'Jenis Pengeluaran': e.classification === 'operasional' ? 'Biaya Operasional' : e.classification === 'aset' ? 'Aset / Peralatan' : 'Modal Usaha',
      'Keterangan': e.description,
      'Nominal (Rp)': e.amount,
    }));
    const wsExp = XLSX.utils.json_to_sheet(expData);
    wsExp['!cols'] = [{ wch: 15 }, { wch: 22 }, { wch: 22 }, { wch: 35 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsExp, 'Daftar Pengeluaran');
  }

  // 4. Stok Bahan Baku Sheet
  if (reportData.ingredients.length > 0) {
    const stockData = reportData.ingredients.map((ing) => ({
      'Nama Bahan': ing.name,
      'Kategori': ing.category,
      'Sisa Stok': ing.stock,
      'Satuan': ing.unit,
      'Harga Beli Satuan (Rp)': ing.unitCost,
      'Nilai Aset Stok (Rp)': Math.round(ing.stock * ing.unitCost),
      'Batas Minimum': ing.minStockAlert,
      'Status': ing.stock <= ing.minStockAlert ? 'MENIPIS' : 'AMAN',
    }));
    const wsStock = XLSX.utils.json_to_sheet(stockData);
    wsStock['!cols'] = [
      { wch: 25 },
      { wch: 20 },
      { wch: 14 },
      { wch: 12 },
      { wch: 22 },
      { wch: 22 },
      { wch: 15 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, wsStock, 'Persediaan Bahan');
  }

  const filename = `Laporan_Keuangan_KebabKu_${getTodayDateString()}.xlsx`;
  XLSX.writeFile(wb, filename);
}
