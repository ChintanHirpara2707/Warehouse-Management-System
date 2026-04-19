import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';

interface ServiceRequest {
  _id?: string;
  id?: string;
  type: 'Inbound' | 'Outbound';
  item: string;
  qty: number;
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Scheduled' | 'In Transit' | 'Completed';
}

@Component({
  selector: 'app-service-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ServiceRequests.component.html',
  styleUrls: ['./ServiceRequests.component.css']
})
export class ServiceRequestsComponent implements OnInit {

  // ---------- FORM STATE ----------
  showForm = false;
  isEditMode = false;
  editingRequest: ServiceRequest | null = null;

  requestType: 'Inbound' | 'Outbound' = 'Inbound';
  itemName = '';
  quantity: number | null = null;
  startDate = '';
  endDate = '';

  // ---------- DATA ----------
  requests: ServiceRequest[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private customerService: CustomerService) {}

  ngOnInit() {
    this.loadServiceRequests();
  }

  // ---------- OPEN NEW ----------
  newRequest(): void {
    this.resetForm();
    this.showForm = true;
  }

  // ---------- LOAD DATA ----------
  loadServiceRequests() {
    this.loading = true;
    this.errorMessage = '';
    this.customerService.getMyServiceRequests().subscribe({
      next: (res: any) => {
        this.requests = (res.requests || []).map((req: any) => ({
          ...req,
          id: req._id || req.id,
          startDate: req.startDate ? new Date(req.startDate).toISOString().split('T')[0] : '',
          endDate: req.endDate ? new Date(req.endDate).toISOString().split('T')[0] : ''
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading service requests:', err);
        this.errorMessage = 'Failed to load service requests';
        this.requests = [];
        this.loading = false;
      }
    });
  }

  // ---------- EDIT ----------
  editRequest(index: number): void {
    const req = this.requests[index];

    this.requestType = req.type;
    this.itemName = req.item;
    this.quantity = req.qty;
    this.startDate = req.startDate;
    this.endDate = req.endDate;

    this.isEditMode = true;
    this.editingRequest = req;
    this.showForm = true;
  }

  // ---------- SUBMIT ----------
  submitRequest(): void {
    if (
      !this.itemName.trim() ||
      !this.quantity ||
      this.quantity <= 0 ||
      !this.startDate ||
      !this.endDate
    ) {
      this.errorMessage = 'Please fill all fields correctly';
      return;
    }

    if (new Date(this.endDate) < new Date(this.startDate)) {
      this.errorMessage = 'End date cannot be before start date';
      return;
    }

    const customerId = localStorage.getItem('userId');
    if (!customerId) {
      this.errorMessage = 'User not logged in';
      return;
    }

    const requestData = {
      customerId,
      type: this.requestType,
      item: this.itemName.trim(),
      qty: this.quantity,
      startDate: this.startDate,
      endDate: this.endDate
    };

    if (this.isEditMode && this.editingRequest?._id) {
      // UPDATE
      this.customerService.updateServiceRequest(this.editingRequest._id, requestData).subscribe({
        next: (res: any) => {
          this.successMessage = 'Service request updated successfully';
          this.loadServiceRequests();
          this.resetForm();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to update request';
        }
      });
    } else {
      // CREATE
      this.customerService.createServiceRequest(requestData).subscribe({
        next: (res: any) => {
          this.successMessage = 'Service request created successfully';
          this.loadServiceRequests();
          this.resetForm();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to create request';
        }
      });
    }
  }

  // ---------- DELETE ----------
  deleteRequest(requestId: string | undefined) {
    if (!requestId) return;
    if (!confirm('Are you sure you want to delete this service request?')) return;

    this.customerService.deleteServiceRequest(requestId).subscribe({
      next: (res: any) => {
        this.successMessage = 'Service request deleted successfully';
        this.loadServiceRequests();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to delete request';
      }
    });
  }

  // ---------- RESET ----------
  resetForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.editingRequest = null;
    this.errorMessage = '';

    this.requestType = 'Inbound';
    this.itemName = '';
    this.quantity = null;
    this.startDate = '';
    this.endDate = '';
  }
}
