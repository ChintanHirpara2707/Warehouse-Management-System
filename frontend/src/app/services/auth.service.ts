import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private API_URL = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http.post(`${this.API_URL}/login`, { email, password });
  }
  register(name: string, email: string, password: string, role: string) {
  return this.http.post(`${this.API_URL}/register`, { name, email, password, role });
}

  // Forgot password: request OTP
  requestPasswordReset(email: string) {
    return this.http.post(`${this.API_URL}/forgot-password`, { email });
  }

  // Reset password using OTP
  resetPasswordWithOtp(email: string, otp: string, newPassword: string) {
    return this.http.put(`${this.API_URL}/forgot-password/reset`, { email, otp, newPassword });
  }
}
