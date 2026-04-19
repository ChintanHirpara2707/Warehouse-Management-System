import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { CustomerService } from '../../services/customer.service';
import { AfterViewInit } from '@angular/core';
import { gsap } from "gsap";

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.css']
})

export class CustomerDashboardComponent implements OnInit, OnInit, AfterViewInit {

  ngAfterViewInit() {
  this.animateCounters();
}

animateCounters() {
  const counters = document.querySelectorAll(".counter");

  counters.forEach((counter: any) => {
    const value = +counter.getAttribute("data-value");
    gsap.to(counter, {
      innerText: value,
      duration: 1.5,
      snap: { innerText: 1 },
      ease: "power2.out"
    });
  });
}


  customerName = '';
  customerNameShort = '';
  isDefaultView = true;
  loading = false;

  // Dashboard Statistics
  stats = {
    totalInventory: 0,
    totalQuantity: 0,
    storageUsed: 0,
    inboundThisWeek: 0,
    rejectedRequests: 0,
    scheduledOutbound: 0,
    pendingRequests: 0,
    locationCount: 0
  };

  constructor(private router: Router, private customerService: CustomerService) {
    console.log('CustomerDashboardComponent initialized');
  }

  ngOnInit() {
    console.log('CustomerDashboardComponent ngOnInit');

    // On the server (SSR), localStorage is not available. Skip initialization there.
    if (typeof window === 'undefined') {
      return;
    }

    // Load customer info from localStorage
    const storedName = localStorage.getItem('name');
    const storedEmail = localStorage.getItem('email');

    if (storedName) {
      this.customerName = storedName;
      this.customerNameShort = storedName.split(' ')[0];
    } else if (storedEmail) {
      const emailUsername = storedEmail.split('@')[0];
      this.customerName = emailUsername;
      this.customerNameShort = emailUsername;
    } else {
      this.customerName = 'Customer';
      this.customerNameShort = 'User';
    }

    console.log('Customer name:', this.customerName);

    // Detect when child routes are active
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const isDefault = event.urlAfterRedirects === '/customer' || event.urlAfterRedirects === '/customer/';
        this.isDefaultView = isDefault;
        console.log('Route changed to:', event.urlAfterRedirects, 'isDefaultView:', this.isDefaultView);
         // Reload stats when returning to dashboard
        if (isDefault) {
          this.loadDashboardStats();
        }
      });

    // Check current route on init
    const currentUrl = this.router.url;
    this.isDefaultView = currentUrl === '/customer' || currentUrl === '/customer/';
    console.log('Initial URL:', currentUrl, 'isDefaultView:', this.isDefaultView);

    // Load dashboard statistics
    if (this.isDefaultView) {
      this.loadDashboardStats();
    }
  }

  loadDashboardStats() {
    this.loading = true;
    const userId = localStorage.getItem('userId');
    console.log('Loading dashboard stats for userId:', userId);

    if (!userId) {
      console.error('No userId found in localStorage');
      this.loading = false;
      return;
    }

    this.customerService.getDashboardStats().subscribe({
      next: (res: any) => {
        console.log('Dashboard stats response:', res);
        this.stats = {
          totalInventory: res.totalInventory || 0,
          totalQuantity: res.totalQuantity || 0,
          storageUsed: res.storageUsed || 0,
          inboundThisWeek: res.inboundThisWeek || 0,
          rejectedRequests: res.rejectedRequests || 0,
          scheduledOutbound: res.scheduledOutbound || 0,
          pendingRequests: res.pendingRequests || 0,
          locationCount: res.locationCount || 0
        };
        console.log('Updated stats:', this.stats);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard stats:', err);
        console.error('Error details:', err.error);
        // Keep default values on error
        this.loading = false;
      }
    });
  }

  navigateTo(section: string) {
    console.log('Navigate to:', section);
    // Go back to default dashboard view
    this.router.navigate(['/customer']).then(() => {
      this.loadDashboardStats();
    });
  }

  goToInventory() {
    this.router.navigate(['/customer/inventory']);
  }

  goToServiceRequests() {
    this.router.navigate(['/customer/service-requests']);
  }

  goToBilling() {
    this.router.navigate(['/customer/billing']);
  }

  goToReports() {
    this.router.navigate(['/customer/reports']);
  }

  goToProfile() {
    this.router.navigate(['/customer/profile']);
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
