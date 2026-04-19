import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { InvoicePdfService, InvoiceData } from '../../services/invoice-pdf.service';

interface InvoiceDetails {
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

@Component({
  selector: 'app-invoice-view',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './InvoiceView.component.html',
  styleUrls: ['./InvoiceView.component.css']
})
export class InvoiceViewComponent implements OnInit {
  invoice: InvoiceDetails | null = null;
  loading = false;
  errorMessage = '';
  generatingPdf = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private invoicePdfService: InvoicePdfService
  ) { }

  ngOnInit(): void {
    const invoiceId = this.route.snapshot.paramMap.get('invoiceId');
    if (!invoiceId) {
      this.errorMessage = 'Invalid invoice ID';
      return;
    }

    this.loading = true;
    this.customerService.getInvoiceDetails(invoiceId).subscribe({
      next: (res: any) => {
        this.invoice = res as InvoiceDetails;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading invoice details:', err);
        this.errorMessage = err.error?.message || 'Failed to load invoice details';
        this.loading = false;
      }
    });
  }

  async downloadInvoice() {
    if (!this.invoice) {
      return;
    }

    this.generatingPdf = true;
    try {
      const pdfData: InvoiceData = {
        id: this.invoice.id,
        invoiceNumber: this.invoice.invoiceNumber,
        invoiceDate: this.invoice.invoiceDate,
        dueDate: this.invoice.dueDate,
        amount: this.invoice.amount,
        status: this.invoice.status,
        paidDate: this.invoice.paidDate,
        paymentMethod: this.invoice.paymentMethod,
        paymentRef: this.invoice.paymentRef,
        customer: this.invoice.customer,
        service: this.invoice.service,
        location: this.invoice.location
      };

      await this.invoicePdfService.generatePdf(pdfData);
    } catch (err) {
      console.error('Error generating invoice PDF:', err);
      this.errorMessage = 'Failed to generate PDF. Please try again.';
    } finally {
      this.generatingPdf = false;
    }
  }

  goBack() {
    this.router.navigate(['/customer/billing']);
  }
}


