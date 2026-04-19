import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';

interface InventoryItem {
  _id?: string;
  item: string;
  sku: string;
  qty: number;
  location: string;
  status: string;
  requestType?: 'Inbound' | 'Outbound';
  inboundDate?: string;
  outboundDate?: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './Inventory.component.html',
  styleUrls: ['./Inventory.component.css']
})
export class InventoryComponent implements OnInit {

  inventory: InventoryItem[] = [];
  filteredInventory: InventoryItem[] = [];
  loading = false;
  errorMessage = '';

  searchText = '';
  selectedRack = 'All Racks';
  availableLocations: string[] = [];

  constructor(private customerService: CustomerService) {}

  ngOnInit() {
    this.loadInventory();
  }

  loadInventory() {
    this.loading = true;
    this.errorMessage = '';
    
    const customerId = localStorage.getItem('userId');
    console.log('=== Loading Inventory ===');
    console.log('Customer ID from localStorage:', customerId);
    console.log('All localStorage items:', {
      userId: localStorage.getItem('userId'),
      token: localStorage.getItem('token') ? 'exists' : 'missing',
      role: localStorage.getItem('role'),
      name: localStorage.getItem('name')
    });
    
    if (!customerId) {
      console.error('Customer ID not found in localStorage');
      this.errorMessage = 'Please login again to view your inventory.';
      this.loading = false;
      return;
    }

    console.log('Calling customerService.getMyInventory()...');
    this.customerService.getMyInventory().subscribe({
      next: (res: any) => {
        console.log('=== Inventory API Response ===');
        console.log('Full response:', res);
        console.log('Response type:', typeof res);
        console.log('Inventory array:', res.inventory);
        console.log('Inventory length:', res.inventory?.length || 0);
        
        this.inventory = res.inventory || [];
        console.log('Loaded inventory items:', this.inventory.length);
        
        if (this.inventory.length > 0) {
          console.log('First inventory item:', this.inventory[0]);
        }
        
        // Update location filter options dynamically
        this.updateLocationOptions();
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('=== Error loading inventory ===');
        console.error('Error object:', err);
        console.error('Error message:', err.message);
        console.error('Error status:', err.status);
        console.error('Error error:', err.error);
        
        this.errorMessage = err.error?.message || 'Failed to load inventory. Items will appear here after manager accepts your inbound requests.';
        // Fallback to empty array if API fails
        this.inventory = [];
        this.filteredInventory = [];
        this.loading = false;
      }
    });
  }

  updateLocationOptions() {
    // Extract unique locations from inventory
    this.availableLocations = [...new Set(this.inventory.map(item => item.location).filter(loc => loc))];
    console.log('Available locations:', this.availableLocations);
  }

  applyFilters(): void {
    const search = this.searchText.toLowerCase().trim();

    this.filteredInventory = this.inventory.filter(row => {
      const matchSearch =
        row.item.toLowerCase().includes(search) ||
        row.sku.includes(search);

      const matchRack =
        this.selectedRack === 'All Racks' ||
        row.location === this.selectedRack;

      return matchSearch && matchRack;
    });
  }
}
