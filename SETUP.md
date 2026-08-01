# PizzaHub — Project Setup & Development Environment (Part 6)

**Version:** 1.0  
**Document Type:** Setup & Environment Specification Guide  
**Stack:** Node.js LTS, Vite + React, Tailwind CSS v4, MongoDB, Express

---

## 1. Prerequisites & Environment Setup

### Required Software
- **Node.js**: v22.x LTS or higher (`node -v`)
- **npm**: v10.x or higher (`npm -v`)
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/pizzahub`) or MongoDB Atlas URI
- **Git**: v2.x or higher (`git --version`)

### Recommended VS Code Extensions
- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)
- DotENV (`mikestead.dotenv`)
- Thunder Client / Postman

---

## 2. Environment Variables Specification

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_RAZORPAY_KEY=rzp_test_mock_key
```

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/pizzahub
JWT_SECRET=super_secret_pizzahub_jwt_key_2026
JWT_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=orders@pizzahub.com
SMTP_PASSWORD=app_specific_password
RAZORPAY_KEY_ID=rzp_test_mock_key
RAZORPAY_KEY_SECRET=mock_secret_key
CLOUDINARY_CLOUD_NAME=pizzahub_cloud
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=secret_key
```

---

## 3. Development Scripts

### Backend (`backend/`)
- `npm run dev`: Starts the Node.js Express server with live reload via `nodemon`.
- `npm run seed`: Populates initial sample pizzas, ingredients, promotional coupons, and admin accounts.
- `npm start`: Runs the server in production mode.

### Frontend (`frontend/`)
- `npm run dev`: Boots the Vite dev server (`http://localhost:5173`).
- `npm run build`: Compiles production bundle using Rollup / Vite.
- `npm run preview`: Previews the compiled production build locally.

---

## 4. API Health Check Verification

The Express API exposes a health monitoring endpoint at `/api/health`:

**Request:** `GET http://localhost:5000/api/health`  
**Response Contract:**
```json
{
  "status": "healthy",
  "message": "PizzaHub Backend API service operational",
  "timestamp": "2026-08-01T17:30:00.000Z"
}
```
