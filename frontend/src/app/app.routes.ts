import { Routes } from '@angular/router';
import { WelcomeComponent } from './welcome/welcome.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { CustomerDashboardComponent } from './customer/customer-dashboard/customer-dashboard.component';
import { CustomerProfileComponent } from './customer/profile/profile.component';
import { InventoryComponent } from './customer/Inventory/Inventory.component';
import { ServiceRequestsComponent } from './customer/ServiceRequests/ServiceRequests.component';
import { BillingComponent } from './customer/Billing/Billing.component';
import { PaymentComponent } from './customer/Payment/Payment.component';
import { ReportsComponent } from './customer/Reports/Reports.component';
import { InvoiceViewComponent } from './customer/InvoiceView/InvoiceView.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { ManagerDashboardComponent } from './manager-dashboard/manager-dashboard.component';
import { Adm_man_profileComponent } from './adm_man_profile/adm_man_profile.component';

export const routes: Routes = [
  { path: '', component: WelcomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  {
    path: 'customer',
    component: CustomerDashboardComponent,
    children: [
      { path: 'profile', component: CustomerProfileComponent },
      { path: 'inventory', component: InventoryComponent },
      { path: 'service-requests', component: ServiceRequestsComponent },
      { path: 'billing', component: BillingComponent },
      { path: 'payment/:invoiceId', component: PaymentComponent },
      { path: 'invoice/:invoiceId', component: InvoiceViewComponent },
      { path: 'reports', component: ReportsComponent }
    ]
  },

  {
    path: 'admin',
    component: AdminDashboardComponent
  },

  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent
  },

  {
    path: 'manager',
    component: ManagerDashboardComponent
  },

  {
    path: 'adm_man_profile',
    component: Adm_man_profileComponent
  },

  {
    path: 'manager/dashboard',
    component: ManagerDashboardComponent
  }
];
