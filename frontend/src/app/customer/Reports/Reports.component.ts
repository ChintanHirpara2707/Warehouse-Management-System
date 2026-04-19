import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../services/customer.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart } from 'chart.js';

// Setup default globals for Chart.js so it can register elements correctly
import {
  BarController, BarElement, DoughnutController, ArcElement, LineController, LineElement,
  PointElement, CategoryScale, LinearScale, Tooltip, Legend
} from 'chart.js';

Chart.register(
  BarController, BarElement, DoughnutController, ArcElement, LineController, LineElement,
  PointElement, CategoryScale, LinearScale, Tooltip, Legend
);

@Component({
  selector: 'app-Reports',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './Reports.component.html',
  styleUrls: ['./Reports.component.css']
})
export class ReportsComponent implements OnInit {

  loading = true;
  errorMessage = '';

  // 1. Inventory Doughnut Chart
  inventoryChartType: ChartType = 'doughnut';
  inventoryChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'], hoverOffset: 4 }]
  };
  inventoryChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } }
  };
  totalInventoryItems = 0;

  // 2. Activity Bar Chart (Inbound vs Outbound)
  activityChartType: ChartType = 'bar';
  activityChartData: ChartData<'bar'> = {
    labels: ['Inbound', 'Outbound'],
    datasets: [
      { data: [0, 0], label: 'Requests Count', backgroundColor: ['#3b82f6', '#f59e0b'], borderRadius: 6 }
    ]
  };
  activityChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
  };
  totalActivityOptions = 0;

  // 3. Billing Line/Bar Chart (Paid vs Pending)
  billingChartType: ChartType = 'doughnut';
  billingChartData: ChartData<'doughnut'> = {
    labels: ['Paid', 'Pending', 'Overdue'],
    datasets: [{ data: [0, 0, 0], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], hoverOffset: 4 }]
  };
  billingChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };
  totalBilledAmount = 0;

  constructor(private customerService: CustomerService) { }

  ngOnInit() {
    this.fetchAllDataForCharts();
  }

  fetchAllDataForCharts() {
    this.loading = true;
    this.errorMessage = '';

    // Reset counters
    this.totalInventoryItems = 0;
    this.totalActivityOptions = 0;
    this.totalBilledAmount = 0;

    // Fetch Inventory
    this.customerService.getMyInventory().subscribe({
      next: (res: any) => {
        const items = res.inventory || [];
        this.totalInventoryItems = items.length;

        // Group by Item Name to get aggregate quantities
        const grouped = items.reduce((acc: any, curr: any) => {
          acc[curr.item] = (acc[curr.item] || 0) + (curr.qty || 1);
          return acc;
        }, {});

        this.inventoryChartData.labels = Object.keys(grouped);
        this.inventoryChartData.datasets[0].data = Object.values(grouped);

        // Force chart update
        this.inventoryChartData = { ...this.inventoryChartData };
      },
      error: (err) => console.error('Error fetching inventory for chart', err)
    });

    // Fetch Activity (Service Requests)
    this.customerService.getMyServiceRequests().subscribe({
      next: (res: any) => {
        const requests = res.requests || [];
        this.totalActivityOptions = requests.length;

        let inboundCount = 0;
        let outboundCount = 0;
        requests.forEach((r: any) => {
          if (r.type === 'Inbound') inboundCount++;
          if (r.type === 'Outbound') outboundCount++;
        });

        this.activityChartData.datasets[0].data = [inboundCount, outboundCount];
        this.activityChartData = { ...this.activityChartData };
      },
      error: (err) => console.error('Error fetching requests for chart', err)
    });

    // Fetch Billing
    this.customerService.getMyInvoices().subscribe({
      next: (res: any) => {
        const invoices = res.invoices || [];

        let paidAmount = 0;
        let pendingAmount = 0;
        let overdueAmount = 0;

        invoices.forEach((inv: any) => {
          this.totalBilledAmount += (inv.amount || 0);
          if (inv.status === 'Paid') paidAmount += (inv.amount || 0);
          else if (inv.status === 'Overdue') overdueAmount += (inv.amount || 0);
          else pendingAmount += (inv.amount || 0);
        });

        this.billingChartData.datasets[0].data = [paidAmount, pendingAmount, overdueAmount];
        this.billingChartData = { ...this.billingChartData };

        // Hide loading once the last async request completes (simplified)
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching invoices for chart', err);
        this.loading = false;
      }
    });
  }
}
