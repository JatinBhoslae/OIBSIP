# PizzaHub - Pizza Ordering & Inventory Management Platform

PizzaHub is a production-grade online pizza ordering and real-time inventory management system. Customers can customize pizzas, apply coupons, simulate payments, and track orders in real-time. Admins can manage stock, track active order flows, configure coupons, and view analytics.

---

## 📐 Architecture & Project Blueprints

- [ARCHITECTURE.md](file:///Users/jatinvijaybhosale/Documents/Projects/Pizza%20Deilvery/ARCHITECTURE.md) — System Architecture (HLD & LLD)
- [DATABASE.md](file:///Users/jatinvijaybhosale/Documents/Projects/Pizza%20Deilvery/DATABASE.md) — Database Design & Data Modeling (Part 4)
- [ORGANIZATION.md](file:///Users/jatinvijaybhosale/Documents/Projects/Pizza%20Deilvery/ORGANIZATION.md) — Folder Structure & Code Organization (Part 5)
- [SETUP.md](file:///Users/jatinvijaybhosale/Documents/Projects/Pizza%20Deilvery/SETUP.md) — Development Setup & Environment Setup (Part 6)
- [AUTH_SPEC.md](file:///Users/jatinvijaybhosale/Documents/Projects/Pizza%20Deilvery/AUTH_SPEC.md) — Authentication Foundation Specification (Part 7)

---

## 🍕 Key Features

1. **Authentication**: Secure registration, email verification (simulated locally), JWT login, and profile updates.
2. **Interactive Pizza Builder**: Choose custom size, crust, sauce, cheese, vegetables, and meats.
3. **Cart & Coupons**: Automated GST (5%) & delivery fee calculations, and active coupon verification (e.g. `PIZZA50`, `FIRST30`).
4. **Mock Payment Integration**: Direct Razorpay mock verification for local sandbox testing, alongside production-ready handlers.
5. **Live Order Tracking**: Dynamic progress timeline driven by WebSocket connections (`Socket.IO`).
6. **Admin Dashboard**: Real-time order lifecycle changes, ingredient stock quantities, and low stock alarms.
7. **Inventory Automation**: Reduces ingredient stock on orders; schedules node-cron tasks to dispatch daily low stock alerts.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Tailwind CSS v4, Lucide React, Axios, Socket.IO Client
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.IO, Nodemailer, Node Cron, Razorpay

---

## 🚀 Quick Start Guide

### 1. Prerequisite: Local MongoDB
Make sure you have a local MongoDB instance running (usually at `mongodb://127.0.0.1:27017`).

### 2. Seeding & Running Backend
Navigate to the `backend` folder, copy variables, and install/seed:
```bash
cd backend
npm install
npm run seed  # Seeds initial pizzas, ingredients, coupons and accounts
npm run dev   # Starts backend on http://localhost:5000
```

### 3. Running Frontend
Navigate to the `frontend` folder, install, and run:
```bash
cd frontend
npm install
npm run dev   # Starts Vite server on http://localhost:5173
```

---

## 🔑 Default Accounts (Seeded)

- **Admin Account**:
  - Email: `admin@pizzahub.com`
  - Password: `adminpassword`
- **Customer Account**:
  - Email: `customer@pizzahub.com`
  - Password: `customerpassword`
