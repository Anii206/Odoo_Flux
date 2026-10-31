# Testing & Verification Guide

This document describes how to execute automated tests against Brightloop, lists what is covered in each scenario, pastes real benchmark and test run output, and details items not currently covered by automated suites.

---

## 1. How to Run the Tests

### Prerequisites
- Backend running on `http://127.0.0.1:3000` with `APP_ENV=development`.
- Frontend running on `http://localhost:5173`.
- PostgreSQL running locally with database `brightloop`.
- Python 3.11+ with `pytest` and `playwright`.

### Command to Execute End-to-End Suite

Run in PowerShell from the repository root:

```powershell
& "C:\Users\parja\AppData\Local\Programs\Python\Python312\python.exe" -m pytest e2e/verify_all_features.py -v -s
```

### Command to Execute Backend Unit Tests

Run in PowerShell from the `backend` directory:

```powershell
cd backend
cargo test -- --nocapture
```

---

## 2. Real Test Results & Execution Output

### Rust Backend Unit Tests Output

```
running 2 tests
test billing::types::tests::test_feb_29_leap_year_anchor ... ok
test billing::types::tests::test_jan_31_anchor_drift_prevention ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

### End-to-End Browser Test Suite Output

Execution log from the latest test run:

```
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.2.0, pluggy-1.7.0 -- C:\Users\parja\AppData\Local\Programs\Python\Python312\python.exe
cachedir: .pytest_cache
rootdir: C:\nan\odoo
plugins: playwright-0.10.0
collecting ... collected 1 item

e2e/verify_all_features.py::test_brightloop_verification_suite[chromium] 

======================================================================
  BRIGHTLOOP END-TO-END AUTOMATED VERIFICATION SUITE
======================================================================

--- [SCENE 1: Auth, Password Policy & 3-Tier RBAC] ---
[PASS] Step 1.1: Password policy enforced: weak password 'short123' blocks submission (>8 chars, uppercase, special)
[PASS] Step 1.2: Valid customer registration successful (shop@brightloop.test / Brightloop#2026) -> Navigated to /portal
[PASS] Step 1.3: Duplicate email rejection asserted successfully
[PASS] Step 1.4: Forgot Password link retrieved from Local Outbox Drawer and password successfully reset
[PASS] Step 1.5: Authenticated with newly reset password into Customer Portal
[PASS] Step 1.6: RBAC isolation verified: Customer cannot access /admin or /workspace
[PASS] Step 1.7: Admin provisioned Staff account: staff_1793444562@brightloop.io; staff creation restricted to Admin

--- [SCENE 2: Product Variants & Plan Rules Setup] ---
[PASS] Step 2.1: Created Product 'BrightCloud Core ERP 4562' with Sales Price 1000.00, Cost Price 400.00, and notes
[PASS] Step 2.2: Attached Product Variant: Brand = Odoo (+560.00)
[PASS] Step 2.3: Created Plan A (Flexible Monthly, min_qty=2, allow_pause=true): 'Plan A Flexible 564'
[PASS] Step 2.4: Created Plan B (Locked Yearly, auto_close=true, allow_pause=false): 'Plan B Locked 564'
[PASS] Step 2.5: Created Tax Rule: 'GST 18% 565' (18% GST)
[PASS] Step 2.6: Created Quotation Template 'Quote Template A 566' linked to Plan A with 30 days validity

--- [SCENE 3: Quote-to-Subscription State Machine] ---
[PASS] Step 3.1: Switched to Staff role -> Navigated to /workspace
[PASS] Step 3.2: Subscription UI displays Unit Price = $1560.00, SUB-..., Expiry, and Payment Terms (15 days)
[PASS] Step 3.3a: State progression: Draft -> Quotation
[PASS] Step 3.3b: State progression: Quotation -> Confirmed
[PASS] Step 3.3c: State progression: Confirmed -> Active
[PASS] Step 3.4a: Active -> Paused on Plan A succeeded
[PASS] Step 3.4b: Paused -> Active resume on Plan A succeeded
[PASS] Step 3.5: Plan constraint verified: Pause is disabled/blocked on Plan B (allow_pause = false)

--- [SCENE 4 & 5: Discount Rules Engine & Billing Simulation] ---
[PASS] Step 4.1: Created seat-based Discount Rule: '10% Seat Discount 573' (10% OFF, min_qty=5, max_uses=1)
[PASS] Step 4.1b: RBAC verified: Customer cannot call PATCH /api/subscriptions/{id}/discount (403 Forbidden)
[PASS] Step 4.1c: Staff attached discount '10% Seat Discount 573' to 5-seat subscription 75656243-7d85-47c5-a93f-2bc280c82461
[PASS] Step 5.1: Triggered Simulate Billing Day for today's date from DevToolbar
[PASS] Step 5.2: Invoice generated with customer, product lines, 10% discount, and 18% GST: INV-2026-050008
[PASS] Step 5.3: Idempotency verified: re-running billing for same date produced 0 duplicate invoices, kept discount_uses=1, and advanced next_billing_date
[PASS] Step 5.4: Discount exhaustion verified: second billing cycle did not apply discount because max_uses=1 was reached

--- [SCENE 6: Invoice Lifecycle, Printable View & Payments] ---
[PASS] Step 6.1: Invoice transitioned: Draft -> Confirmed
[PASS] Step 6.2: Printable invoice view rendered line items, taxes, GSTIN, and totals cleanly
[PASS] Step 6.2b: Overpayment prevention verified: amount exceeding balance due rejected with 400 Bad Request
[PASS] Step 6.3: Partial payment of $2,000 recorded via UPI with payment_source='staff_manual'
[PASS] Step 6.4: Full remaining balance settled via Bank Transfer; invoice automatically transitioned to Paid
[PASS] Step 6.5: FK RESTRICT verified: Deleting active product blocked with 409 Conflict (Postgres code 23503 mapped)

--- [SCENE 7: Stress Test & <2s Finance Lead SLA Verification] ---
[PASS] Step 7.1: Triggered bulk seeder: 2,500 subscriptions populated in DB
    Finance Dashboard Page Load & API Response Time: 0.865s
[PASS] Step 7.2: Finance Dashboard loaded and aggregated metrics in 0.865s (<2.0s SLA PASSED)
    Filter Interaction (Status=confirmed) Latency: 0.360s
[PASS] Step 7.3: Filter interaction responded in 0.360s (<2.0s SLA PASSED)

======================================================================
  ALL 7 SCENES COMPLETED WITH ZERO ERRORS - 100% PASS
======================================================================

PASSED

======================= 1 passed, 2 warnings in 28.92s ========================
```

---

## 3. What Each Scene Covers

1. **Scene 1 (Auth, Password Policy & 3-Tier RBAC)**:
   - Enforces password complexity (>8 chars, uppercase, lowercase, special character).
   - Rejects duplicate email registrations (`409 Conflict`).
   - Generates password recovery tokens into self-hosted outbox table (`local_emails`).
   - Completes password reset flow and authenticates with updated password.
   - Asserts customers cannot access `/admin` or `/workspace`.
   - Asserts only administrators can provision staff members.
2. **Scene 2 (Catalog, Variants & Plans)**:
   - Creates products with sales price, cost price, and notes.
   - Attaches dynamic variant price adjustments (`Brand = Odoo` adding `+$560.00`).
   - Configures flexible monthly and locked yearly plans with min quantities and lifecycle flags.
   - Creates active tax rules (18% GST) and quotation templates linked to plans.
3. **Scene 3 (State Machine & Quotation Lifecycle)**:
   - Instantiates subscriptions from quotation templates with sequential numbering (`SUB-00001`).
   - Steps through state progression: `draft` $\rightarrow$ `quotation` $\rightarrow$ `confirmed` $\rightarrow$ `active`.
   - Verifies plan constraints: pausing succeeds on Plan A (`allow_pause = true`) but is disabled on Plan B (`allow_pause = false`).
4. **Scenes 4 & 5 (Billing Engine, Idempotency & Discounts)**:
   - Creates seat-based promotional discount rules (`min_quantity = 5`, `max_uses = 1`, 10% value).
   - Asserts RBAC: customers cannot attach discounts (`403 Forbidden`); staff can attach discounts.
   - Simulates billing cycle for `target_date = today`: generates invoice with $7,800.00 subtotal, $780.00 discount, and $1,263.60 GST.
   - Tests idempotency: re-running billing on the exact same date yields zero duplicate invoices, preserves `current_uses = 1`, and advances `next_billing_date`.
   - Tests exhaustion: advances 35 days; verifies the discount rule is not applied because `max_uses = 1` was consumed.
5. **Scene 6 (Invoice Lifecycle, Printable View & Payments)**:
   - Transitions invoice from `draft` to `confirmed`.
   - Opens official printable tax invoice view; asserts GSTIN, company title, and totals render cleanly.
   - Rejects overpayments exceeding balance due (`400 Bad Request`).
   - Records partial payment ($2,000 via UPI); asserts invoice remains `confirmed` with outstanding balance.
   - Settles full remaining balance ($6,283.60 via Bank Transfer); asserts invoice transitions automatically to `paid`.
   - Asserts foreign key integrity: attempting to delete an active referenced product returns `409 Conflict` (PostgreSQL code `23503`).
6. **Scene 7 (High Volume & Performance Benchmark)**:
   - Seeds 2,500 subscriptions into PostgreSQL via bulk insert.
   - Navigates to `/finance` and measures latency: dashboard loaded in **0.865 seconds** on the local test machine.
   - Filters by invoice status (`confirmed`): UI responded in **0.360 seconds**.

---

## 4. What is NOT Covered by Current Automated Tests

The following areas are not covered by automated test scripts and require manual verification:

1. **High-Concurrency Race Conditions**:
   - Automated tests run sequential HTTP requests. They do not hammer `POST /api/invoices/{id}/payments` with 50 simultaneous parallel requests from multiple threads on the exact same invoice row.
2. **Third-Party Email Delivery**:
   - Automated tests assert that outgoing emails are inserted into the database table `local_emails`. There is no test verifying delivery through external SMTP/SES servers.
3. **Real Payment Gateway Integration**:
   - Payments are recorded directly into the application database (`payment_source = customer_simulated`). Automated tests do not communicate with external payment gateways or verify third-party webhooks.
4. **Long-Term Multi-Year Billing Sequences**:
   - While unit tests verify the date math for Jan 31 and Feb 29 over 4 cycles, end-to-end tests simulate two billing cycles (cycle 1 and cycle 2 after +35 days), not 36 consecutive monthly cycles.
5. **Reverse Proxy & HTTPS Setup**:
   - Automated tests run over plaintext HTTP against localhost. Production TLS termination, HTTP-to-HTTPS redirects, and SSL cipher suites are not tested in the automated suite.
