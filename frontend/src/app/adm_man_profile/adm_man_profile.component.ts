import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProfileService } from '../services/profile.service';

@Component({
  selector: 'app-adm_man_profile',
  standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './adm_man_profile.component.html',
  styleUrls: ['./adm_man_profile.component.css']
})
export class Adm_man_profileComponent implements OnInit {

    user = {
      name: '',
      email: '',
      phone: '',
      company: '',
      address: ''
    };

    successMessage = '';
    errorMessage = '';
    isEditing = false;
    // Change password state
    isChangingPassword = false;
    currentPassword = '';
    newPassword = '';
    confirmPassword = '';

    constructor(private router: Router, private profileService: ProfileService) {}

    ngOnInit() {
      // Load user data from localStorage
      this.user.name = localStorage.getItem('name') || '';
      this.user.email = localStorage.getItem('email') || '';
      this.user.phone = localStorage.getItem('phone') || '';
      this.user.company = localStorage.getItem('company') || '';
      this.user.address = localStorage.getItem('address') || '';
    }

    updateProfile() {
      if (!this.user.name || !this.user.email) {
        this.errorMessage = 'Name and Email are required!';
        this.successMessage = '';
        return;
      }
      if (!this.user.email) {
        this.errorMessage = 'User email missing. Please login again.';
        this.successMessage = '';
        return;
      }

      // Save to database via API
      this.profileService.updateProfile(this.user.email, {
        name: this.user.name,
        phone: this.user.phone,
        company: this.user.company,
        address: this.user.address
      }).subscribe({
        next: (res: any) => {
          // Save to localStorage
          localStorage.setItem('name', this.user.name);
          localStorage.setItem('phone', this.user.phone);
          localStorage.setItem('company', this.user.company);
          localStorage.setItem('address', this.user.address);

          this.successMessage = 'Profile updated successfully!';
          this.errorMessage = '';
          this.isEditing = false;

          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (err) => {
          console.error('Profile update error:', err);
          const serverMsg = err?.error?.message;
          this.errorMessage = serverMsg || `Failed to update profile (${err.status || 'unknown'})`;
          this.successMessage = '';
        }
      });
    }

    toggleEdit() {
      this.isEditing = !this.isEditing;
      console.log('Profile edit mode:', this.isEditing);
      if (this.isEditing) {
        // focus the first editable input after view updates
        setTimeout(() => {
          const el: HTMLInputElement | null = document.querySelector('input[name="name"]');
          if (el) {
            el.focus();
            el.select();
          }
        }, 0);
      }
    }

    toggleChangePassword() {
      this.isChangingPassword = !this.isChangingPassword;
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    }

    changePassword() {
      this.errorMessage = '';
      this.successMessage = '';

      if (!this.user.email) {
        this.errorMessage = 'Email missing. Please login again.';
        return;
      }
      if (!this.currentPassword || !this.newPassword) {
        this.errorMessage = 'Please fill all password fields.';
        return;
      }
      if (this.newPassword !== this.confirmPassword) {
        this.errorMessage = 'New password and confirm password do not match.';
        return;
      }

      this.profileService.changePassword(this.user.email, this.currentPassword, this.newPassword)
        .subscribe({
          next: (res: any) => {
            this.successMessage = res?.message || 'Password changed successfully';
            this.errorMessage = '';
            this.isChangingPassword = false;
            this.currentPassword = '';
            this.newPassword = '';
            this.confirmPassword = '';
            setTimeout(() => { this.successMessage = ''; }, 3000);
          },
          error: (err) => {
            console.error('Change password error:', err);
            const serverMsg = err?.error?.message;
            this.errorMessage = serverMsg || `Failed to change password (${err.status || 'unknown'})`;
          }
        });
    }

    goBack() {
      this.router.navigate(['/customer']);
    }

}
