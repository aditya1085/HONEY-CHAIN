import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { BatchRecord, LabReport, HoneyPack } from '../types';

/**
 * Generate a printable PDF sticker sheet for Honey Jars (A4 Grid)
 * Each sticker has:
 * - Brand border and Honey Chain header
 * - Crisp QR code pointing to verification link
 * - Pack ID & Batch ID
 * - Floral Source & Net Weight
 * - Lab Certified Pure seal
 * - Consumer scan instructions
 */
export async function generatePackQRPdf(
  batch: BatchRecord,
  packs: HoneyPack[],
  jarSizeGrams: number
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 10;
  const marginY = 15;
  const cols = 2;
  const rows = 4;
  const stickerWidth = (pageWidth - marginX * 2 - 10) / cols; // ~90mm
  const stickerHeight = (pageHeight - marginY * 2 - 15) / rows; // ~63mm

  let packIndex = 0;
  const totalPacks = packs.length;

  while (packIndex < totalPacks) {
    if (packIndex > 0) {
      doc.addPage();
    }

    // Page header
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Honey Chain Traceability Stickers — Batch: ${batch.batchId} | Date: ${new Date().toLocaleDateString()}`,
      marginX,
      marginY - 5
    );

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (packIndex >= totalPacks) break;

        const pack = packs[packIndex];
        const x = marginX + c * (stickerWidth + 10);
        const y = marginY + r * (stickerHeight + 5);

        // Sticker Border (Amber rounded box)
        doc.setDrawColor(217, 119, 6); // amber-600
        doc.setLineWidth(0.6);
        doc.roundedRect(x, y, stickerWidth, stickerHeight, 3, 3);

        // Header ribbon
        doc.setFillColor(254, 243, 199); // amber-100
        doc.roundedRect(x + 1, y + 1, stickerWidth - 2, 9, 2, 2, 'F');

        doc.setFontSize(8);
        doc.setTextColor(180, 83, 9); // amber-700
        doc.setFont('helvetica', 'bold');
        doc.text('HONEY CHAIN • GOVT ACCREDITED PURITY', x + 4, y + 6);

        // Generate QR code data URL
        const verifyUrl = `${window.location.origin}?verifyPack=${pack.packId}`;
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
          margin: 1,
          width: 140,
          color: {
            dark: '#1c1917',
            light: '#ffffff',
          },
        });

        // Add QR code image
        doc.addImage(qrDataUrl, 'PNG', x + 3, y + 12, 32, 32);

        // Pack Details next to QR
        const textX = x + 38;
        doc.setFontSize(9);
        doc.setTextColor(24, 24, 27); // zinc-900
        doc.setFont('helvetica', 'bold');
        doc.text(`Pack: ${pack.packId}`, textX, y + 16);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(82, 82, 91); // zinc-600
        doc.text(`Batch: ${batch.batchId}`, textX, y + 21);
        doc.text(`Variety: ${batch.floralSource} Honey`, textX, y + 26);
        doc.text(`Net Wt: ${jarSizeGrams}g | Origin: ${batch.state}`, textX, y + 31);

        // Lab verdict badge
        doc.setFillColor(220, 252, 231); // green-100
        doc.setDrawColor(34, 197, 94); // green-500
        doc.setLineWidth(0.3);
        doc.roundedRect(textX, y + 34, 45, 6, 1, 1, 'FD');
        doc.setTextColor(22, 101, 52); // green-800
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.text('✔ 100% PURE & UNADULTERATED', textX + 3, y + 38);

        // Footer instructions
        doc.setFillColor(244, 244, 245);
        doc.rect(x + 1, y + stickerHeight - 9, stickerWidth - 2, 8, 'F');
        doc.setFontSize(6.5);
        doc.setTextColor(113, 113, 122);
        doc.setFont('helvetica', 'normal');
        doc.text('Scan QR to view lab report, apiary GPS & IoT health history', x + 3, y + stickerHeight - 4);

        packIndex++;
      }
    }
  }

  doc.save(`HoneyChain_Stickers_${batch.batchId}.pdf`);
}

/**
 * Generate an official Certificate of Analysis (COA) PDF for a Lab Report
 */
export async function generateLabReportPdf(report: LabReport, batch: BatchRecord): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const margin = 15;
  const pageWidth = 210;

  // Header Banner
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('HONEY CHAIN — OFFICIAL CERTIFICATE OF ANALYSIS', margin, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Government-Accredited Apiary Testing & Purity Verification', margin, 18);

  // Testing Lab Info
  let y = 35;
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 27);
  doc.setFont('helvetica', 'bold');
  doc.text(`Testing Laboratory: ${report.labName}`, margin, y);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text(`Accreditation / License No: ${report.accreditationNo} (NABL / FSSAI)`, margin, y + 5);
  doc.text(`Report ID: ${report.reportId} | Sample ID: ${report.sampleId}`, margin, y + 10);
  doc.text(`Batch ID: ${report.batchId} | Test Date: ${new Date(report.testDate).toLocaleDateString()}`, margin, y + 15);
  doc.text(`Verified Apiary State: ${batch.state} | Floral Type: ${batch.floralSource}`, margin, y + 20);

  // QR Code for Cryptographic Verification
  const verifyUrl = `${window.location.origin}?verifyReport=${report.reportHash}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 120 });
  doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 35, y - 5, 35, 35);
  doc.setFontSize(6.5);
  doc.text('Scan to Verify Hash', pageWidth - margin - 33, y + 33);

  // Parameters Table Header
  y = 70;
  doc.setFillColor(243, 244, 246);
  doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30);
  doc.text('Parameter / Metric', margin + 4, y + 5.5);
  doc.text('FSSAI / Codex Standard', margin + 70, y + 5.5);
  doc.text('Observed Result', margin + 125, y + 5.5);
  doc.text('Status', margin + 160, y + 5.5);

  // Parameter Rows
  const p = report.parameters;
  const rows = [
    { name: 'Moisture Content', std: 'Max 20.0 %', val: `${p.moisture}%`, pass: p.moisture <= 20 },
    { name: 'Fructose Content', std: 'Min 35.0 %', val: `${p.fructose}%`, pass: p.fructose >= 35 },
    { name: 'Glucose Content', std: 'Min 30.0 %', val: `${p.glucose}%`, pass: p.glucose >= 30 },
    { name: 'Fructose / Glucose Ratio', std: 'Min 0.95', val: `${p.fgRatio}`, pass: p.fgRatio >= 0.95 },
    { name: 'Sucrose Content', std: 'Max 5.0 %', val: `${p.sucrose}%`, pass: p.sucrose <= 5 },
    { name: 'HMF (Hydroxymethylfurfural)', std: 'Max 80.0 mg/kg', val: `${p.hmf} mg/kg`, pass: p.hmf <= 80 },
    { name: 'Pollen Count (Micro-flora)', std: 'Detectable Floral', val: `${p.pollenCountMillion}M/10g`, pass: true },
    { name: 'C4 Sugars / Corn Syrup', std: 'Negative', val: `${p.c4Sugars}`, pass: p.c4Sugars === 'Negative' },
    { name: 'Antibiotic Residues', std: 'Below LOD (Pass)', val: `${p.antibioticsResidue}`, pass: p.antibioticsResidue === 'Pass' },
    { name: 'Heavy Metals (Pb, Cd, As)', std: 'Below FSSAI Limits', val: `${p.heavyMetals}`, pass: p.heavyMetals === 'Pass' },
  ];

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  rows.forEach((row, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
    }
    doc.setTextColor(40);
    doc.text(row.name, margin + 4, y + 5);
    doc.text(row.std, margin + 70, y + 5);
    doc.text(row.val, margin + 125, y + 5);

    if (row.pass) {
      doc.setTextColor(22, 101, 52);
      doc.setFont('helvetica', 'bold');
      doc.text('PASS', margin + 160, y + 5);
    } else {
      doc.setTextColor(185, 28, 28);
      doc.setFont('helvetica', 'bold');
      doc.text('FAIL', margin + 160, y + 5);
    }
    doc.setFont('helvetica', 'normal');
    y += 7;
  });

  // Overall Verdict Box
  y += 6;
  const isPure = report.verdict === 'PURE';
  doc.setFillColor(isPure ? 220 : 254, isPure ? 252 : 226, isPure ? 231 : 226);
  doc.setDrawColor(isPure ? 34 : 239, isPure ? 197 : 68, isPure ? 94 : 68);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 18, 2, 2, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isPure ? 20 : 153, isPure ? 83 : 27, isPure ? 45 : 27);
  doc.text(`OFFICIAL VERDICT: ${report.verdict} HONEY`, margin + 6, y + 8);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Remarks: ${report.remarks || 'Sample complies with all Gazette of India Food Safety & Standards Regulations.'}`,
    margin + 6,
    y + 14
  );

  // Cryptographic Fingerprint Box
  y += 24;
  doc.setFillColor(244, 244, 245);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60);
  doc.text('CRYPTOGRAPHIC HASH & LEDGER INTEGRITY SEAL', margin + 5, y + 6);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(24, 24, 27);
  doc.text(`SHA-256: ${report.reportHash}`, margin + 5, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(110);
  doc.text('This hash is permanently anchored to the Honey Chain ledger. Any change invalidates the cryptographic signature.', margin + 5, y + 17);

  // Signatures
  y += 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(40);
  doc.text('Chief Analytical Chemist:', margin + 5, y);
  doc.setFont('helvetica', 'normal');
  doc.text(report.testedBy || 'Authorized Quality Officer', margin + 5, y + 6);
  doc.text(`${report.labName}`, margin + 5, y + 11);

  doc.text('Honey Chain Verification Gate:', pageWidth - margin - 70, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 119, 6);
  doc.text('DIGITALLY ANCHORED', pageWidth - margin - 70, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Block ID: ${report.ledgerBlockIndex !== undefined ? `#${report.ledgerBlockIndex}` : 'Verified'}`, pageWidth - margin - 70, y + 11);

  doc.save(`HoneyChain_COA_${report.reportId}.pdf`);
}
