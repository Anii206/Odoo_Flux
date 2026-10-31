$ErrorActionPreference = "Stop"

function Test-Assert($condition, $message) {
    if (-not $condition) {
        Write-Error "ASSERTION FAILED: $message"
        exit 1
    } else {
        Write-Host " [PASS] $message" -ForegroundColor Green
    }
}

Write-Host "`n=== BRIGHTLOOP STEP 3 VERIFICATION SUITE ===" -ForegroundColor Cyan

# 1. Admin Login
$loginBody = @{
    email = "admin@brightloop.io"
    password = "Admin@Brightloop2026!"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$adminToken = $loginRes.token
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
Test-Assert ($adminToken.Length -gt 20) "Admin login succeeded with JWT token."

# 2. Setup Customer & Catalog for Billing Cycle
$customerEmail = "billing_client_$(Get-Random)@brightloop.io"
$signupBody = @{ email = $customerEmail; password = "Customer@Secure2026!" } | ConvertTo-Json
$signupRes = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/signup" -Method Post -Body $signupBody -ContentType "application/json"
$customerId = $signupRes.user.id
$customerHeaders = @{ Authorization = "Bearer $($signupRes.token)" }

# Product & Variant (Brand=Odoo adds +560)
$prodBody = @{
    name = "Brightloop ERP Cloud"
    product_type = "software"
    sales_price = "1000.00"
    cost_price = "200.00"
} | ConvertTo-Json
$prodRes = Invoke-RestMethod -Uri "http://localhost:3000/api/products" -Method Post -Headers $adminHeaders -Body $prodBody -ContentType "application/json"
$prodId = $prodRes.product.id

$varBody = @{ attribute_name = "Brand"; attribute_value = "Odoo"; price_extra = "560.00" } | ConvertTo-Json
$varRes = Invoke-RestMethod -Uri "http://localhost:3000/api/products/$prodId/variants" -Method Post -Headers $adminHeaders -Body $varBody -ContentType "application/json"
$varId = $varRes.id

# Active Tax Rule (18%)
$taxBody = @{ name = "GST 18%"; rate_percentage = "18.00"; is_active = $true } | ConvertTo-Json
$taxRes = Invoke-RestMethod -Uri "http://localhost:3000/api/taxes" -Method Post -Headers $adminHeaders -Body $taxBody -ContentType "application/json"
Test-Assert ($taxRes.rate_percentage -eq "18.00") "Active 18% Tax Rule configured."

# Active Discount Rule (10% on whole subscription)
$today = (Get-Date).ToString("yyyy-MM-dd")
$discBody = @{
    name = "BillingRunDiscount"
    discount_type = "percentage"
    value = "10.00"
    min_purchase_amount = "100.00"
    min_quantity = 1
    start_date = (Get-Date).AddDays(-10).ToString("yyyy-MM-dd")
    end_date = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
    max_uses = 5
    applies_to = "all"
} | ConvertTo-Json
$discRes = Invoke-RestMethod -Uri "http://localhost:3000/api/discounts" -Method Post -Headers $adminHeaders -Body $discBody -ContentType "application/json"
$discId = $discRes.id

# Standard Monthly Plan
$planBody = @{
    name = "Standard Monthly SaaS"
    billing_interval = "monthly"
    plan_price = "1560.00"
    min_quantity = 1
    available_from = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")
    auto_close = $false
    allow_early_close = $true
    allow_pause = $true
    allow_renew = $true
} | ConvertTo-Json
$planRes = Invoke-RestMethod -Uri "http://localhost:3000/api/plans" -Method Post -Headers $adminHeaders -Body $planBody -ContentType "application/json"
$planId = $planRes.id

# Auto-Close Expiring Plan
$autoClosePlanBody = @{
    name = "Trial 30-Day AutoClose"
    billing_interval = "monthly"
    plan_price = "100.00"
    min_quantity = 1
    available_from = (Get-Date).AddDays(-60).ToString("yyyy-MM-dd")
    auto_close = $true
    allow_early_close = $true
    allow_pause = $true
    allow_renew = $false
} | ConvertTo-Json
$autoClosePlanRes = Invoke-RestMethod -Uri "http://localhost:3000/api/plans" -Method Post -Headers $adminHeaders -Body $autoClosePlanBody -ContentType "application/json"
$autoClosePlanId = $autoClosePlanRes.id

# Active Subscription 1 (Ready to be billed today)
$sub1Body = @{
    customer_id = $customerId
    plan_id = $planId
    applied_discount_id = $discId
    next_billing_date = $today
    lines = @(
        @{
            product_id = $prodId
            variant_id = $varId
            quantity = 1
            unit_price = "1560.00"
            tax_rate = "18.00"
        }
    )
} | ConvertTo-Json
$sub1Res = Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions" -Method Post -Headers $adminHeaders -Body $sub1Body -ContentType "application/json"
$sub1Id = $sub1Res.subscription.id

# Move Sub 1 to active and set next_billing_date to today
Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions/$sub1Id/status" -Method Patch -Headers $adminHeaders -Body (@{ status = "quotation" } | ConvertTo-Json) -ContentType "application/json" | Out-Null
Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions/$sub1Id/status" -Method Patch -Headers $adminHeaders -Body (@{ status = "confirmed" } | ConvertTo-Json) -ContentType "application/json" | Out-Null
Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions/$sub1Id/status" -Method Patch -Headers $adminHeaders -Body (@{ status = "active" } | ConvertTo-Json) -ContentType "application/json" | Out-Null

# Active Subscription 2 (Expired Trial with auto_close = true)
$sub2Body = @{
    customer_id = $customerId
    plan_id = $autoClosePlanId
    expiry_date = $today
    next_billing_date = $today
    lines = @(
        @{
            product_id = $prodId
            quantity = 1
            unit_price = "100.00"
        }
    )
} | ConvertTo-Json
$sub2Res = Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions" -Method Post -Headers $adminHeaders -Body $sub2Body -ContentType "application/json"
$sub2Id = $sub2Res.subscription.id
Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions/$sub2Id/status" -Method Patch -Headers $adminHeaders -Body (@{ status = "quotation" } | ConvertTo-Json) -ContentType "application/json" | Out-Null
Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions/$sub2Id/status" -Method Patch -Headers $adminHeaders -Body (@{ status = "confirmed" } | ConvertTo-Json) -ContentType "application/json" | Out-Null
Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions/$sub2Id/status" -Method Patch -Headers $adminHeaders -Body (@{ status = "active" } | ConvertTo-Json) -ContentType "application/json" | Out-Null

# 3. Trigger Billing Run (POST /api/billing/run)
$billingRunBody = @{ target_date = $today } | ConvertTo-Json
$billingRes = Invoke-RestMethod -Uri "http://localhost:3000/api/billing/run" -Method Post -Headers $adminHeaders -Body $billingRunBody -ContentType "application/json"

Test-Assert ($billingRes.subscriptions_scanned -ge 1) "Billing engine scanned active subscriptions due on $today"
Test-Assert ($billingRes.invoices_generated -ge 1) "In-process billing engine generated draft invoice(s)"
Write-Host " [INFO] Billing Result: $($billingRes | ConvertTo-Json -Compress)"

# Verify Deduplication (ON CONFLICT DO NOTHING)
$dedupRes = Invoke-RestMethod -Uri "http://localhost:3000/api/billing/run" -Method Post -Headers $adminHeaders -Body $billingRunBody -ContentType "application/json"
Test-Assert ($dedupRes.invoices_generated -eq 0) "Deduplication guarantee: Second billing run on same date generated 0 duplicate invoices."

# 4. Fetch the generated Invoice & Verify Calculations
$invoices = Invoke-RestMethod -Uri "http://localhost:3000/api/invoices" -Method Get -Headers $adminHeaders
$targetInvoice = $invoices | Where-Object { $_.invoice.subscription_id -eq $sub1Id } | Select-Object -First 1
$inv = $targetInvoice.invoice
$invId = $inv.id

Test-Assert ($inv.status -eq "draft") "Generated invoice created in 'draft' status"
Test-Assert ([decimal]$inv.subtotal -eq 1560.00) "Invoice subtotal correctly computed: $($inv.subtotal)"
Test-Assert ([decimal]$inv.discount_amount -gt 0) "Discount rule applied to invoice: $($inv.discount_amount)"
Test-Assert ([decimal]$inv.tax_amount -gt 0) "Tax calculated from active tax rules: $($inv.tax_amount)"

# 5. Invoice Status Transition & Local Outbox Email Trigger
$confirmBody = @{ status = "confirmed" } | ConvertTo-Json
$confirmedRes = Invoke-RestMethod -Uri "http://localhost:3000/api/invoices/$invId/status" -Method Patch -Headers $adminHeaders -Body $confirmBody -ContentType "application/json"
Test-Assert ($confirmedRes.invoice.status -eq "confirmed") "Invoice status moved from draft -> confirmed"

# Verify email logged in local_emails table (zero SaaS SMTP dependency!)
$emails = Invoke-RestMethod -Uri "http://localhost:3000/api/dev/emails" -Method Get
$invoiceEmail = $emails | Where-Object { $_.subject -match $inv.invoice_number } | Select-Object -First 1
Test-Assert ($invoiceEmail -ne $null) "Invoice confirmation email recorded in self-hosted local_emails outbox"

# 6. Self-Hosted Printable HTML / PDF (GET /api/invoices/{id}/print)
$printHtml = Invoke-RestMethod -Uri "http://localhost:3000/api/invoices/$invId/print" -Method Get -Headers $adminHeaders
Test-Assert ($printHtml -match "OFFICIAL TAX INVOICE") "Printable document contains official tax invoice header"
Test-Assert ($printHtml -match "@media print") "Printable document includes @media print stylesheet"
Test-Assert ($printHtml -match $inv.invoice_number) "Printable document contains invoice number $($inv.invoice_number)"

# 7. Payment Recording & Automatic Paid Transition
$partialAmount = [math]::Floor([decimal]$inv.grand_total / 2)
$pay1Body = @{
    payment_method = "bank_transfer"
    amount = "$partialAmount.00"
    note = "Partial wire payment"
} | ConvertTo-Json
$pay1Res = Invoke-RestMethod -Uri "http://localhost:3000/api/invoices/$invId/payments" -Method Post -Headers $adminHeaders -Body $pay1Body -ContentType "application/json"
Test-Assert ($pay1Res.invoice.status -eq "confirmed") "After partial payment, invoice remains 'confirmed'"
Test-Assert ([decimal]$pay1Res.invoice.amount_paid -eq $partialAmount) "Invoice amount_paid updated to $partialAmount"

# Pay Remaining Balance
$remaining = [decimal]$inv.grand_total - [decimal]$pay1Res.invoice.amount_paid
$pay2Body = @{
    payment_method = "upi"
    amount = "$remaining"
    note = "Final balance clearance"
} | ConvertTo-Json
$pay2Res = Invoke-RestMethod -Uri "http://localhost:3000/api/invoices/$invId/payments" -Method Post -Headers $adminHeaders -Body $pay2Body -ContentType "application/json"
Test-Assert ($pay2Res.invoice.status -eq "paid") "When amount_paid >= grand_total, invoice automatically marked 'paid'"

# List payments for invoice
$paymentsList = Invoke-RestMethod -Uri "http://localhost:3000/api/invoices/$invId/payments" -Method Get -Headers $adminHeaders
Test-Assert ($paymentsList.Count -eq 2) "Invoice payments history contains both payment records"

# 8. High-Performance Bulk Seeder (POST /api/dev/seed)
Write-Host "`n [BENCHMARK] Executing Bulk Seeder for 2,500 Subscriptions & Invoices..." -ForegroundColor Yellow
$seedRes = Invoke-RestMethod -Uri "http://localhost:3000/api/dev/seed" -Method Post
Write-Host " [BENCHMARK] Result: $($seedRes.subscriptions_seeded) subscriptions bulk-inserted in $($seedRes.elapsed_ms)ms" -ForegroundColor Yellow
Test-Assert ($seedRes.subscriptions_seeded -eq 2500) "Bulk seeder inserted 2,500 subscriptions"
Test-Assert ($seedRes.elapsed_ms -lt 1000) "Performance requirement met: 2,500 rows inserted in under 1 second ($($seedRes.elapsed_ms)ms)"

# 9. Sub-2-Second Finance Analytics Dashboard (GET /api/finance/dashboard)
Write-Host "`n [BENCHMARK] Testing Finance Dashboard Response Time..." -ForegroundColor Yellow
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$dash = Invoke-RestMethod -Uri "http://localhost:3000/api/finance/dashboard" -Method Get -Headers $adminHeaders
$sw.Stop()
$dashboardMs = $sw.ElapsedMilliseconds

Write-Host " [BENCHMARK] Finance Dashboard query executed in ${dashboardMs}ms (< 2,000ms SLA)" -ForegroundColor Yellow
Test-Assert ($dashboardMs -lt 2000) "Finance dashboard response time is sub-2-second (${dashboardMs}ms)"
Test-Assert ($dash.metrics.active_subscriptions_count -ge 2500) "Dashboard shows active_subscriptions_count >= 2,500: $($dash.metrics.active_subscriptions_count)"
Test-Assert ([decimal]$dash.metrics.mrr -gt 0) "Dashboard computed Monthly Recurring Revenue (MRR): $($dash.metrics.mrr)"
Test-Assert ([decimal]$dash.metrics.arr -gt 0) "Dashboard computed Annual Recurring Revenue (ARR): $($dash.metrics.arr)"
Test-Assert ([decimal]$dash.metrics.collected_revenue -gt 0) "Dashboard computed collected_revenue: $($dash.metrics.collected_revenue)"
Test-Assert ([decimal]$dash.metrics.outstanding_revenue -gt 0) "Dashboard computed outstanding_revenue: $($dash.metrics.outstanding_revenue)"
Test-Assert ($dash.overdue_invoices.Count -gt 0) "Dashboard returned paginated overdue invoices: $($dash.overdue_invoices.Count) items"

Write-Host "`n ALL STEP 3 VERIFICATIONS PASSED SUCCESSFULLY WITH SUB-2S PERFORMANCE!" -ForegroundColor Cyan
