import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CustomerService } from '../../services/customer.service';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  total: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  dueDate: string;
  paidDate?: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Overdue';
  items: InvoiceItem[];
  paymentMethod?: 'UPI' | 'QR' | 'CARD';
  paymentRef?: string;
}

@Component({
  selector: 'app-Payment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe],
  templateUrl: './Payment.component.html',
  styleUrls: ['./Payment.component.css']
})
export class PaymentComponent implements OnInit {

  invoice: Invoice | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';

  paymentMethod: 'QR' | 'UPI' | 'CARD' | '' = '';
  upiId = 'anantaware@upi';
  cardLast4 = '';
  paymentRef = '';
  fakeQrDataUrl = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService
  ) { }

  ngOnInit() {
    const invoiceId = this.route.snapshot.paramMap.get('invoiceId');
    if (!invoiceId) {
      this.errorMessage = 'Invalid invoice ID';
      return;
    }

    this.loadInvoice(invoiceId);
  }

  loadInvoice(invoiceId: string) {
    this.loading = true;
    this.errorMessage = '';

    // Reuse existing API to fetch all invoices, then find the one we need
    this.customerService.getMyInvoices().subscribe({
      next: (res: any) => {
        const invoices: Invoice[] = res.invoices || [];
        const found = invoices.find(inv => inv.id === invoiceId);

        if (!found) {
          this.errorMessage = 'Invoice not found';
        } else {
          this.invoice = found;
          // Generate a professional, real scannable UPI QR Box using a free API based on the invoice data
          const upiString = encodeURIComponent(`upi://pay?pa=${this.upiId}&pn=AnantaWare&am=${found.amount}&tn=Invoice ${found.invoiceNumber}`);
          this.fakeQrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${upiString}&margin=10`;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading invoice:', err);
        this.errorMessage = err.error?.message || 'Failed to load invoice';
        this.loading = false;
      }
    });
  }

  backToBilling() {
    this.router.navigate(['/customer/billing']);
  }

  copyToClipboard(text: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('UPI ID copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    } else {
      // Fallback
      alert('Clipboard API not supported in this browser.');
    }
  }

  confirmPayment() {
    if (!this.invoice) {
      return;
    }

    if (!this.paymentMethod) {
      this.errorMessage = 'Please select a payment method';
      return;
    }

    let ref = '';
    if (this.paymentMethod === 'UPI') {
      ref = this.upiId;
    } else if (this.paymentMethod === 'CARD') {
      if (!this.cardLast4.trim()) {
        this.errorMessage = 'Please enter last 4 digits of your card';
        return;
      }
      ref = `CARD-XXXX-XXXX-XXXX-${this.cardLast4.trim()}`;
    } else if (this.paymentMethod === 'QR') {
      ref = 'QR-SCAN';
    }

    this.loading = true;
    this.errorMessage = '';

    this.customerService
      .payInvoiceWithMethod(this.invoice.id, {
        paymentMethod: this.paymentMethod,
        paymentRef: ref
      })
      .subscribe({
        next: () => {
          this.successMessage = `Invoice ${this.invoice!.invoiceNumber} paid via ${this.paymentMethod}`;
          this.invoice!.status = 'Paid';
          this.invoice!.paidDate = new Date().toISOString();
          this.invoice!.paymentMethod = this.paymentMethod as any;
          this.invoice!.paymentRef = ref;
          this.loading = false;

          // Navigate back to billing after payment
          setTimeout(() => {
            this.backToBilling();
          }, 1500);
        },
        error: (err) => {
          console.error('Error processing payment:', err);
          this.errorMessage = err.error?.message || 'Failed to process payment';
          this.loading = false;
        }
      });
  }
}


