# PizzaHub — Project Folder Structure & Organization (Part 5)

**Version:** 1.0  
**Document Type:** Project Architecture & Code Organization Guide  
**Pattern:** Clean Monorepo + Layered MVC

---

## 1. Monorepo Architecture Overview

`PizzaHub` is structured as a clean Monorepo containing separated presentation (`frontend/`) and service API (`backend/`) roots alongside documentation and test assets:

```
PizzaHub/
├── frontend/             # React (Vite) Single Page Application
├── backend/              # Node.js + Express REST & Socket Server
├── docs/                 # SRS & Architecture Specifications
├── postman/              # Postman API Collection export
├── README.md             # Core Overview
├── ARCHITECTURE.md       # High-Level & Low-Level Design (Part 3)
├── DATABASE.md           # Database Schemas & Data Modeling (Part 4)
└── ORGANIZATION.md       # Folder & Code Organization Guide (Part 5)
```

---

## 2. Directory Responsibilities

### 2.1 Backend Architecture (`/backend`)
```
backend/
├── src/
│   ├── config/         # Database connection & third-party app configs
│   ├── controllers/    # Request handlers & response formatting
│   ├── middleware/     # JWT authentication, role guards, error middleware
│   ├── models/         # Mongoose schema definitions (User, Order, etc.)
│   ├── routes/         # REST API endpoint definitions
│   ├── utils/          # Token generators, mailers, and helpers
│   ├── cron/           # Scheduled background tasks (Node-Cron)
│   ├── seeders/        # Initial database seed scripts
│   └── server.js       # App initialization & Socket.IO server startup
└── package.json
```

### 2.2 Frontend Architecture (`/frontend`)
```
frontend/
├── src/
│   ├── components/     # UI elements (common, cards, forms, pizza)
│   ├── context/        # React Context providers (Auth, Cart, Socket)
│   ├── pages/          # Full page views (Landing, Menu, Builder, Cart, Admin)
│   ├── services/       # Axios API HTTP service wrappers
│   ├── index.css       # Design tokens & Tailwind CSS rules
│   ├── App.jsx         # Client routing
│   └── main.jsx        # Entry point
└── package.json
```

---

## 3. Coding & Naming Conventions

- **Component Files:** `PascalCase.jsx` (e.g., `PizzaBuilder.jsx`, `StatusBadge.jsx`)
- **Controller/Route/Service Files:** `camelCase.js` (e.g., `orderController.js`, `authRoutes.js`)
- **Variables & Functions:** `camelCase`
- **Constants & Env Variables:** `UPPER_SNAKE_CASE` (e.g., `RAZORPAY_KEY_SECRET`)

---

## 4. Git Workflow & Commit Convention

Follow **Conventional Commits**:
- `feat(builder): add multi-step topping selector`
- `fix(checkout): escape quote inside summary string`
- `docs(arch): document database relationship ER diagram`
- `refactor(admin): update order table status badge styling`

---

## 5. API Response Standardization

All backend HTTP responses follow a predictable JSON contract:

**Success Response:**
```json
{
  "success": true,
  "message": "Resource processed successfully",
  "data": {}
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Validation or authentication error message",
  "errors": []
}
```
