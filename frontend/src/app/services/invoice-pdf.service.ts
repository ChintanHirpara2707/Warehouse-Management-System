import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Overdue';
  paidDate?: string;
  paymentMethod?: string;
  paymentRef?: string;
  customer: {
    name: string;
    email: string;
    address: string;
  } | null;
  service: {
    type: 'Inbound' | 'Outbound';
    startDate: string;
    endDate: string;
    item: string;
    qty: number;
  } | null;
  location: string;
}

@Injectable({ providedIn: 'root' })
export class InvoicePdfService {

  async generatePdf(invoice: InvoiceData): Promise<void> {

    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    let y = margin;

    // --- BRAND LOGO ---
    doc.setFont('helvetica', 'bold');
    let x = margin;

    doc.setTextColor(37, 99, 235); // #2563eb (Blue)
    doc.setFontSize(24);
    doc.text('A', x, y);
    x += doc.getTextWidth('A');

    doc.setTextColor(15, 23, 42); // #0f172a (Black)
    doc.text('nanta', x, y);
    x += doc.getTextWidth('nanta');

    doc.setTextColor(13, 148, 136); // #0d9488 (Teal/Green)
    doc.text('W', x, y);
    x += doc.getTextWidth('W');

    doc.setTextColor(15, 23, 42);
    doc.text('are', x, y);

    // Tagline
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // #64748b (Slate 500)
    doc.text('Warehouse Service & Inventory Management', margin, y + 6);


    // --- INVOICE TITLE (Right Aligned) ---
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('INVOICE', pageWidth - margin, y, { align: 'right' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Invoice #${invoice.invoiceNumber}`, pageWidth - margin, y + 6, { align: 'right' });

    y += 20;

    // Top Divider
    doc.setDrawColor(226, 232, 240); // #e2e8f0
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    y += 12;

    // --- META DATA ROW (3 Columns) ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('DATE ISSUED', margin, y);
    doc.text('DUE DATE', margin + 50, y);
    doc.text('STATUS', margin + 100, y);

    y += 6;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(this.formatDate(invoice.invoiceDate), margin, y);
    doc.text(this.formatDate(invoice.dueDate), margin + 50, y);

    // Status text colored based on warning/success
    if (invoice.status === 'Paid') {
      doc.setTextColor(22, 101, 52); // Green
    } else if (invoice.status === 'Overdue') {
      doc.setTextColor(153, 27, 27); // Red
    } else {
      doc.setTextColor(180, 83, 9); // Amber/Yellow
    }
    doc.text(invoice.status.toUpperCase(), margin + 100, y);

    y += 15;

    // Middle Divider
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);

    y += 15;

    // --- BILLING TOP SECTIONS ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('BILL TO:', margin, y);

    y += 8;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);

    if (invoice.customer) {
      doc.text(invoice.customer.name, margin, y);

      y += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(invoice.customer.email, margin, y);

      if (invoice.customer.address) {
        y += 5;
        doc.text(invoice.customer.address, margin, y);
      }
    }

    y += 20;

    // --- TABLE HEADERS ---
    const thHeight = 12;
    doc.setFillColor(241, 245, 249); // #f1f5f9 (slate-100)
    doc.rect(margin, y, contentWidth, thHeight, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105); // #475569

    const colType = margin + 5;
    const colDesc = colType + 35;
    const colPeriod = colDesc + 45;
    const colLoc = colPeriod + 45;
    const colQty = pageWidth - margin - 5;

    const ty = y + 8;
    doc.text('SERVICE TYPE', colType, ty);
    doc.text('DESCRIPTION / ITEM', colDesc, ty);
    doc.text('PERIOD', colPeriod, ty);
    doc.text('LOCATION', colLoc, ty);
    doc.text('QTY', colQty, ty, { align: 'right' });

    y += thHeight + 8;

    // --- TABLE DATA ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85); // #334155

    if (invoice.service) {
      doc.text(invoice.service.type, colType, y);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(invoice.service.item, colDesc, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`${this.formatDate(invoice.service.startDate)} -`, colPeriod, y);
      doc.text(`${this.formatDate(invoice.service.endDate)}`, colPeriod, y + 5);

      doc.setTextColor(51, 65, 85);
      doc.text(invoice.location || 'N/A', colLoc, y);

      doc.text(invoice.service.qty.toString(), colQty, y, { align: 'right' });
    } else {
      doc.text('No active service details found.', colType, y);
    }

    y += 25;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 15;

    // --- FOOTER AND TOTALS ---

    // Left side: Payment terms/info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('PAYMENT METHOD', margin, y);

    y += 6;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(invoice.paymentMethod || 'Credit/Debit (Default)', margin, y);
    if (invoice.paymentRef) {
      y += 5;
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Ref: ${invoice.paymentRef}`, margin, y);
    }

    // Right side: Totals Box, aligned to right bottom
    const totalBoxWidth = 80;
    const totalBoxX = pageWidth - margin - totalBoxWidth;
    let totalBoxY = y - 10;

    doc.setFillColor(248, 250, 252); // #f8fafc
    doc.rect(totalBoxX, totalBoxY, totalBoxWidth, 35, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(totalBoxX, totalBoxY, totalBoxWidth, 35, 'S');

    totalBoxY += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Subtotal:', totalBoxX + 5, totalBoxY);

    const formattedAmount = 'Rs ' + invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 });
    doc.text(formattedAmount, totalBoxX + totalBoxWidth - 5, totalBoxY, { align: 'right' });

    totalBoxY += 6;
    doc.setDrawColor(203, 213, 225); // #cbd5e1
    doc.line(totalBoxX + 5, totalBoxY, totalBoxX + totalBoxWidth - 5, totalBoxY);

    totalBoxY += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Total Amount:', totalBoxX + 5, totalBoxY);

    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235); // Blue
    doc.text(formattedAmount, totalBoxX + totalBoxWidth - 5, totalBoxY, { align: 'right' });


    // --- SAVE PDF ---
    doc.save(`AnantaWare-Invoice-${invoice.invoiceNumber}.pdf`);
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';

    const date = new Date(dateStr);

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
