import jsPDF from 'jspdf';
import { formatRupiah, formatDateShort, formatNumber, getTodayDateString } from '../utils/formatters';

export function exportReportToPDF(reportData: {
  businessName: string;
  tagline?: string;
  address?: string;
  phone?: string;
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
    description: string;
    amount: number;
  }[];
}): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 18;

  // Header banner / title
  doc.setFillColor(183, 28, 28); // Kebab Crimson Red
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(reportData.businessName.toUpperCase(), 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(reportData.tagline || 'Laporan Keuangan & Pengelolaan Usaha Kebab', 14, 18);
  if (reportData.address || reportData.phone) {
    const contact = [reportData.address, reportData.phone].filter(Boolean).join(' | ');
    doc.text(contact, 14, 23);
  }

  // Right side date in header
  doc.text(`Periode: ${reportData.periodLabel}`, pageWidth - 14, 14, { align: 'right' });
  doc.text(`Dicetak: ${formatDateShort(new Date().toISOString())}`, pageWidth - 14, 20, { align: 'right' });

  currentY = 38;

  // Section 1: Ringkasan Utama (Laba Rugi)
  doc.setTextColor(33, 33, 33);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('RINGKASAN LABA RUGI USAHA', 14, currentY);
  currentY += 6;

  // Draw 2 summary cards
  const boxWidth = (pageWidth - 28 - 6) / 2;
  const boxHeight = 24;

  // Card 1: Omzet
  doc.setFillColor(254, 243, 199); // Amber-100
  doc.roundedRect(14, currentY, boxWidth, boxHeight, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(146, 64, 14);
  doc.text('TOTAL OMZET PENJUALAN', 18, currentY + 7);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(formatRupiah(reportData.summary.totalRevenue), 18, currentY + 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatNumber(reportData.summary.kebabSold)} porsi (${reportData.summary.transactionCount} transaksi)`, 18, currentY + 21);

  // Card 2: Laba Bersih
  const isNetProfit = reportData.summary.netProfit >= 0;
  doc.setFillColor(isNetProfit ? 240 : 254, isNetProfit ? 253 : 242, isNetProfit ? 244 : 242);
  doc.roundedRect(14 + boxWidth + 6, currentY, boxWidth, boxHeight, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(isNetProfit ? 22 : 185, isNetProfit ? 101 : 28, isNetProfit ? 52 : 28);
  doc.text(isNetProfit ? 'KEUNTUNGAN BERSIH (NET PROFIT)' : 'KERUGIAN BERSIH', 18 + boxWidth + 6, currentY + 7);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(formatRupiah(reportData.summary.netProfit), 18 + boxWidth + 6, currentY + 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Setelah HPP & Biaya Operasional', 18 + boxWidth + 6, currentY + 21);

  currentY += boxHeight + 10;

  // Breakdown Table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 33, 33);
  doc.text('Rincian Perhitungan Keuangan:', 14, currentY);
  currentY += 5;

  const rows = [
    { label: '1. Total Omzet Penjualan', val: formatRupiah(reportData.summary.totalRevenue), isBold: true },
    { label: '2. Total Modal Bahan Terpakai (HPP Porsi Terjual)', val: `(${formatRupiah(reportData.summary.totalHpp)})`, isBold: false },
    { label: '   = KEUNTUNGAN KOTOR (Omzet - HPP)', val: formatRupiah(reportData.summary.grossProfit), isBold: true },
    { label: '3. Total Biaya Operasional (Gas, Bensin, Sewa, dll)', val: `(${formatRupiah(reportData.summary.operationalExpenses)})`, isBold: false },
    { label: '   = KEUNTUNGAN BERSIH AKHIR', val: formatRupiah(reportData.summary.netProfit), isBold: true, highlight: true },
  ];

  rows.forEach((r) => {
    if (r.highlight) {
      doc.setFillColor(254, 242, 242);
      doc.rect(14, currentY - 4, pageWidth - 28, 7, 'F');
    }
    doc.setFont('helvetica', r.isBold ? 'bold' : 'normal');
    doc.setTextColor(33, 33, 33);
    doc.text(r.label, 16, currentY);
    doc.text(r.val, pageWidth - 16, currentY, { align: 'right' });
    currentY += 6.5;
  });

  currentY += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  // Inventory & Purchasing Cashflow
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('Informasi Kas & Persediaan:', 14, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.text('Total Pembelian Bahan Baku Periode Ini:', 16, currentY);
  doc.text(formatRupiah(reportData.summary.purchasesTotal), pageWidth - 16, currentY, { align: 'right' });
  currentY += 5;

  doc.text('Estimasi Nilai Persediaan Sisa Bahan Saat Ini:', 16, currentY);
  doc.text(formatRupiah(reportData.summary.inventoryValuation), pageWidth - 16, currentY, { align: 'right' });
  currentY += 10;

  // Transactions preview
  if (reportData.transactions.length > 0 && currentY < 230) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 33, 33);
    doc.text(`Riwayat Transaksi Terakhir (Maksimal 8 Transaksi)`, 14, currentY);
    currentY += 6;

    doc.setFillColor(245, 245, 245);
    doc.rect(14, currentY - 4, pageWidth - 28, 6, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('ID Transaksi', 16, currentY);
    doc.text('Waktu', 60, currentY);
    doc.text('Menu Terjual', 100, currentY);
    doc.text('Total (Rp)', pageWidth - 16, currentY, { align: 'right' });
    currentY += 6;

    const sampleTrx = reportData.transactions.slice(0, 8);
    sampleTrx.forEach((tx) => {
      if (currentY > 275) return;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.text(tx.id, 16, currentY);
      doc.text(formatDateShort(tx.date), 60, currentY);
      const shortSummary = tx.itemSummary.length > 30 ? tx.itemSummary.substring(0, 28) + '...' : tx.itemSummary;
      doc.text(shortSummary, 100, currentY);
      doc.text(formatRupiah(tx.totalAmount), pageWidth - 16, currentY, { align: 'right' });
      currentY += 5.5;
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(140, 140, 140);
  doc.text('Dokumen ini digenerate secara otomatis oleh Aplikasi KebabKu Android.', 14, 290);
  doc.text(`Halaman 1`, pageWidth - 14, 290, { align: 'right' });

  // Download PDF
  const filename = `Laporan_KebabKu_${getTodayDateString()}.pdf`;
  doc.save(filename);
}
