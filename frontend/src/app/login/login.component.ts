import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  error = '';
  success = '';
  // forgot password flow
  showForgot = false;
  otpRequested = false;
  otp = '';
  newPassword = '';
  confirmPassword = '';

  constructor(private authService: AuthService, private router: Router) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  // Forgot password: request OTP
  requestOtp() {
    this.error = '';
    this.success = '';
    if (!this.email) { this.error = 'Please enter your email'; return; }
    this.authService.requestPasswordReset(this.email).subscribe({
      next: (res: any) => {
        this.otpRequested = true;
        this.success = 'OTP sent to your email (if account exists)';
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to send OTP';
      }
    });
  }

  submitReset() {
    this.error = '';
    this.success = '';
    if (!this.otp || !this.newPassword || !this.confirmPassword) { this.error = 'Please fill all fields'; return; }
    if (this.newPassword !== this.confirmPassword) { this.error = 'Passwords do not match'; return; }

    this.authService.resetPasswordWithOtp(this.email, this.otp, this.newPassword).subscribe({
      next: (res: any) => {
        this.success = res?.message || 'Password reset successfully';
        this.showForgot = false;
        this.otpRequested = false;
        this.otp = this.newPassword = this.confirmPassword = '';
      },
      error: (err) => {
        this.error = err.error?.message || `Failed to reset password (${err.status || 'unknown'})`;
      }
    });
  }

  login() {
    this.error = '';
    this.success = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (res: any) => {
        console.log('Login response:', res);
        // store token and role
        if (res && res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('role', res.role || '');
          // persist name and email from response
          localStorage.setItem('name', res.name || '');
          localStorage.setItem('email', res.email || '');
          localStorage.setItem('userId', res.userId || res._id || '');

          console.log('Stored in localStorage:', {
            token: localStorage.getItem('token'),
            role: localStorage.getItem('role'),
            name: localStorage.getItem('name'),
            email: localStorage.getItem('email')
          });

          // navigate based on role immediately
          const roleToNavigate = res.role || 'CUSTOMER';
          console.log('Navigating with role:', roleToNavigate);

          if (roleToNavigate === 'MANAGER') {
            console.log('Navigating to manager dashboard');
            this.router.navigate(['/manager/dashboard']).then(success => {
              console.log('Navigation success:', success);
            }).catch(err => {
              console.error('Navigation error:', err);
            });
          } else if (roleToNavigate === 'ADMIN') {
            console.log('Navigating to admin dashboard');
            this.router.navigate(['/admin/dashboard']).then(success => {
              console.log('Navigation success:', success);
            }).catch(err => {
              console.error('Navigation error:', err);
            });
          } else {
            console.log('Navigating to customer dashboard');
            this.router.navigate(['/customer']).then(success => {
              console.log('Navigation success:', success);
            }).catch(err => {
              console.error('Navigation error:', err);
            });
          }
        } else {
          this.error = 'Invalid response from server';
          console.error('No token in response:', res);
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        this.error = err.error?.message || 'Invalid email or password';
      }
    });
  }
}
