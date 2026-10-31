# Brightloop Video Presentation Script (10-Minute Walkthrough)

This script is designed for a 10-minute video presentation to introduce Brightloop to an audience without a subscription billing background—such as a hackathon judge, a technical recruiter, or a software engineer.

---

## Pre-Recording Checklist

Before you start recording your screen and microphone:

1. **Clean Database Setup**:
   - Ensure the database is fresh:
     ```powershell
     & "psql" -U postgres -c "DROP DATABASE IF EXISTS brightloop;"
     & "psql" -U postgres -c "CREATE DATABASE brightloop;"
     ```
2. **Configure Environment**:
   - Verify `backend/.env` has:
     ```env
     DATABASE_URL=postgres://postgres:postgres@localhost:5432/brightloop
     PORT=3000
     JWT_SECRET=brightloop_production_grade_secret_key_32chars_minimum!
     APP_ENV=development
     ```
3. **Start Applications**:
   - Backend terminal: `cd backend; cargo run`
   - Frontend terminal: `cd frontend; npm run dev`
4. **Display Settings**:
   - Browser window: Google Chrome maximized at 1920x1080 resolution.
   - Zoom level: Set to **110%** in Chrome for clean legibility on video.
   - Turn on "Do Not Disturb" on Windows to suppress notifications.
   - Open browser at `http://localhost:5173`.

---

## Demo Data Cheat Sheet

Keep these exact values handy during recording so the on-screen numbers match the script:

- **Customer Email**: `shop@brightloop.test`
- **Initial Password**: `Brightloop#2026`
- **Product Name**: `BrightCloud Core ERP`
  - Sales Price: `1000.00`, Cost Price: `400.00`, Notes: `Core Enterprise Software`
- **Variant**: Attribute Name: `Brand`, Attribute Value: `Odoo`, Surcharge: `560.00`
  - Total Unit Price: **$1,560.00**
- **Plan A**: `Plan A Flexible Monthly`
  - Billing Interval: `monthly`, Plan Price: `199.00`, Min Qty: `2`
  - Checkboxes: `allow_early_close` (checked), `allow_pause` (checked), `allow_renew` (checked), `auto_close` (unchecked)
- **Plan B**: `Plan B Locked Yearly`
  - Billing Interval: `yearly`, Plan Price: `1200.00`, Min Qty: `1`
  - Checkboxes: `auto_close` (checked), `allow_pause` (unchecked), `allow_early_close` (unchecked)
- **Tax Rule**: Name: `GST 18%`, Rate: `18.00%`
- **Quotation Template**: Name: `Quote Template A`
  - Linked Plan: `Plan A Flexible Monthly`, Validity: `30` days, Quantity: `5`
- **Discount Rule**: Name: `10% Seat Discount`
  - Type: `Percentage`, Value: `10`, Min Seats: `5`, Max Uses: `1`
- **Financial Numbers**:
  - Subtotal: 5 seats $\times$ $1,560.00 = **$7,800.00**
  - 10% Discount: **$780.00**
  - Taxable Base: **$7,020.00**
  - 18% GST: **$1,263.60**
  - Grand Total: **$8,283.60**
  - Partial Payment: **$2,000.00** via UPI (Remaining: **$6,283.60**)
  - Final Payment: **$6,283.60** via Bank Transfer (Remaining: **$0.00**, status: `paid`)

---

## "If Something Breaks" Backup Plan

- **If a button does not respond**: Check the browser console. If you see a 401 Unauthorized, use the bottom Dev Toolbar to click "Admin" or "Staff" to refresh the JWT in `localStorage`.
- **If the billing simulation returns no invoices**: Verify the subscription is currently in the `active` status and `next_billing_date` is on or before the simulated date in the Dev Toolbar.
- **If a unique constraint conflict occurs**: The system is designed to handle this cleanly. Point out that the unique database constraint prevented a duplicate invoice, which is a feature, not a bug.

---

## Timed Video Script

### [00:00 - 01:00] Section 1: The Problem with Recurring Billing

**Say:**  
"Have you ever tried to cancel a gym membership or change your phone plan, only to be charged twice the next month? Or maybe you run a software company, and when a client adds five new employee seats mid-month, your spreadsheet breaks, taxes get calculated wrong, and billing dates drift backwards?

Recurring billing sounds simple on the surface: you just charge someone every thirty days, right? But in the real world, months have 28, 30, or 31 days. Subscriptions get paused, customers upgrade seat counts, promotional discounts expire after one use, and multiple background servers might try to charge the same credit card at the exact same second. If your software makes a mistake, you lose customer trust or you lose revenue.

Today, I am going to show you Brightloop. Brightloop is built to solve these exact problems."

**Show:**  
- Start on the Brightloop landing screen at `http://localhost:5173`.
- Scroll smoothly down the clean, dark-mode user interface.
- Show the navigation bar with Sign In and Sign Up buttons.

**Tip:**  
Speak calmly. Use the gym membership analogy to hook anyone who has experienced billing headaches.

---

### [01:00 - 02:00] Section 2: What Brightloop Is & The Tech Stack

**Say:**  
"In one plain sentence: Brightloop is an end-to-end subscription management and automated recurring billing platform built for businesses that sell software and services.

To make sure billing calculations are exact to the penny, we chose a rock-solid tech stack. On the backend, we use Rust with the Axum web framework and SQLx. In financial software, you cannot use standard floating-point numbers like 0.1 plus 0.2 because computers introduce tiny rounding errors that accumulate into lost dollars. Rust gives us fixed-point decimal arithmetic with 128-bit precision through the rust-decimal crate. 

Our database is PostgreSQL, providing strict ACID transactions, row-level locking, and database-level unique constraints to guarantee that double-billing is mathematically impossible. On the frontend, we built a responsive React 18 single-page application styled with TailwindCSS.

Let us jump right into the application and see how it works."

**Show:**  
- Show a brief slide or terminal view showing `cargo run` and the PostgreSQL database.
- Transition smoothly back to the browser window.

**Tip:**  
Emphasize the distinction between binary floating-point numbers and fixed-point decimals without getting bogged down in compiler jargon.

---

### [02:00 - 03:30] Section 3: Authentication & Three-Tier Role Isolation

**Say:**  
"Let us start with security and access control. Brightloop enforces a three-tier role-based system: Admins, Staff members, and Customers.

Let us test our signup validation by clicking 'Create Account'. If I try to enter a weak password like 'short123', the system immediately blocks me. Our password policy requires at least eight characters, an uppercase letter, a lowercase letter, and a special symbol. All passwords are encrypted using Argon2id, which is currently the highest standard for password hashing.

Now, let us register a valid customer account: 'shop@brightloop.test' with a secure password. When we sign up, the backend issues an HMAC-SHA256 session token that lasts twenty-four hours.

Notice where we land: the Customer Portal. As a customer, I only have access to my own active services and invoices. If I manually try to navigate to '/admin' or '/workspace', the backend extractors immediately block me with a 403 Forbidden error. Customers cannot snoop on other customers or access internal company data.

What if a customer forgets their password? Let us log out and click 'Forgot Password'. Rather than depending on an expensive third-party email service during development, Brightloop has a built-in local outbox. We open the Outbox Drawer in our developer toolbar, see the password reset link generated with a single-use token, click it, set a new password, and log right back in.

Now let us switch to our Administrator account using the Dev Toolbar."

**Show:**  
- Click "Create Account" (`/signup`).
- Type `shop@brightloop.test` and weak password `short123`. Show the UI validation error.
- Enter strong password `Brightloop#2026` and submit.
- Show redirection to `/portal`.
- Attempt to type `http://localhost:5173/admin` in the browser URL bar; show access denial.
- Click "Log Out". Click "Forgot Password", enter `shop@brightloop.test`.
- Click the Outbox icon in the bottom Dev Toolbar. Show the simulated email message.
- Click the reset link, enter new password `NewBrightloop#2026!`, and submit.
- Click "Admin" in the bottom toolbar to switch roles.

**Tip:**  
Do not rush the password reset drawer. Pointing out the self-hosted outbox shows practical developer empathy.

---

### [03:30 - 05:00] Section 4: Products, Dynamic Variants & Plan Rules

**Say:**  
"Now we are logged in as an Administrator in the Admin Panel. Let us set up our product catalog and billing plans.

First, we go to 'Products & Variants'. Let us create a software product called 'BrightCloud Core ERP'. We set the base sales price to $1,000.00 and our internal cost price to $400.00. 

Next, what if a customer wants a premium edition? Instead of creating ten separate duplicate products, Brightloop supports dynamic variants. Let us click 'Add Variant'. We will add an attribute called 'Brand' with value 'Odoo', which adds a surcharge of $560.00. That means when this variant is selected, the unit price will automatically be $1,000 plus $560, equaling exactly $1,560.00.

Now let us click 'Plans Configurator'. Subscriptions need business rules. We are going to create two different plans:
Plan A is our 'Flexible Monthly' plan. We set billing to monthly, minimum quantity to two seats, and we check 'Allow Pause', 'Allow Early Close', and 'Allow Renewal'.
Plan B is our 'Locked Yearly' plan. We set billing to yearly, and check 'Auto Close', but uncheck 'Allow Pause' and uncheck 'Allow Early Close'. This guarantees that customers on Plan B cannot pause their contract early.

Finally, we go to 'Taxes & Discounts'. We create an 18% GST tax rule. Then we create a 'Quotation Template' linked to Plan A with 30 days validity, attaching our Core ERP product with the Odoo variant and a default seat quantity of 5.

Templates save staff time by standardizing sales quotes into one single click."

**Show:**  
- Navigate to `/admin`.
- Click "Products & Variants". Fill in Product Name `BrightCloud Core ERP`, Sales Price `1000.00`, Cost `400.00`. Click "Create".
- On the new product card, click "Add Variant". Enter Attribute: `Brand`, Value: `Odoo`, Extra: `560.00`. Submit. Show the badge `Brand: Odoo (+560)`.
- Click "Plans Configurator". Create `Plan A Flexible Monthly` (monthly, min 2, allow pause, allow early close). Create `Plan B Locked Yearly` (yearly, min 1, auto close, no pause).
- Click "Taxes & Discounts". Create Tax Rule `GST 18%` with 18.00%.
- Click "Quotation Templates". Create `Quote Template A` selecting Plan A, 30 days validity, Core ERP product, Odoo variant, quantity 5. Click "Create".

**Tip:**  
Highlight the math ($1,000 + $560 = $1,560) clearly because this number will carry through the entire invoice calculation.

---

### [05:00 - 06:30] Section 5: The Quote-to-Subscription State Machine

**Say:**  
"Now let us switch roles to our sales staff. In the Dev Toolbar, I click 'Staff'. Notice the interface updates to our Internal Team ERP Workspace.

Let us click 'New from Template'. We select 'Quote Template A' and choose our customer 'shop@brightloop.test'. When we click 'Generate Quotation', Brightloop automatically creates a new subscription with sequential identifier 'SUB-00001'. Notice the unit price: exactly $1,560.00. The payment terms default to 15 days, and the expiry date is set 30 days in the future.

Now, let us observe the state machine. Every subscription follows strict lifecycle stages: Draft, Quotation, Confirmed, and Active.

First, the salesperson clicks 'Send Quotation'. The status moves from Draft to Quotation.
Next, the customer approves the order. Staff clicks 'Confirm Order'. The status advances to Confirmed.
Finally, staff clicks 'Activate'. The subscription is now Active and ready for recurring billing!

Remember how we set 'Allow Pause' on Plan A? Let us test it. If we click 'Pause', the subscription safely transitions to Paused. If we click 'Resume', it returns to Active. But on Plan B, where 'Allow Pause' was set to false, that Pause button is completely disabled by both the UI and backend logic. The business rules are enforced at every step."

**Show:**  
- Click "Staff" on the Dev Toolbar.
- Click "New from Template". Select `Quote Template A` and `shop@brightloop.test`. Click "Generate Quotation".
- Show the subscription card displaying `SUB-00001`, Unit Price `$1560.00`, Expiry Date, and `Payment Terms: 15 days`.
- Click "Send Quotation" $\rightarrow$ status changes to `quotation`.
- Click "Confirm Order" $\rightarrow$ status changes to `confirmed`.
- Click "Activate" $\rightarrow$ status changes to `active`.
- Click "Pause" $\rightarrow$ status changes to `paused`. Click "Resume" $\rightarrow$ status returns to `active`.

**Tip:**  
Point to the status badge color changing with each transition. It visually reinforces the state machine concept.

---

### [06:30 - 08:00] Section 6: Automated Billing, Discounts & Idempotency

**Say:**  
"Now comes the most important part of the entire system: recurring billing and automated invoices.

Before we trigger billing, let us create a promotional discount. As Administrator, we go to Discount Rules and create a '10% Seat Discount' for customers purchasing at least 5 seats, with a maximum usage limit of one time. Following our recent security review, only staff and administrators can attach discounts to subscriptions to prevent customer tampering. Staff attaches this discount to our 5-seat subscription.

Now let us look at the Dev Toolbar. In production, an automated background worker ticks every sixty seconds. But for testing and predictable demonstrations, our toolbar lets us simulate any billing date.

Today is October 31st. We select today's date and click 'Simulate Billing Day'.

Let us look at what the backend did in PostgreSQL:
It locked the active subscription using row-level locking with 'FOR UPDATE SKIP LOCKED'.
It calculated our subtotal: 5 seats times $1,560.00 equals $7,800.00.
It verified the discount rule: 5 seats meets the 5-seat minimum, and current uses is 0, which is under the limit of 1. It applied a 10% discount, saving the customer $780.00.
The taxable base is $7,800 minus $780, which is $7,020.00.
Our 18% GST tax on $7,020.00 is $1,263.60.
Adding the tax to the taxable base gives a grand total of exactly $8,283.60.

Now, watch what happens if I click 'Simulate Billing Day' a second time for the exact same date.
I click it. Look at the invoice count: zero new invoices were created. The discount usage count stayed at 1. And the subscription's next billing date safely advanced.
This is called **idempotency**. Because our database enforces a unique constraint on subscription ID and billing start date, double-billing is prevented completely, even if an operator double-clicks or two background jobs trigger at once."

**Show:**  
- Show the Discount Rule created (`10% Seat Discount`).
- Show the simulated date input set to today's date in the Dev Toolbar.
- Click "Simulate Billing Day".
- Switch to "Invoices" tab in `/workspace`. Show the generated invoice row with grand total `$8283.60`.
- Click "Simulate Billing Day" again.
- Show that no second invoice appears and the table row count remains identical.

**Tip:**  
Slow down when explaining the idempotency check. Judges love seeing database constraints prevent real-world financial errors.

---

### [07:00 - 08:00 (continued)] Section 6b: Discount Exhaustion Verification

**Say:**  
"Let us take it one step further. What happens next month when the customer gets billed again? Remember, our discount rule had a maximum usage limit of one.

Let us advance our simulated date forward by 35 days and click 'Simulate Billing Day'.
Let us refresh our Invoices table. Notice the new invoice that just appeared: the grand total is $9,204.00! Why? Because the discount rule reached its usage cap, so the full $7,800 subtotal was taxed at 18% ($1,404 tax), yielding $9,204.00 with zero discount applied. The engine tracked discount quota exhaustion perfectly."

**Show:**  
- Change date input in Dev Toolbar to +35 days in the future.
- Click "Simulate Billing Day".
- Refresh Invoices table and highlight the new invoice showing `$9204.00`.

---

### [08:00 - 09:00] Section 7: Invoice Lifecycle, Printable View & Payments

**Say:**  
"Now let us manage this invoice. Newly generated invoices start in 'Draft' status so billing teams can review them. 

Staff clicks 'Confirm'. The invoice transitions to Confirmed, and an official confirmation notice is immediately recorded in our outbox.

Now let us click 'Print Invoice'. Brightloop opens an official, printable tax invoice. It includes our company name, tax registration number (GSTIN), a line item table with seat quantities, the applied discount, tax breakdowns, and the payment terms. A business customer can directly print or save this as a PDF.

Now, how does payment work?
Let us test overpayment prevention: if someone attempts to record a payment of $99,000 against an $8,283 invoice, our backend immediately rejects it with a 400 Bad Request error. Payments cannot exceed the balance due.

Now let us record a legitimate partial payment. Staff selects payment method 'UPI', enters $2,000.00, and types a reference note. We click 'Apply Payment'.
Notice what happens: the invoice status remains 'Confirmed', but the paid column updates to $2,000.00, leaving an outstanding balance of $6,283.60.

Finally, the customer wires the rest. We click 'Record Payment', select 'Bank Transfer', and leave the amount defaulted to the exact remaining balance of $6,283.60. We submit the payment.
Instantly, the invoice status changes to 'Paid'. The full balance is settled."

**Show:**  
- Click "Confirm" on the invoice $\rightarrow$ status changes to `confirmed`.
- Click the "Print Invoice" icon. Show the clean HTML printable invoice popup with GSTIN, tables, and totals. Close popup.
- Click "Record Payment". Try entering `99999.00` $\rightarrow$ show validation error blocking the overpayment.
- Select `UPI`, amount `2000.00`, reference `UPI-REF-98214`, click "Apply Payment".
- Show invoice remaining `confirmed` with `$2000.00` paid.
- Click "Record Payment" again. Select `Bank Transfer`, amount `6283.60`. Submit.
- Show invoice status changing to green `PAID`.

**Tip:**  
Highlight that partial payments keep the invoice open and full payment automatically closes it. This matches real enterprise accounting workflows.

---

### [09:00 - 09:40] Section 8: Finance Telemetry & Customer Self-Service

**Say:**  
"Let us switch roles to our Finance Lead by clicking 'Finance' in the toolbar.
We arrive at the Financial Telemetry & Revenue Dashboard.

Here, company leadership can monitor key SaaS metrics in real time: Active Subscriptions count, Monthly Recurring Revenue (MRR), Collected Revenue, and Overdue Receivables. 

Notice how fast this dashboard loads. Even when we stress-tested the database with 2,500 active subscriptions using our bulk seeder, the aggregation query responded in just 0.86 seconds on our test machine, and status filtering took only 0.36 seconds.

Next, let us spend twenty seconds looking at the Customer Portal. We switch to our customer account. The customer sees their active subscriptions and their paid invoices. If they need to add extra capabilities, they can toggle add-on products like 24/7 Priority Support directly from the portal without having to call sales."

**Show:**  
- Click "Finance" on the Dev Toolbar.
- Show the KPI cards: Active Subscriptions, MRR, Collected Revenue, Overdue Receivables.
- Select filter "Status: Confirmed" and clear it, showing instantaneous table response.
- Click "Customer" on the toolbar. Show the Customer Portal (`/portal`).
- Show the customer's subscription card and toggle an add-on switch.

**Tip:**  
Quote the actual latency numbers (0.86s and 0.36s) rather than vague words like "fast".

---

### [09:40 - 10:00] Section 9: Honest Wrap-Up & Next Steps

**Say:**  
"To wrap up honestly: what you saw today is a working recurring billing engine with strict role-based access control, fixed-point math, Argon2id hashing, state machine constraints, and database-level idempotency.

What is simulated today? Customer payments are simulated locally rather than connected to live Stripe or Razorpay credit card networks. Our revenue trajectory chart visualizes collected totals using synthetic monthly distribution buckets, and password reset emails are delivered to an in-process database outbox rather than an external mail server.

For a commercial production launch, our next milestones are integrating certified payment gateways, adding IP rate limiting, and hashing password reset tokens with SHA-256.

Brightloop proves that subscription billing can be reliable, predictable, and exact. Thank you for watching!"

**Show:**  
- Return to the main workspace or README view.
- Smile and wave or display project repository link.

---

## Frequently Asked Questions (FAQ)

### Q1: Are customer credit card payments real?
**Answer**: No. Payments are simulated locally. The backend validates payment parameters, prevents overpayments, acquires row-level database locks, records transactions in PostgreSQL, and updates invoice balances. However, no communication takes place with external payment gateways like Stripe or Adyen. Customer payments are explicitly tagged as `payment_source = customer_simulated`.

### Q2: Why does the recurring billing engine use fixed-point decimals instead of standard numbers?
**Answer**: Standard IEEE 754 floating-point numbers in programming languages cannot accurately represent certain base-10 fractions (for example, `0.1 + 0.2` produces `0.30000000000000004`). In financial billing with hundreds of thousands of lines, these fractional cents accumulate into balancing discrepancies. We use `rust_decimal::Decimal` (128-bit fixed-point) to ensure exact cent-for-cent precision.

### Q3: What happens if two billing servers run simultaneously?
**Answer**: PostgreSQL handles this through two layers of protection:
1. `SELECT ... FOR UPDATE SKIP LOCKED` ensures that if worker A is currently processing a subscription row, worker B skips it rather than blocking or double-processing.
2. Even if two workers process the same subscription, the unique database constraint `uq_sub_billing_start (subscription_id, billing_period_start)` rejects the second insert, resulting in zero duplicate invoices.

### Q4: How does Brightloop prevent date drift on monthly subscriptions?
**Answer**: Naive billing systems add 30 days to the previous date, causing a subscription starting on January 31st to drift backwards across February, March, and April. Brightloop uses anchored date arithmetic with `chrono::Months`. The calculation preserves the original anchor day (the 31st): January 31 clamps to February 28, but snaps back to March 31 and May 31.

### Q5: Is the Dev Time-Travel Toolbar accessible in production?
**Answer**: No. The toolbar is conditionally rendered in React via `import.meta.env.DEV`. In production builds (`npm run build`), Vite completely strips the component code from the client bundle. Furthermore, the backend endpoints for bulk seeding and email outbox inspection enforce `APP_ENV=development` and return `404 Not Found` in production mode.
