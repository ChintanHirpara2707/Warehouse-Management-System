import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  private API_URL = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  private getCustomerId(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem('userId');
  }

  // Inventory Management
  getMyInventory() {
    const customerId = this.getCustomerId();
    if (!customerId) {
      // During SSR or if not logged in, return empty data
      return of({ inventory: [] });
    }
    return this.http.get(`${this.API_URL}/customer/inventory`, {
      params: { customerId }
    });
  }

  // Service Requests
  getMyServiceRequests() {
    const customerId = this.getCustomerId();
    if (!customerId) {
      return of({ requests: [] });
    }
    return this.http.get(`${this.API_URL}/customer/service-requests`, {
      params: { customerId }
    });
  }

  createServiceRequest(requestData: any) {
    return this.http.post(`${this.API_URL}/customer/service-requests`, requestData);
  }

  updateServiceRequest(requestId: string, requestData: any) {
    return this.http.put(`${this.API_URL}/customer/service-requests/${requestId}`, requestData);
  }

  deleteServiceRequest(requestId: string) {
    return this.http.delete(`${this.API_URL}/customer/service-requests/${requestId}`);
  }

  // Billing
  getMyInvoices() {
    const customerId = this.getCustomerId();
    if (!customerId) {
      return of({ invoices: [] });
    }
    return this.http.get(`${this.API_URL}/customer/invoices`, {
      params: { customerId }
    });
  }

  payInvoice(invoiceId: string) {
    return this.http.post(`${this.API_URL}/customer/invoices/${invoiceId}/pay`, {});
  }

  payInvoiceWithMethod(
    invoiceId: string,
    payload: { paymentMethod: 'QR' | 'UPI' | 'CARD'; paymentRef?: string }
  ) {
    return this.http.post(`${this.API_URL}/customer/invoices/${invoiceId}/pay`, payload);
  }

  getInvoiceDetails(invoiceId: string) {
    return this.http.get(`${this.API_URL}/customer/invoices/${invoiceId}`);
  }

  downloadInvoicePdf(invoiceId: string) {
    return this.http.get(`${this.API_URL}/customer/invoices/${invoiceId}/pdf`, {
      responseType: 'blob'
    });
  }

  // Reports
  generateInventoryReport() {
    const customerId = this.getCustomerId();
    if (!customerId) {
      return of({});
    }
    return this.http.get(`${this.API_URL}/customer/reports/inventory`, {
      params: { customerId },
      responseType: 'blob'
    });
  }

  generateActivityReport() {
    const customerId = this.getCustomerId();
    if (!customerId) {
      return of({});
    }
    return this.http.get(`${this.API_URL}/customer/reports/activity`, {
      params: { customerId },
      responseType: 'blob'
    });
  }

  generateBillingReport() {
    const customerId = this.getCustomerId();
    if (!customerId) {
      return of({});
    }
    return this.http.get(`${this.API_URL}/customer/reports/billing`, {
      params: { customerId },
      responseType: 'blob'
    });
  }

  // Dashboard Statistics
  getDashboardStats() {
    const customerId = this.getCustomerId();
    if (!customerId) {
      return of({
        totalInventory: 0,
        totalQuantity: 0,
        storageUsed: 0,
        inboundThisWeek: 0,
        outboundThisWeek: 0,
        scheduledOutbound: 0,
        pendingRequests: 0,
        locationCount: 0
      });
    }
    return this.http.get(`${this.API_URL}/customer/stats`, {
      params: { customerId }
    });
  }
}

