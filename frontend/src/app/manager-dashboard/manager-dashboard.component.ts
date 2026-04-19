import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ManagerService } from '../services/manager.service';

interface InventoryItem {
  _id?: string;
  item: string;
  sku: string;
  qty: number;
  location: string;
  status: string;
  customerName?: string;
  customerId?: string;
}

interface ServiceRequest {
  _id?: string;
  id?: string;
  type: 'Inbound' | 'Outbound';
  item: string;
  qty: number;
  startDate: string;
  endDate: string;
  status: string;
  notes?: string;
  customerName?: string;
  customerId?: string;
}

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.css']
})
export class ManagerDashboardComponent implements OnInit {
  managerName = '';
  activeSection: 'dashboard' | 'inventory' | 'inbound' | 'outbound' | 'requests' = 'dashboard';

  // Inventory
  inventory: InventoryItem[] = [];
  showInventoryForm = false;
  editingInventory: InventoryItem | null = null;
  inventoryForm: InventoryItem = {
    item: '',
    sku: '',
    qty: 0,
    location: '',
    status: 'Active'
  };

  // Service Requests
  allRequests: ServiceRequest[] = [];
  inboundRequests: ServiceRequest[] = [];
  outboundRequests: ServiceRequest[] = [];
  selectedRequestDetails: ServiceRequest | null = null;

  // System Stats
  systemStats = {
    totalInventory: 0,
    pendingRequests: 0,
    inboundToday: 0,
    outboundToday: 0
  };

  errorMessage = '';
  successMessage = '';

  constructor(private router: Router, private managerService: ManagerService) {}

  ngOnInit() {
    const storedName = localStorage.getItem('name');
    const storedEmail = localStorage.getItem('email');
    const role = localStorage.getItem('role');

    if (role !== 'MANAGER') {
      this.router.navigate(['/login']);
      return;
    }

    this.managerName = storedName || storedEmail?.split('@')[0] || 'Manager';
    this.loadInventory();
    this.loadServiceRequests();
    this.updateStats();
  }

  setActiveSection(section: 'dashboard' | 'inventory' | 'inbound' | 'outbound' | 'requests') {
    this.activeSection = section;
  }

  // Inventory Management
  loadInventory() {
    this.managerService.getInventory().subscribe({
      next: (res: any) => {
        this.inventory = (res.inventory || []).map((item: any) => ({
          ...item,
          customerName: item.customerId?.name || 'Unknown'
        }));
        this.updateStats();
      },
      error: (err) => {
        console.error('Error loading inventory:', err);
        this.errorMessage = 'Failed to load inventory';
        this.inventory = [];
        this.updateStats();
      }
    });
  }

  openInventoryForm(item?: InventoryItem) {
    if (item) {
      this.editingInventory = item;
      this.inventoryForm = { ...item };
    } else {
      this.editingInventory = null;
      this.inventoryForm = {
        item: '',
        sku: '',
        qty: 0,
        location: '',
        status: 'Active'
      };
    }
    this.showInventoryForm = true;
  }

  deleteInventory(itemId: string) {
    if (!confirm('Are you sure you want to delete this inventory item?')) return;

    this.managerService.deleteInventoryItem(itemId).subscribe({
      next: (res: any) => {
        this.successMessage = 'Inventory item deleted successfully';
        this.loadInventory();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to delete inventory item';
      }
    });
  }

  // Service Requests
  loadServiceRequests() {
    this.managerService.getServiceRequests().subscribe({
      next: (res: any) => {
        this.allRequests = (res.requests || []).map((req: any) => ({
          ...req,
          id: req._id || req.id,
          customerName: req.customerId?.name || 'Unknown',
          startDate: req.startDate ? new Date(req.startDate).toISOString() : new Date().toISOString(),
          endDate: req.endDate ? new Date(req.endDate).toISOString() : new Date().toISOString()
        }));
        this.inboundRequests = this.allRequests.filter(r => r.type === 'Inbound');
        this.outboundRequests = this.allRequests.filter(r => r.type === 'Outbound');
        this.updateStats();
      },
      error: (err) => {
        console.error('Error loading service requests:', err);
        this.errorMessage = 'Failed to load service requests';
        this.allRequests = [];
        this.inboundRequests = [];
        this.outboundRequests = [];
        this.updateStats();
      }
    });
  }

  // Accept Inbound Request
  acceptRequest(request: ServiceRequest) {
    if (request.type !== 'Inbound') return;

    const location = prompt('Enter storage location (e.g., Rack A, Rack B, Rack C):', 'Rack A');
    if (!location || !location.trim()) {
      this.errorMessage = 'Location is required';
      return;
    }

    if (confirm(`Accept this inbound request and add ${request.qty} ${request.item} to inventory at ${location}?`)) {
      if (!request._id) {
        this.errorMessage = 'Invalid request ID';
        return;
      }
      this.managerService.updateServiceRequestStatus(request._id, 'Scheduled', location || undefined).subscribe({
        next: (res: any) => {
          this.successMessage = 'Inbound request accepted and added to inventory successfully';
          this.loadServiceRequests();
          this.loadInventory();
          this.updateStats();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to accept request';
        }
      });
    }
  }

  // Accept Outbound Request
  acceptOutbound(request: ServiceRequest) {
    if (request.type !== 'Outbound') return;

    if (confirm(`Accept this outbound request for ${request.qty} ${request.item}?`)) {
      if (!request._id) {
        this.errorMessage = 'Invalid request ID';
        return;
      }
      this.managerService.updateServiceRequestStatus(request._id, 'Scheduled').subscribe({
        next: (res: any) => {
          this.successMessage = 'Outbound request accepted successfully';
          this.loadServiceRequests();
          this.updateStats();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to accept request';
        }
      });
    }
  }

  // Mark as In Transit
  markInTransit(request: ServiceRequest) {
    if (confirm(`Mark this request as "In Transit"?`)) {
      if (!request._id) {
        this.errorMessage = 'Invalid request ID';
        return;
      }
      this.managerService.updateServiceRequestStatus(request._id, 'In Transit').subscribe({
        next: (res: any) => {
          this.successMessage = 'Request marked as In Transit';
          this.loadServiceRequests();
          this.updateStats();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to update status';
        }
      });
    }
  }

  // Complete Request
  completeRequest(request: ServiceRequest) {
    if (confirm(`Mark this request as "Completed"?`)) {
      if (!request._id) {
        this.errorMessage = 'Invalid request ID';
        return;
      }
      this.managerService.updateServiceRequestStatus(request._id, 'Completed').subscribe({
        next: (res: any) => {
          this.successMessage = 'Request completed successfully';
          this.loadServiceRequests();
          this.loadInventory();
          this.updateStats();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to complete request';
        }
      });
    }
  }

  // Cancel Request
  cancelRequest(request: ServiceRequest) {
    const reason = prompt('Enter cancellation reason (optional):', '');
    if (confirm(`Cancel this request?`)) {
      if (!request._id) {
        this.errorMessage = 'Invalid request ID';
        return;
      }
      this.managerService.updateServiceRequestStatus(request._id, 'Cancelled', undefined, reason || undefined).subscribe({
        next: (res: any) => {
          this.successMessage = 'Request cancelled successfully';
          this.loadServiceRequests();
          this.loadInventory();
          this.updateStats();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to cancel request';
        }
      });
    }
  }

  // Reject Request
  rejectRequest(request: ServiceRequest) {
    const reason = prompt('Enter rejection reason (optional):', '');
    if (confirm(`Reject this request?`)) {
      if (!request._id) {
        this.errorMessage = 'Invalid request ID';
        return;
      }
      this.managerService.updateServiceRequestStatus(request._id, 'Rejected', undefined, reason || undefined).subscribe({
        next: (res: any) => {
          this.successMessage = 'Request rejected';
          this.loadServiceRequests();
          this.updateStats();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to reject request';
        }
      });
    }
  }

  viewRequestDetails(request: ServiceRequest) {
    this.selectedRequestDetails = request;
  }

  closeRequestDetails() {
    this.selectedRequestDetails = null;
  }

  // Stats
  updateStats() {
    // Update from API
    this.managerService.getStats().subscribe({
      next: (res: any) => {
        this.systemStats = {
          totalInventory: res.totalInventory || 0,
          pendingRequests: res.pendingRequests || 0,
          inboundToday: res.inboundToday || 0,
          outboundToday: res.outboundToday || 0
        };
      },
      error: (err) => {
        // Fallback to local calculation
        this.systemStats.totalInventory = this.inventory.length;
        this.systemStats.pendingRequests = this.allRequests.filter(r => r.status === 'Pending').length;
        this.systemStats.inboundToday = this.inboundRequests.filter(r => {
          const today = new Date().toDateString();
          return new Date(r.startDate).toDateString() === today;
        }).length;
        this.systemStats.outboundToday = this.outboundRequests.filter(r => {
          const today = new Date().toDateString();
          return new Date(r.startDate).toDateString() === today;
        }).length;
      }
    });
  }

  goToProfile() {
    this.router.navigate(['/adm_man_profile']);
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
