# REST API Reference

This document catalogs every HTTP route registered in [`backend/src/routes.rs`](file:///C:/nan/odoo/backend/src/routes.rs), including the exact extractor guards, request payloads, responses, and potential error codes.

---

## 1. Authentication & Session Management

Brightloop uses custom HMAC-SHA256 JSON Web Tokens (JWT) for authentication.

### Token Specification
- **Signing Algorithm**: HS256 (`jsonwebtoken` crate)
- **Secret Requirement**: Read from `JWT_SECRET` environment variable (minimum 32 characters; server halts on startup if missing or shorter).
- **Token Lifetime**: 24 hours from generation (`exp = Utc::now() + Duration::hours(24)`).
- **Transport**: Standard HTTP `Authorization` header formatted as:
  ```http
  Authorization: Bearer <your-jwt-token>
  ```

### Obtaining a Token

#### Request: `POST /api/auth/login`
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@brightloop.io",
    "password": "Staff@Brightloop2026!"
  }'
```

#### Response: `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "e3b0c442-98fc-1c14-9afb-4c7c59d34599",
    "email": "staff@brightloop.io",
    "role": "staff"
  }
}
```

---

## 2. Complete Endpoint Catalog

| Method | Endpoint Path | Auth Guard (Extractor) | Request Body | Success Response | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public (None) | None | `{"status": "ok", "app": "brightloop-backend"}` | `500` |
| `POST` | `/api/auth/signup` | Public (None) | `{"email", "password"}` | `{"token", "user"}` | `400`, `409` |
| `POST` | `/api/auth/login` | Public (None) | `{"email", "password"}` | `{"token", "user"}` | `400`, `401` |
| `POST` | `/api/auth/forgot-password` | Public (None) | `{"email"}` | `{"message", "success": true}` | `400` |
| `POST` | `/api/auth/reset-password` | Public (None) | `{"token", "new_password"}` | `{"message", "success": true}` | `400` |
| `GET` | `/api/auth/me` | `AuthenticatedUser` | None | `{"user": {"id", "email", "role"}}` | `401` |
| `GET` | `/api/dev/emails` | `RequireAdmin` + `APP_ENV==development` | None | `[{"id", "recipient_email", "subject", "body_html", "created_at"}]` | `401`, `403`, `404` |
| `POST` | `/api/admin/staff` | `RequireAdmin` | `{"email", "password"}` | `{"id", "email", "role": "staff"}` | `400`, `401`, `403`, `409` |
| `GET` | `/api/admin/users` | `RequireAdmin` | None | `[{"id", "email", "role", "created_at"}]` | `401`, `403` |
| `GET` | `/api/products` | `AuthenticatedUser` | None | `[{"product": {...}, "variants": [...]}]` | `401` |
| `POST` | `/api/products` | `RequireAdmin` | `{"name", "product_type", "sales_price", "cost_price", "notes"}` | `{"product": {...}, "variants": [...]}` | `400`, `401`, `403` |
| `GET` | `/api/products/{id}` | `AuthenticatedUser` | None | `{"product": {...}, "variants": [...]}` | `401`, `404` |
| `PUT` | `/api/products/{id}` | `RequireAdmin` | `{"name", "product_type", "sales_price", "cost_price", "notes"}` | `{"product": {...}, "variants": [...]}` | `400`, `401`, `403`, `404` |
| `DELETE` | `/api/products/{id}` | `RequireAdmin` | None | `{"success": true, "id"}` | `401`, `403`, `404`, `409` |
| `GET` | `/api/products/{id}/variants` | `AuthenticatedUser` | None | `[{"id", "attribute_name", "attribute_value", "price_extra"}]` | `401`, `404` |
| `POST` | `/api/products/{id}/variants` | `RequireAdmin` | `{"attribute_name", "attribute_value", "price_extra"}` | `{"id", "attribute_name", "attribute_value", "price_extra"}` | `400`, `401`, `403`, `404` |
| `GET` | `/api/products/{id}/variants/{v_id}` | `AuthenticatedUser` | None | `{"id", "attribute_name", "attribute_value", "price_extra"}` | `401`, `404` |
| `PUT` | `/api/products/{id}/variants/{v_id}` | `RequireAdmin` | `{"attribute_name", "attribute_value", "price_extra"}` | `{"id", "attribute_name", "attribute_value", "price_extra"}` | `400`, `401`, `403`, `404` |
| `DELETE` | `/api/products/{id}/variants/{v_id}` | `RequireAdmin` | None | `{"success": true}` | `401`, `403`, `404` |
| `GET` | `/api/plans` | `AuthenticatedUser` | None | `[{"id", "name", "billing_interval", "plan_price", "min_quantity", ...}]` | `401` |
| `POST` | `/api/plans` | `RequireAdmin` | `{"name", "billing_interval", "plan_price", "min_quantity", "available_from", ...}` | `{"id", "name", ...}` | `400`, `401`, `403` |
| `GET` | `/api/plans/{id}` | `AuthenticatedUser` | None | `{"id", "name", ...}` | `401`, `404` |
| `PUT` | `/api/plans/{id}` | `RequireAdmin` | Updated plan fields | `{"id", "name", ...}` | `400`, `401`, `403`, `404` |
| `DELETE` | `/api/plans/{id}` | `RequireAdmin` | None | `{"success": true}` | `401`, `403`, `404`, `409` |
| `GET` | `/api/tax-rules` | `AuthenticatedUser` | None | `[{"id", "name", "rate_percentage", "is_active"}]` | `401` |
| `POST` | `/api/tax-rules` | `RequireAdmin` | `{"name", "rate_percentage", "is_active"}` | `{"id", "name", "rate_percentage", "is_active"}` | `400`, `401`, `403` |
| `GET` | `/api/tax-rules/{id}` | `AuthenticatedUser` | None | `{"id", "name", "rate_percentage", "is_active"}` | `401`, `404` |
| `PUT` | `/api/tax-rules/{id}` | `RequireAdmin` | Updated tax rule fields | `{"id", "name", ...}` | `400`, `401`, `403`, `404` |
| `DELETE` | `/api/tax-rules/{id}` | `RequireAdmin` | None | `{"success": true}` | `401`, `403`, `404` |
| `GET` | `/api/discount-rules` | `AuthenticatedUser` | None | `[{"id", "name", "discount_type", "value", "min_quantity", "max_uses", ...}]` | `401` |
| `POST` | `/api/discount-rules` | `RequireAdmin` | `{"name", "discount_type", "value", "min_quantity", "max_uses", "start_date", "applies_to"}` | `{"id", "name", ...}` | `400`, `401`, `403` |
| `GET` | `/api/discount-rules/{id}` | `AuthenticatedUser` | None | `{"id", "name", ...}` | `401`, `404` |
| `PUT` | `/api/discount-rules/{id}` | `RequireAdmin` | Updated discount fields | `{"id", "name", ...}` | `400`, `401`, `403`, `404` |
| `DELETE` | `/api/discount-rules/{id}` | `RequireAdmin` | None | `{"success": true}` | `401`, `403`, `404` |
| `GET` | `/api/quotation-templates` | `AuthenticatedUser` | None | `[{"template": {...}, "lines": [...]}]` | `401` |
| `POST` | `/api/quotation-templates` | `RequireStaffOrAdmin` | `{"name", "plan_id", "validity_days", "lines": [...]}` | `{"template": {...}, "lines": [...]}` | `400`, `401`, `403` |
| `GET` | `/api/quotation-templates/{id}` | `AuthenticatedUser` | None | `{"template": {...}, "lines": [...]}` | `401`, `404` |
| `PUT` | `/api/quotation-templates/{id}` | `RequireStaffOrAdmin` | Updated template fields | `{"template": {...}, "lines": [...]}` | `400`, `401`, `403`, `404` |
| `DELETE` | `/api/quotation-templates/{id}` | `RequireStaffOrAdmin` | None | `{"success": true}` | `401`, `403`, `404` |
| `GET` | `/api/subscriptions` | `AuthenticatedUser` (Scoped) | None | `[{"subscription": {...}, "lines": [...]}]` | `401` |
| `POST` | `/api/subscriptions` | `AuthenticatedUser` (Scoped) | `{"customer_id", "plan_id", "lines": [...]}` | `{"subscription": {...}, "lines": [...]}` | `400`, `401`, `403` |
| `GET` | `/api/subscriptions/{id}` | `AuthenticatedUser` (Scoped) | None | `{"subscription": {...}, "lines": [...]}` | `401`, `403`, `404` |
| `POST` | `/api/subscriptions/from-template` | `RequireStaffOrAdmin` | `{"template_id", "customer_id"}` | `{"subscription": {...}, "lines": [...]}` | `400`, `401`, `403`, `404` |
| `PATCH` | `/api/subscriptions/{id}/status` | `AuthenticatedUser` (Scoped) | `{"status": "quotation" \| "confirmed" \| "active" \| "paused" \| "closed"}` | `{"subscription": {...}, "lines": [...]}` | `400`, `401`, `403`, `404` |
| `PATCH` | `/api/subscriptions/{id}/discount` | `RequireStaffOrAdmin` | `{"discount_id": "<uuid>" \| null}` | `{"subscription": {...}, "lines": [...]}` | `401`, `403`, `404` |
| `POST` | `/api/subscriptions/{id}/renew` | `AuthenticatedUser` (Scoped) | None | `{"subscription": {...}, "lines": [...]}` | `400`, `401`, `403`, `404` |
| `GET` | `/api/portal/subscriptions` | `AuthenticatedUser` (Customer) | None | `[{"subscription": {...}, "lines": [...]}]` | `401` |
| `POST` | `/api/portal/subscriptions/{id}/toggle-addon` | `AuthenticatedUser` (Customer) | `{"addon_product_id", "variant_id"}` | `{"action": "added" \| "removed", "subscription": {...}}` | `400`, `401`, `403`, `404` |
| `POST` | `/api/billing/run` | `RequireStaffOrAdmin` | `{"target_date": "YYYY-MM-DD"}` (Optional) | `{"target_date", "invoices_generated", "subscriptions_closed"}` | `400`, `401`, `403` |
| `GET` | `/api/invoices` | `AuthenticatedUser` (Scoped) | None | `[{"invoice": {...}, "lines": [...]}]` | `401` |
| `POST` | `/api/invoices` | `RequireStaffOrAdmin` | `{"subscription_id", "customer_id", "billing_period_start", "billing_period_end", "subtotal", "grand_total", "lines": [...]}` | `{"invoice": {...}, "lines": [...]}` | `400`, `401`, `403` |
| `GET` | `/api/invoices/{id}` | `AuthenticatedUser` (Scoped) | None | `{"invoice": {...}, "lines": [...]}` | `401`, `403`, `404` |
| `PATCH` | `/api/invoices/{id}/status` | `RequireStaffOrAdmin` | `{"status": "confirmed" \| "cancelled"}` | `{"invoice": {...}}` | `400`, `401`, `403`, `404` |
| `GET` | `/api/invoices/{id}/print` | `AuthenticatedUser` (Scoped) | None | HTML document (`text/html`) | `401`, `403`, `404` |
| `POST` | `/api/invoices/{id}/remind` | `RequireStaffOrAdmin` | None | `{"success": true, "message"}` | `401`, `403`, `404` |
| `GET` | `/api/invoices/{id}/payments` | `AuthenticatedUser` (Scoped) | None | `[{"id", "invoice_id", "payment_method", "amount", "payment_source", ...}]` | `401`, `403`, `404` |
| `POST` | `/api/invoices/{id}/payments` | `AuthenticatedUser` (Scoped) | `{"payment_method", "amount", "note"}` | `{"payment": {...}, "invoice": {...}}` | `400`, `401`, `403`, `404` |
| `GET` | `/api/finance/dashboard` | `RequireStaffOrAdmin` | Query params: `status`, `customer_id` | `{"metrics": {"mrr", "collected_revenue", "outstanding_revenue", ...}, "invoices": [...]}` | `401`, `403` |
| `POST` | `/api/dev/seed` | `RequireAdmin` + `APP_ENV==development` | None | `{"success": true, "message": "Seeded 2500 subscriptions..."}` | `401`, `403`, `404` |

---

## 3. Example API Requests

### 1. Triggering an Idempotent Billing Run

#### Request: `POST /api/billing/run`
```bash
curl -X POST http://localhost:3000/api/billing/run \
  -H "Authorization: Bearer <staff-or-admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "target_date": "2026-10-31"
  }'
```

#### Response: `200 OK`
```json
{
  "target_date": "2026-10-31",
  "invoices_generated": 1,
  "subscriptions_closed": 0
}
```

---

### 2. Recording an Invoice Payment

#### Request: `POST /api/invoices/{id}/payments`
```bash
curl -X POST http://localhost:3000/api/invoices/75656243-7d85-47c5-a93f-2bc280c82461/payments \
  -H "Authorization: Bearer <user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "upi",
    "amount": "2000.00",
    "note": "UPI Ref #UPI-TX-98214"
  }'
```

#### Response: `200 OK`
```json
{
  "payment": {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "invoice_id": "75656243-7d85-47c5-a93f-2bc280c82461",
    "payment_method": "upi",
    "amount": "2000.00",
    "payment_date": "2026-10-31",
    "note": "UPI Ref #UPI-TX-98214",
    "payment_source": "staff_manual",
    "created_at": "2026-10-31T11:00:00Z"
  },
  "invoice": {
    "id": "75656243-7d85-47c5-a93f-2bc280c82461",
    "invoice_number": "INV-2026-050008",
    "status": "confirmed",
    "grand_total": "8283.60",
    "amount_paid": "2000.00"
  }
}
```

---

### 3. Attempting an Overpayment (Rejected)

#### Request: `POST /api/invoices/{id}/payments`
```bash
curl -X POST http://localhost:3000/api/invoices/75656243-7d85-47c5-a93f-2bc280c82461/payments \
  -H "Authorization: Bearer <user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "card",
    "amount": "99999.00"
  }'
```

#### Response: `400 Bad Request`
```json
{
  "error": "Payment amount ($99999.00) cannot exceed the remaining balance due ($6283.60)."
}
```
