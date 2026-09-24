import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { OrderRecord } from '../types';

/**
 * Generates an official downloadable Retail Invoice & Certificate of Authenticity PDF
 */
export async function generateOrderInvoicePdf(order: OrderRecord): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 15;

  // Header Banner
  doc.setFillColor(217, 119, 6); // amber-600
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('HONEY CHAIN — TAX INVOICE & PROVENANCE RECEIPT', margin, 12);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Government-Accredited Direct Apiary Traceability Platform | FSSAI Lic: 10024011000841', margin, 19);

  // Invoice Meta
  let y = 36;
  doc.setFontSize(9);
  doc.setTextColor(30);
  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice No: INV-${order.orderId.replace('ORD-', '')}`, margin, y);
  doc.text(`Order ID: ${order.orderId}`, margin, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, margin, y + 10);
  doc.text(`Payment Status: PAID (${order.paymentDetails.method})`, margin, y + 15);
  doc.text(`Razorpay Ref: ${order.paymentDetails.razorpayPaymentId || 'N/A'}`, margin, y + 20);

  // QR Code for Order / Provenance
  const verifyUrl = `${window.location.origin}?verifyOrder=${order.orderId}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 100 });
  doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 30, y - 4, 30, 30);
  doc.setFontSize(7);
  doc.text('Scan for Digital Order', pageWidth - margin - 30, y + 30);

  // Customer Shipping Details
  y = 65;
  doc.setFillColor(244, 244, 245);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 24, 27);
  doc.text('Billed & Shipped To:', margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${order.shippingAddress.fullName} | Phone: ${order.shippingAddress.phone}`, margin + 4, y + 11);
  doc.text(
    `${order.shippingAddress.addressLine1}, ${order.shippingAddress.addressLine2 || ''} ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
    margin + 4,
    y + 16
  );

  // Items Table Header
  y = 95;
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(margin, y, pageWidth - margin * 2, 7.5, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Item Description & Provenance Batch', margin + 4, y + 5);
  doc.text('Net Wt', margin + 95, y + 5);
  doc.text('Price (₹)', margin + 120, y + 5);
  doc.text('Qty', margin + 145, y + 5);
  doc.text('Total (₹)', margin + 160, y + 5);

  y += 7.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40);

  order.items.forEach((item, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, pageWidth - margin * 2, 9, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.text(item.title, margin + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(`Batch: ${item.batchId} | Apiary Beekeeper: ${item.beekeeperName}`, margin + 4, y + 8.5);

    doc.setFontSize(8);
    doc.setTextColor(40);
    doc.text(`${item.jarSizeGrams}g`, margin + 95, y + 5.5);
    doc.text(`₹${item.priceInr}`, margin + 120, y + 5.5);
    doc.text(`${item.quantity}`, margin + 145, y + 5.5);
    doc.text(`₹${item.priceInr * item.quantity}`, margin + 160, y + 5.5);

    y += 9.5;
  });

  // Price Calculation Summary
  y += 4;
  doc.setDrawColor(220);
  doc.line(margin + 100, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', margin + 110, y);
  doc.text(`₹${order.subtotalInr}`, margin + 160, y);
  y += 5;

  doc.text('GST (5% Pure Honey):', margin + 110, y);
  doc.text(`₹${order.taxInr}`, margin + 160, y);
  y += 5;

  doc.text('Shipping & Delivery:', margin + 110, y);
  doc.text(order.shippingInr > 0 ? `₹${order.shippingInr}` : 'FREE', margin + 160, y);
  y += 6;

  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin + 100, y - 4, pageWidth - margin - (margin + 100), 8, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text('Grand Total:', margin + 110, y + 1.5);
  doc.text(`₹${order.totalInr}`, margin + 160, y + 1.5);

  // Authenticity & Purity Guarantee Note
  y += 18;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(74, 222, 128);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('✔ HONEY CHAIN 100% PURITY & PROVENANCE GUARANTEE', margin + 4, y + 6);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50);
  doc.text(
    'This raw honey was harvested without adulteration, heated processing, or corn syrup additives. Every jar is linked to continuous apiary IoT sensor telemetry and certified by an accredited testing laboratory.',
    margin + 4,
    y + 11,
    { maxWidth: pageWidth - margin * 2 - 8 }
  );

  // Footer Signature
  y += 32;
  doc.setFontSize(7.5);
  doc.setTextColor(120);
  doc.text('Authorized Signatory', margin, y);
  doc.text('Honey Chain Quality Assurance Cell', margin, y + 4);

  doc.text('Thank you for supporting authentic beekeepers across India.', pageWidth - margin - 80, y);

  doc.save(`HoneyChain_Invoice_${order.orderId}.pdf`);
}
