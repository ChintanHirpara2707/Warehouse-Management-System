import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private API_URL = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  // User Management
  getAllUsers() {
    return this.http.get(`${this.API_URL}/admin/users`);
  }

  getUserById(userId: string) {
    return this.http.get(`${this.API_URL}/admin/users/${userId}`);
  }

  updateUser(userId: string, userData: any) {
    return this.http.put(`${this.API_URL}/admin/users/${userId}`, userData);
  }

  deleteUser(userId: string) {
    return this.http.delete(`${this.API_URL}/admin/users/${userId}`);
  }

  // Billing Rules Management
  getBillingRules() {
    return this.http.get(`${this.API_URL}/admin/billing-rules`);
  }

  getBillingRuleById(ruleId: string) {
    return this.http.get(`${this.API_URL}/admin/billing-rules/${ruleId}`);
  }

  createBillingRule(ruleData: any) {
    return this.http.post(`${this.API_URL}/admin/billing-rules`, ruleData);
  }

  updateBillingRule(ruleId: string, ruleData: any) {
    return this.http.put(`${this.API_URL}/admin/billing-rules/${ruleId}`, ruleData);
  }

  deleteBillingRule(ruleId: string) {
    return this.http.delete(`${this.API_URL}/admin/billing-rules/${ruleId}`);
  }
}

