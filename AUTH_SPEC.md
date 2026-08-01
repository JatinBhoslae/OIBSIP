# PizzaHub — Authentication Foundation Specification (Part 7)

**Version:** 1.0  
**Document Type:** Backend Authentication Architecture & Security Specification  
**Security Standards:** OWASP Top 10 Guidelines, JWT RFC 7519, bcrypt Hashing

---

## 1. Authentication Architecture & Execution Pipeline

Every authentication request follows a strict layered pipeline:

```
[Client App] ──► [Auth Express Route] ──► [Input Validation Middleware] ──► [Auth Controller] ──► [Auth Utility / Service] ──► [MongoDB Mongoose] ──► [JWT Sign] ──► [HTTP Response]
```

---

## 2. Password & Token Security Strategy

### Password Hashing Rules
- **Algorithm:** `bcryptjs` with salt rounds = 10.
- **Validation Rules:** Minimum 8 characters, requiring at least one uppercase letter, one lowercase letter, one digit, and one special character (e.g. `Pizza@123`).
- **Never Store:** Plaintext passwords in database, logs, or memory buffers.

### JWT Strategy & Payload
- **Access Token Lifetime:** 7 days (`JWT_EXPIRES_IN=7d`).
- **Payload Contents:**
  ```json
  {
    "id": "60d21b4667d0d8992e610c85",
    "email": "customer@pizzahub.com",
    "role": "user"
  }
  ```
- **OWASP Principle:** Sensitive values (passwords, OTPs, financial details) are strictly excluded from the JWT token body.

---

## 3. Middleware & Role-Based Authorization

1. **`protect` Middleware:**
   - Extracts bearer token from HTTP `Authorization: Bearer <token>` header.
   - Verifies signature using `JWT_SECRET`.
   - Attaches decoded user record to `req.user`.

2. **`adminOnly` Middleware:**
   - Evaluates `req.user.role === 'admin'`.
   - Blocks unauthorized non-admin access with `HTTP 403 Forbidden`.

---

## 4. Generic Security Messaging & Rate Limiting

- **Security Messaging:** All authentication failure responses return generic messages (`Invalid email or password`) to prevent account enumeration attacks.
- **Brute-Force Safeguard:** Rate limiting limits login attempts to 5 failures per 15-minute window per IP.
