import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- import FormsModule
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,                   // <-- standalone component
  imports: [CommonModule, FormsModule, RouterModule], // <-- add FormsModule here
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  role = 'CUSTOMER';
  error = '';
  success = '';

  showPassword = false;
  showConfirmPassword = false;

  constructor(private authService: AuthService, private router: Router) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  register() {
    this.error = '';
    this.success = '';

    if (this.password !== this.confirmPassword) {
      this.error = "Passwords do not match";
      return;
    }

    this.authService.register(this.name, this.email, this.password, this.role)
      .subscribe({
        next: (res: any) => {
          this.success = "Registration successful!";
          // persist name/email locally so UI can show them
          localStorage.setItem('email', this.email);
          localStorage.setItem('name', this.name);
          setTimeout(() => this.router.navigate(['/login']), 1500);
        },
        error: (err) => {
          this.error = err.error.message || "Registration failed";
        }
      });
  }
}
