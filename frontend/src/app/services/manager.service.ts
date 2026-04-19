import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ManagerService {

  private API_URL = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  // Inventory Management
  getInventory() {
    return this.http.get(`${this.API_URL}/manager/inventory`);
  }

  createInventoryItem(itemData: any) {
    return this.http.post(`${this.API_URL}/manager/inventory`, itemData);
  }

  updateInventoryItem(itemId: string, itemData: any) {
    return this.http.put(`${this.API_URL}/manager/inventory/${itemId}`, itemData);
  }

  deleteInventoryItem(itemId: string) {
    return this.http.delete(`${this.API_URL}/manager/inventory/${itemId}`);
  }

  // Service Requests
  getServiceRequests(type?: string, status?: string) {
    const params: any = {};
    if (type) params.type = type;
    if (status) params.status = status;
    return this.http.get(`${this.API_URL}/manager/service-requests`, { params });
  }

  updateServiceRequestStatus(requestId: string, status: string, location?: string, notes?: string) {
    const body: any = { status };
    if (location) {
      body.location = location;
    }
    if (notes) {
      body.notes = notes;
    }
    return this.http.put(`${this.API_URL}/manager/service-requests/${requestId}/status`, body);
  }

  // Statistics
  getStats() {
    return this.http.get(`${this.API_URL}/manager/stats`);
  }
}

