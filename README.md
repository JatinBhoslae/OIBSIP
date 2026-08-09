# PizzaHub — Enterprise Pizza Ordering & Operations System

PizzaHub is a production-grade, highly scalable online pizza ordering, logistics, and real-time inventory management system. Built on the MERN stack with modern PWA capabilities, real-time WebSockets, and DevOps integration, it serves as an end-to-end platform for customers, delivery partners, and restaurant operations management.

---

## 📐 Architecture & Documentation

- [ARCHITECTURE.md](file:///Users/jatinvijaybhosale/Documents/Projects/Pizza%20Deilvery/ARCHITECTURE.md) — System Architecture (HLD & LLD)
- [DATABASE.md](file:///Users/jatinvijaybhosale/Documents/Projects/Pizza%20Deilvery/DATABASE.md) — Database Design & Index Specifications
- [ORGANIZATION.md](file:///Users/jatinvijaybhosale/Documents/Projects/Pizza%20Deilvery/ORGANIZATION.md) — Folder Structure & Coding Conventions
- [SETUP.md](file:///Users/jatinvijaybhosale/Documents/Projects/Pizza%20Deilvery/SETUP.md) — Development Setup Details
- [DEPLOYMENT.md](file:///Users/jatinvijaybhosale/Documents/Projects/Pizza%20Deilvery/docs/DEPLOYMENT.md) — Production Deployment Guide

---

## 🍕 Core Features

1. **Authentication & Authorization**: JWT-based session security, email verification (OTP), and role-based access control (RBAC) separating Customers, Admin operators, and Delivery Partners.
2. **Interactive Pizza Builder**: Fully customizable bases, crusts, sauces, cheeses, meats, and vegetables.
3. **Cart & Resilient Coupons**: Dynamic price computations, automated GST (5%) & delivery fee steps, and validated coupon logic.
4. **Live Order Tracking**: Dynamic progress timeline powered by persistent `Socket.IO` channels.
5. **Logistics & Live GPS**: Mobile-first portal for delivery partners with status transitions, OTP verification upon completion, and simulated real-time GPS telemetry broadcasts.
6. **Fleet & CRM Management**: Admin interface for rider onboarding, real-time telemetry logs, manual dispatch overrides, customer feedback reviews, and retention marketing campaigns.
7. **Business Analytics & Forecasting**: Real-time sales metrics, charts (Recharts), and linear regression forecasting for inventory demand.
8. **Automated Inventory Controls**: Real-time stock depletion, low-stock alarms, and hourly background monitoring cron jobs.
9. **PWA Capabilities**: Installable standalone mode, offline cart persistence, catalog caching via service worker, and online/offline status notifications.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Recharts, Framer Motion, Lucide React, Axios, Socket.IO Client, `vite-plugin-pwa`
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.IO, Nodemailer, Node Cron, Razorpay, Cloudinary
- **DevOps**: Docker, Docker Compose, Nginx, GitHub Actions CI

---

## 🚀 DevOps & Production Orchestration

### Multi-Environment Configurations
Copy configurations from `.env.example` in both folders:
- **Backend**: Configure `PORT`, `NODE_ENV`, `CLIENT_URL`, `MONGO_URI`, `JWT_SECRET`, Razorpay keys, SMTP credentials, Cloudinary, and Google Maps API.
- **Frontend**: Set `VITE_API_BASE_URL`, `VITE_SOCKET_URL`, and `VITE_RAZORPAY_KEY`.

### Docker Orchestration
Build and run the entire suite containerized:
- **Production (Atlas MongoDB)**:
  ```bash
  docker compose up --build -d
  ```
- **Local Development (Local MongoDB Container)**:
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
  ```

### CI/CD Workflow
Automatic checks trigger on every push and pull request to `main`:
1. **Frontend**: Dependency installation, linter run, and production production build verification.
2. **Backend**: Dependency check, dry-run syntax checks, and dependency audit.
3. **Docker**: Compiles both `backend` and `frontend` images to guarantee build readiness.

---

## 💾 Backup & Rollback

### MongoDB Backup Strategy
- Use `mongodump` periodically or configure MongoDB Atlas Scheduled Backups.
- For restoring: `mongorestore --uri="<MONGO_URI>" --drop backup_dir/`

### Deployment Rollback
1. Identify the stable tag (e.g., git commit hash).
2. Direct container host or pipeline orchestrator to run the previous version image.
3. Keep database migrations backward-compatible to avoid schema discrepancies.
