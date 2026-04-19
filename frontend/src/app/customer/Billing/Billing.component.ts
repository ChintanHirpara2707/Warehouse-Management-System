import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { CustomerService } from '../../services/customer.service';

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

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  total: number;
}

@Component({
  selector: 'app-Billing',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './Billing.component.html',
  styleUrls: ['./Billing.component.css']
})
export class BillingComponent implements OnInit {

  invoices: Invoice[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private customerService: CustomerService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadInvoices();
  }

  loadInvoices() {
    this.loading = true;
    this.errorMessage = '';
    
    this.customerService.getMyInvoices().subscribe({
      next: (res: any) => {
        this.invoices = res.invoices || [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading invoices:', err);
        this.errorMessage = 'Failed to load invoices';
        this.invoices = [];
        this.loading = false;
      }
    });
  }

  payInvoice(invoice: Invoice) {
    // Navigate to dedicated payment page for this invoice
    this.router.navigate(['/customer/payment', invoice.id]);
  }

  viewInvoiceDetails(invoice: Invoice) {
    // Navigate to dedicated invoice details page
    this.router.navigate(['/customer/invoice', invoice.id]);
  }
}
