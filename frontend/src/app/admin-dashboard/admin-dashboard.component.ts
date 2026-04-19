import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../services/admin.service';

interface User {
  _id?: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  company?: string;
  createdAt?: string;
}

interface BillingRule {
  _id?: string;
  name: string;
  type: 'storage' | 'handling' | 'service';
  rate: number;
  unit: string;
  description: string;
  isActive: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  adminName = '';
  activeSection: 'dashboard' | 'users' | 'billing' | 'system' = 'dashboard';

  // User Management
  users: User[] = [];
  showUserForm = false;
  editingUser: User | null = null;
  userForm: User = {
    name: '',
    email: '',
    role: 'CUSTOMER',
    phone: '',
    company: ''
  };

  // Billing Rules
  billingRules: BillingRule[] = [];
  showBillingForm = false;
  editingBilling: BillingRule | null = null;
  billingForm: BillingRule = {
    name: '',
    type: 'storage',
    rate: 0,
    unit: 'per sqft/month',
    description: '',
    isActive: true
  };

  // System Stats
  systemStats = {
    totalUsers: 0,
    totalCustomers: 0,
    totalManagers: 0,
    totalAdmins: 0,
    activeBillingRules: 0
  };

  errorMessage = '';
  successMessage = '';

  constructor(private router: Router, private adminService: AdminService) {}

  ngOnInit() {
    const storedName = localStorage.getItem('name');
    const storedEmail = localStorage.getItem('email');
    const role = localStorage.getItem('role');

    if (role !== 'ADMIN') {
      this.router.navigate(['/login']);
      return;
    }

    this.adminName = storedName || storedEmail?.split('@')[0] || 'Admin';
    this.loadUsers();
    this.loadBillingRules();
    this.loadSystemStats();
  }

  // Navigation
  setActiveSection(section: 'dashboard' | 'users' | 'billing' | 'system') {
    this.activeSection = section;
  }

  // User Management
  loadUsers() {
    this.adminService.getAllUsers().subscribe({
      next: (res: any) => {
        this.users = res.users || [];
        this.updateUserStats();
      },
      error: (err) => {
        console.error('Error loading users:', err);
        // Fallback to empty array if API fails
        this.users = [];
      }
    });
  }

  updateUserStats() {
    this.systemStats.totalUsers = this.users.length;
    this.systemStats.totalCustomers = this.users.filter(u => u.role === 'CUSTOMER').length;
    this.systemStats.totalManagers = this.users.filter(u => u.role === 'MANAGER').length;
    this.systemStats.totalAdmins = this.users.filter(u => u.role === 'ADMIN').length;
  }

  openUserForm(user?: User) {
    if (user) {
      this.editingUser = user;
      this.userForm = { ...user };
    } else {
      this.editingUser = null;
      this.userForm = {
        name: '',
        email: '',
        role: 'CUSTOMER',
        phone: '',
        company: ''
      };
    }
    this.showUserForm = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeUserForm() {
    this.showUserForm = false;
    this.editingUser = null;
    this.userForm = {
      name: '',
      email: '',
      role: 'CUSTOMER',
      phone: '',
      company: ''
    };
  }

  saveUser() {
    if (!this.userForm.name || !this.userForm.email) {
      this.errorMessage = 'Name and Email are required';
      return;
    }

    if (this.editingUser && this.editingUser._id) {
      // Update user
      this.adminService.updateUser(this.editingUser._id, this.userForm).subscribe({
        next: (res: any) => {
          this.successMessage = 'User updated successfully';
          this.loadUsers();
          this.closeUserForm();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to update user';
        }
      });
    } else {
      // Create user (would need password, but for now just show message)
      this.errorMessage = 'User creation should be done through registration. You can update existing users.';
    }
  }

  canDeleteUser(user: User): boolean {
    if (!user._id) return false;
    if (user.role !== 'ADMIN') return true;
    // Can delete admin only if there's more than one admin
    const adminCount = this.users.filter(u => u.role === 'ADMIN').length;
    return adminCount > 1;
  }

  deleteUser(userId: string) {
    if (!userId) return;
    if (!confirm('Are you sure you want to delete this user?')) return;

    this.adminService.deleteUser(userId).subscribe({
      next: (res: any) => {
        this.successMessage = 'User deleted successfully';
        this.loadUsers();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to delete user';
      }
    });
  }

  // Billing Rules Management
  loadBillingRules() {
    this.adminService.getBillingRules().subscribe({
      next: (res: any) => {
        this.billingRules = res.rules || [];
        this.systemStats.activeBillingRules = this.billingRules.filter(r => r.isActive).length;
      },
      error: (err) => {
        console.error('Error loading billing rules:', err);
        // Fallback to default rules
        this.billingRules = [
          {
            name: 'Storage Fee',
            type: 'storage',
            rate: 5.00,
            unit: 'per sqft/month',
            description: 'Monthly storage charge per square foot',
            isActive: true
          },
          {
            name: 'Inbound Handling',
            type: 'handling',
            rate: 25.00,
            unit: 'per item',
            description: 'Fee for receiving and storing inbound items',
            isActive: true
          },
          {
            name: 'Outbound Handling',
            type: 'handling',
            rate: 20.00,
            unit: 'per item',
            description: 'Fee for picking and shipping outbound items',
            isActive: true
          }
        ];
        this.systemStats.activeBillingRules = this.billingRules.filter(r => r.isActive).length;
      }
    });
  }

  openBillingForm(rule?: BillingRule) {
    if (rule) {
      this.editingBilling = rule;
      this.billingForm = { ...rule };
    } else {
      this.editingBilling = null;
      this.billingForm = {
        name: '',
        type: 'storage',
        rate: 0,
        unit: 'per sqft/month',
        description: '',
        isActive: true
      };
    }
    this.showBillingForm = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeBillingForm() {
    this.showBillingForm = false;
    this.editingBilling = null;
    this.billingForm = {
      name: '',
      type: 'storage',
      rate: 0,
      unit: 'per sqft/month',
      description: '',
      isActive: true
    };
  }

  saveBillingRule() {
    if (!this.billingForm.name || !this.billingForm.description || this.billingForm.rate <= 0) {
      this.errorMessage = 'Please fill all fields correctly';
      return;
    }

    if (this.editingBilling && this.editingBilling._id) {
      // Update rule
      this.adminService.updateBillingRule(this.editingBilling._id, this.billingForm).subscribe({
        next: (res: any) => {
          this.successMessage = 'Billing rule updated successfully';
          this.loadBillingRules();
          this.closeBillingForm();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to update billing rule';
        }
      });
    } else {
      // Create rule
      this.adminService.createBillingRule(this.billingForm).subscribe({
        next: (res: any) => {
          this.successMessage = 'Billing rule created successfully';
          this.loadBillingRules();
          this.closeBillingForm();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to create billing rule';
        }
      });
    }
  }

  deleteBillingRule(ruleId: string | undefined) {
    if (!ruleId) return;
    if (!confirm('Are you sure you want to delete this billing rule?')) return;

    this.adminService.deleteBillingRule(ruleId).subscribe({
      next: (res: any) => {
        this.successMessage = 'Billing rule deleted successfully';
        this.loadBillingRules();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to delete billing rule';
      }
    });
  }

  toggleBillingRule(rule: BillingRule) {
    if (!rule._id) return;
    rule.isActive = !rule.isActive;
    this.adminService.updateBillingRule(rule._id, rule).subscribe({
      next: () => {
        this.loadBillingRules();
      },
      error: (err) => {
        rule.isActive = !rule.isActive; // Revert on error
        this.errorMessage = 'Failed to update rule status';
      }
    });
  }

  // System Stats
  loadSystemStats() {
    // Stats are updated when users and billing rules are loaded
  }

  // Logout
  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
