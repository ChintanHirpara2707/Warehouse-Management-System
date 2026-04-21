
# AnantaWare  


### Warehouse Service & Inventory Management System (MEAN Stack)

---

## 📌 Overview

**AnantaWare** is a service-based warehouse management system where customers store their own inventory and are charged for warehouse services such as storage and handling.

> ❗ This is NOT an e-commerce system — no buying/selling of products.

The system provides centralized management of inventory, services, and users with role-based access.

---

## 🧠 Core Concept

- Customers own the inventory  
- Warehouse provides services  
- Billing is based on:  
  - Storage duration  
  - Handling operations  
  - Service usage  

---

## 👥 User Roles

| Role | Access |
|------|-------|
| Admin | Full system control, user management |
| Warehouse Manager | Inventory & operations handling |
| Customer | View inventory, services, profile |

---

## ⚙️ Tech Stack

- Frontend: Angular 19 (Standalone Components)  
- Backend: Node.js + Express.js  
- Database: MongoDB (Atlas)  
- Authentication: JWT  
- Version Control: Git  

---

## 📁 Project Structure

```
AnantaWare/
│
├── Frontend/        # Angular App
│   ├── src/app/
│   │   ├── login/
│   │   ├── register/
│   │   ├── customer/
│   │   └── services/
│
├── Backend/         # Node + Express API
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   └── server.js
```

---

## 🔐 Features

- User Registration & Login  
- Role-Based Access Control  
- Customer Dashboard  
- Profile Management  
- Inventory Tracking (basic)  
- Service-Based Billing (concept)  
- Secure API integration  

---

## 🔄 System Flow

```
Register → Login → Role-based Dashboard → Services → Billing
```

---

## 🚫 Out of Scope

- E-commerce (no product selling)  
- Shopping cart / checkout  
- Product pricing system  
- Marketplace features  

---

## 🛠️ Setup Instructions

### 1️⃣ Clone Repository
```bash
git clone https://github.com/your-username/anantaware.git
cd anantaware
```

---

### 2️⃣ Backend Setup
```bash
cd Backend
npm install
npm start
```

Create `.env` file:
```
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
```

---

### 3️⃣ Frontend Setup
```bash
cd Frontend
npm install
ng serve
```

Open:
http://localhost:4200

---

## 📈 Future Enhancements

- Payment Gateway Integration  
- Real-time Inventory Tracking  
- Advanced Analytics Dashboard  
- Invoice Generation  
- Mobile App  

---

## 🎯 Project Goal

To build a scalable, real-world warehouse service system using MEAN stack with proper architecture and role-based design.

---

## 📌 Author

Chintan Hirpara  

---

## ⭐ Final Note

This project focuses on service-based warehouse management, not product selling.
