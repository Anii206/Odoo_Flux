# Security Architecture & Risk Review

This document outlines the security architecture, role-based access control (RBAC) matrix, findings from the security review, resolved vulnerabilities, and known operational limitations.

---

## 1. Roles & Permissions Matrix

All permissions in Brightloop are enforced on the backend by Axum extractors (`RequireAdmin`, `RequireStaffOrAdmin`, `AuthenticatedUser`) and scoped query filters.

| Capability / Resource | Customer | Staff | Admin | Enforcement Mechanism |
| :--- | :---: | :---: | :---: | :--- |
| Register Account & Log In | Yes | Yes | Yes | Public endpoints (`/api/auth/*`) |
| Reset Forgotten Password | Yes | Yes | Yes | Generic response; link logged to `local_emails` |
| View Own Subscriptions | Yes | Yes | Yes | Filtered by `customer_id = auth.id` |
| View All Subscriptions | **No** | Yes | Yes | `RequireStaffOrAdmin` or role check in handler |
| Create Quotation Templates | **No** | Yes | Yes | `RequireStaffOrAdmin` |
| Instantiate Subscription from Template | **No** | Yes | Yes | `RequireStaffOrAdmin` |
| Attach Discount to Subscription | **No** | Yes | Yes | `RequireStaffOrAdmin` |
| Transition Own Subscription State | Yes* | Yes | Yes | Scoped to own subscription; checked against plan rules |
| View Own Invoices & Printable HTML | Yes | Yes | Yes | Filtered by `customer_id = auth.id` |
| View All Invoices | **No** | Yes | Yes | Scoped by handler role check |
| Confirm Draft Invoices | **No** | Yes | Yes | `RequireStaffOrAdmin` |
| Send Payment Overdue Reminders | **No** | Yes | Yes | `RequireStaffOrAdmin` |
| Make Invoice Payment | Yes* | Yes | Yes | Scoped to own invoice; labeled `customer_simulated` |
| Record Overpayment (> Balance Due) | **No** | **No** | **No** | Rejected with `400 Bad Request` |
| Access Finance Analytics Dashboard | **No** | Yes | Yes | `RequireStaffOrAdmin` |
| Trigger Recurring Billing Engine Run | **No** | Yes | Yes | `RequireStaffOrAdmin` |
| Create & Manage Products & Variants | **No** | **No** | Yes | `RequireAdmin` |
| Create & Manage Billing Plans | **No** | **No** | Yes | `RequireAdmin` |
| Create & Manage Tax & Discount Rules | **No** | **No** | Yes | `RequireAdmin` |
| Provision New Staff Accounts | **No** | **No** | Yes | `RequireAdmin` |
| Access Local Email Outbox | **No** | **No** | Yes* | `RequireAdmin` AND `APP_ENV=development` |
| Trigger Bulk 2,500 Data Seeder | **No** | **No** | Yes* | `RequireAdmin` AND `APP_ENV=development` |

*\*Note: Customer self-service operations are restricted to records belonging to their own user ID.*

---

## 2. Security Controls in Place

### Cryptographic Password Hashing
- Passwords are hashed using the **Argon2id** algorithm (`argon2` crate) with unique salt strings generated via OS-level CSPRNG (`OsRng`).
- Passwords must satisfy complexity requirements checked by `validate_password`: minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, and 1 special character.

### Cryptographic Session Tokens (JWT)
- Session tokens are generated using HMAC-SHA256 (`jsonwebtoken` crate) and expire 24 hours after creation.
- The secret key is loaded from the environment variable `JWT_SECRET`. The backend halts on startup if `JWT_SECRET` is unset or shorter than 32 characters.

### Row-Level Locking & Atomic Transactions
- Sensitive mutation workflows (such as recording payments and running billing cycles) use PostgreSQL transactional boundaries (`pool.begin().await?`).
- Payment recording acquires an exclusive row lock (`SELECT ... FOR UPDATE`) on the invoice to eliminate race conditions between concurrent partial payments.
- Billing runs select eligible subscriptions with `FOR UPDATE SKIP LOCKED`, preventing multiple concurrent engine workers from processing the same subscription.

### Idempotency & Financial Audit Protection
- The composite constraint `uq_sub_billing_start (subscription_id, billing_period_start)` prevents duplicate invoices for identical billing periods.
- Database foreign keys for `invoices -> subscriptions` and `payments -> invoices` use `ON DELETE RESTRICT` (migration `002_fk_restrict.sql`). Active financial records cannot be cascade-deleted.
- Deletion attempts violating foreign key constraints return `409 Conflict` (PostgreSQL error code `23503`).

---

## 3. Vulnerability Review Status

The following items were identified during security audit and verified in code:

| Review Item | Description | Status | Resolution Details |
| :--- | :--- | :---: | :--- |
| **Hardcoded JWT Secret** | Fallback string in binary allowed arbitrary admin token forging. | **FIXED** | Secret loaded exclusively from `JWT_SECRET` via `OnceLock`. Server panics on boot if `< 32` bytes. `.env.example` updated. |
| **Exposed Dev Endpoints** | `/api/dev/emails` and `/api/dev/seed` leaked reset tokens and altered DB without auth. | **FIXED** | Protected with `RequireAdmin` and return `404 Not Found` unless `APP_ENV=development`. |
| **Dev Toolbar in Production** | UI toolbar contained seeded demo passwords in client bundle. | **FIXED** | Toolbar rendered only when `import.meta.env.DEV == true`. Demo passwords moved to dev-only `.env.development`. Seeding blocked in production DB. |
| **Payment Forgery & Overpayment** | Customers could record arbitrary payment amounts exceeding balance due. | **FIXED** | Validated `amount <= balance_due`. Payments tagged with `payment_source ('customer_simulated' vs 'staff_manual')` and displayed in UI. |
| **Discount Attachment RBAC** | Customers could attach promo discounts to arbitrary subscriptions. | **FIXED** | Switched extractor on `PATCH /api/subscriptions/{id}/discount` to `RequireStaffOrAdmin`. Customer access returns `403 Forbidden`. |
| **Discount Usage Race Condition** | Billing cycle incremented discount usage count even when invoice conflicted. | **FIXED** | Usage increment deferred until invoice insert returns `Some(id)`. Executed via `UPDATE ... WHERE current_uses < max_uses`. |
| **Billing Date Calendar Drift** | Naive `+30 days` and `+365 days` drifted dates backwards over 12 months. | **FIXED** | Replaced with anchored `chrono::Months` date arithmetic clamping to month-ends (e.g. Jan 31 -> Feb 28 -> Mar 31). |
| **Cascade Deletion of Audit Records** | `ON DELETE CASCADE` allowed deleting subscriptions and purging historical invoices. | **FIXED** | Applied migration `002_fk_restrict.sql` setting `ON DELETE RESTRICT`. Mapped Postgres error code `23503` to `409 Conflict`. |

---

## 4. Known Limitations & Production Requirements

Before deploying Brightloop to a public production environment, the following infrastructure and application capabilities must be added:

1. **Real Payment Gateway Integration**:
   - *Current State*: Customer credit card and UPI payments are simulated locally (`customer_simulated`).
   - *Requirement*: Integrate a certified PCI-DSS compliant processor (e.g., Stripe Elements or Razorpay) using server-side webhook verification and signature checking.
2. **Rate Limiting**:
   - *Current State*: No IP-level or account-level rate limiting exists on authentication endpoints.
   - *Requirement*: Deploy a reverse proxy (e.g., NGINX, Cloudflare) or Axum middleware (`tower-governor`) to rate-limit `/api/auth/login`, `/api/auth/signup`, and `/api/auth/forgot-password`.
3. **Password Reset Token Hashing**:
   - *Current State*: Password reset tokens are generated as UUID strings and stored in plaintext in `users.reset_token`.
   - *Requirement*: Store a SHA-256 hash of the reset token in the database, verifying the raw token presented in the URL against the stored hash.
4. **Token Revocation & Logout**:
   - *Current State*: JWTs remain valid until their 24-hour expiration (`exp`). Logging out on the frontend only clears `localStorage`.
   - *Requirement*: Implement a Redis-backed token revocation denylist or short-lived access tokens (15 minutes) paired with rotating refresh tokens stored in `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
5. **TLS/HTTPS & Secure Headers**:
   - *Current State*: Backend serves plaintext HTTP on port 3000.
   - *Requirement*: Terminate TLS with valid certificates (Let's Encrypt), enforce HSTS (`Strict-Transport-Security`), and configure standard security headers (`Content-Security-Policy`, `X-Frame-Options: DENY`).
