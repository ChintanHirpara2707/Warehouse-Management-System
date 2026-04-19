import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private API_URL = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  updateProfile(email: string, profileData: any) {
    return this.http.put(`${this.API_URL}/profile/update`, { email, ...profileData });
  }

  changePassword(email: string, oldPassword: string, newPassword: string) {
    return this.http.put(`${this.API_URL}/profile/change-password`, { email, oldPassword, newPassword });
  }
}
