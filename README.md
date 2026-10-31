# Brightloop

Brightloop is a recurring billing and subscription management platform built for software teams, service businesses, and recurring commerce. It manages products, dynamic price variants, billing plans, customer subscriptions, automated recurring invoice runs, multi-method payment recording, and finance analytics.

## Features

- **Authentication & Role-Based Access Control**:
  - Three user roles: `admin`, `staff`, and `customer`.
  - Password strength validation: minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, and 1 special character.
  - Password hashing with Argon2id.
  - JSON Web Token (JWT) session authentication with 24-hour expiration.
  - Self-hosted outbox table (`local_emails`) for password resets and invoice notifications without third-party email providers.
  - Scoped data access: customers only see their own subscriptions and invoices; staff and admins manage global records.
- **Product & Variant Catalog**:
  - Products categorized as `software`, `addon`, or `service`.
  - Dynamic variant price surcharges (for example, attribute `Brand` = `Odoo` adding `$560.00` to base price).
- **Billing Plans & Rules**:
  - Recurring intervals: `daily`, `weekly`, `monthly`, and `yearly`.
  - Lifecycle flags: `auto_close`, `allow_early_close`, `allow_pause`, and `allow_renew`.
  - Minimum seat/unit quantity enforcement.
  - Calendar availability windows (`available_from`, `available_to`).
- **Quotation Templates & Subscription State Machine**:
  - Reusable templates with validity days and default product lines.
  - Finite state transitions: `draft` -> `quotation` -> `confirmed` -> `active` <-> `paused` -> `closed`.
  - Automatic sequential identifier generation (`SUB-00001`).
  - Anchored billing date calculation (preventing date drift across months with 28, 30, and 31 days).
- **Billing Engine & Idempotency**:
  - Recurring cycle runner matching due subscriptions (`next_billing_date <= target_date`).
  - Row locking with PostgreSQL `FOR UPDATE SKIP LOCKED`.
  - Double-billing protection via unique database constraint `uq_sub_billing_start (subscription_id, billing_period_start)`.
  - Next billing date automatically advances even when duplicate runs conflict.
- **Taxes & Promotional Discounts**:
  - Percentage and fixed discount rules with minimum spend, minimum quantity, usage caps (`max_uses`), and date validity.
  - Active tax rule calculation (for example, 18% GST).
  - Explicit discount attachment (`PATCH /api/subscriptions/{id}/discount`) restricted to staff and admins.
- **Invoice Lifecycle & Payments**:
  - Invoices move from `draft` -> `confirmed` -> `paid` (or `cancelled`).
  - Printable tax invoice HTML view with line items, tax breakdown, and GSTIN.
  - Payment tracking supporting `bank_transfer`, `card`, `upi`, and `cash`.
  - Overpayment rejection (payments greater than the balance due return 400 Bad Request).
  - Source tracking on payments: customer payments are labeled `customer_simulated`; internal team payments are labeled `staff_manual`.
  - Automatic invoice status transition to `paid` once the balance reaches zero.
- **Finance Analytics**:
  - Aggregated metrics: Active Subscriptions count, Monthly Recurring Revenue (MRR), Collected Revenue, and Overdue Receivables.
  - High-volume data tested up to 2,500 active subscriptions.

## Tech Stack

### Backend

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| Rust (Edition 2021) | 1.85+ | Backend runtime and language |
| `axum` | `0.8` | HTTP web server and routing framework |
| `tokio` | `1.x` | Asynchronous multi-threaded runtime |
| `sqlx` | `0.8` | Async PostgreSQL driver with compile-time checked queries |
| `argon2` | `0.5` | Password hashing with cryptographic salts |
| `jsonwebtoken` | `9.x` | HMAC-SHA256 JWT encoding and decoding |
| `rust_decimal` | `1.36` | 128-bit fixed-point decimal arithmetic for currency calculations |
| `chrono` | `0.4` | Date, time, and calendar arithmetic |
| `uuid` | `1.10` | Unique identifier generation (UUIDv4) |
| `tower-http` | `0.6` | CORS and HTTP request tracing middleware |
| `PostgreSQL` | 16+ | Relational database with transactional ACID guarantees |

### Frontend

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| `react` | `18.3.1` | User interface component library |
| `react-dom` | `18.3.1` | DOM renderer for React |
| `react-router-dom` | `7.18.5` | Client-side routing |
| `vite` | `6.1.0` | Fast dev server and frontend build tool |
| `typescript` | `5.7.3` | Static type checking |
| `tailwindcss` | `3.4.17` | Utility-first CSS styling |
| `lucide-react` | `0.475.0` | UI icon library |

### Testing

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| `pytest` | `9.2.0` | Python test runner |
| `playwright` | `0.10.0` | Automated browser end-to-end testing |
| `Python` | `3.12.x` | End-to-end test execution environment |

## Quick Start

### Prerequisites

- Rust toolchain: `rustc` and `cargo` (1.80+)
- Node.js (v20+) and `npm`
- PostgreSQL (v15+)
- Python (3.11+) with `pytest` and `playwright` installed

### 1. Database Setup

Create the PostgreSQL database:

```powershell
# Using psql on Windows
& "psql" -U postgres -c "CREATE DATABASE brightloop;"
```

### 2. Backend Configuration & Startup

Navigate to the `backend` directory and set up your environment variables:

```powershell
cd backend
Copy-Item .env.example .env
```

Edit `backend/.env` with your PostgreSQL credentials and a 32+ character JWT secret:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/brightloop
PORT=3000
JWT_SECRET=<generate-at-least-32-random-characters>
APP_ENV=development
```

Run the backend server. The backend runs all database migrations automatically on startup:

```powershell
cargo run
```

The API will listen on `http://127.0.0.1:3000`.

### 3. Frontend Configuration & Startup

In a separate terminal, navigate to the `frontend` directory:

```powershell
cd frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:5173`.

### 4. Run Automated End-to-End Tests

To execute the complete browser verification suite covering all 7 business scenes:

```powershell
# Install Python test dependencies if not already present
pip install pytest pytest-playwright
playwright install chromium

# Run the test suite
pytest e2e/verify_all_features.py -v -s
```

## Environment Variables

| Name | Required | Example | Purpose |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | `postgres://postgres:postgres@localhost:5432/brightloop` | PostgreSQL connection string |
| `PORT` | No | `3000` | HTTP port for Axum server (defaults to 3000) |
| `JWT_SECRET` | Yes | `<random-32-plus-characters>` | HMAC secret used to sign session tokens. Server panics on startup if missing or shorter than 32 characters. |
| `APP_ENV` | Yes | `development` or `production` | Environment flag. Controls dev endpoints (`/api/dev/emails`, `/api/dev/seed`) and demo database seeding. |

## Demo Accounts (Development Only)

When `APP_ENV=development`, the application seeds initial accounts on first launch. These accounts are intended only for local evaluation and testing.

| Role | Email | Password | Allowed Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@brightloop.io` | `Admin@Brightloop2026!` | Admin Panel (`/admin`), Staff Creation, Catalog & Plan Management, Dev Tools |
| **Staff** | `staff@brightloop.io` | `Staff@Brightloop2026!` | ERP Workspace (`/workspace`), Quotations, Subscriptions, Invoices, Payments |
| **Finance** | `finance@brightloop.io` | `Finance@Brightloop2026!` | Finance Dashboard (`/finance`), Revenue Metrics, Overdue Invoices |
| **Customer** | `customer@brightloop.io` | `Customer@Brightloop2026!` | Customer Portal (`/portal`), Own Subscriptions, Add-on Toggles, Own Invoices |

In development mode (`import.meta.env.DEV`), a **Dev Time-Travel Toolbar** appears at the bottom of the browser. It allows quick role switching, simulated date selection, manual billing runs, and seed generation.

## Project Structure

```
odoo/
├── backend/
│   ├── migrations/
│   │   ├── 001_init.sql          # Core tables, constraints, indexes, sequence
│   │   └── 002_fk_restrict.sql   # Audit trail protection (ON DELETE RESTRICT)
│   ├── src/
│   │   ├── auth/                 # Argon2 hashing, JWT signing, password policy, recovery
│   │   ├── billing/              # Billing engine, date arithmetic, worker loop, trigger handler
│   │   ├── handlers/             # Axum HTTP handlers (products, plans, rules, subs, invoices, payments, finance)
│   │   ├── models/               # Rust domain structs and SQL row mappings
│   │   ├── error.rs              # AppError enum and HTTP status code mappings
│   │   ├── main.rs               # Application entry point, DB pool init, migration runner
│   │   ├── routes.rs             # Axum router definition and route bindings
│   │   └── seed.rs               # Development seed loader
│   ├── Cargo.toml                # Rust dependencies and compiler configuration
│   └── .env.example              # Template configuration
├── frontend/
│   ├── src/
│   │   ├── api/                  # API client functions with auth headers
│   │   ├── components/           # UI modules (admin, workspace, portal, finance, common)
│   │   ├── pages/                # Top-level view routes (Admin, Workspace, Portal, Finance, Auth)
│   │   ├── types/                # TypeScript interface definitions
│   │   ├── App.tsx               # Root route switcher
│   │   └── main.tsx              # React DOM mounting
│   ├── package.json              # Frontend npm dependencies
│   └── vite.config.ts            # Vite bundler configuration
├── e2e/
│   └── verify_all_features.py    # Automated Playwright test suite (Scenes 1 through 7)
├── docs/
│   ├── ARCHITECTURE.md           # System design, data flows, state machines, math verification
│   ├── API.md                    # REST endpoint catalog, extractors, and request examples
│   ├── SECURITY.md               # RBAC matrix, audit review resolutions, and production requirements
│   ├── TESTING.md                # Test execution instructions and verified benchmark logs
│   └── DEMO_SCRIPT.md            # Step-by-step 10-minute video presentation script
└── README.md                     # Project documentation overview
```

## Documentation Directory

Detailed documentation is available in the `docs/` folder:

- [System Architecture](file:///C:/nan/odoo/docs/ARCHITECTURE.md): Architecture diagrams, state machines, billing engine logic, and date arithmetic.
- [API Reference](file:///C:/nan/odoo/docs/API.md): Endpoint catalog, real extractor guards, and example requests.
- [Security Model](file:///C:/nan/odoo/docs/SECURITY.md): RBAC matrix, audit findings, fixed issues, and production checklist.
- [Testing Guide](file:///C:/nan/odoo/docs/TESTING.md): End-to-end test instructions, verified test counts, and benchmark numbers.
- [Demo Script](file:///C:/nan/odoo/docs/DEMO_SCRIPT.md): 10-minute video presentation script with timestamps, spoken words, screen actions, and FAQ.

## Known Limitations

- **Simulated Payment Gateway**: Customer credit card, UPI, and bank transfer payments are simulated locally. The application records payment records in PostgreSQL and updates invoice balances, but does not interact with a real merchant payment processor (such as Stripe or Razorpay).
- **Synthetic Revenue Trajectory Chart**: The finance dashboard bar chart distributes live collected and outstanding totals into synthetic monthly buckets (`MAY` through `OCT`) using a mathematical fraction rather than grouping historical payment timestamps.
- **In-Memory Email Outbox**: Password reset emails and invoice notices are inserted into a database table (`local_emails`) viewable in the developer toolbar drawer rather than being delivered via external SMTP/SES.
- **Plaintext Password Reset Tokens**: Reset tokens are generated via UUIDv4 and stored directly in the `users.reset_token` column rather than being hashed with SHA-256 prior to persistence.
- **Single-Node In-Process Billing Worker**: The recurring billing worker runs as a background Tokio task inside the Axum process. In multi-instance deployments, horizontal scaling requires an external scheduler or distributed lock.
