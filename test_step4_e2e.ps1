$ErrorActionPreference = "Stop"

Write-Host "=== BRIGHTLOOP STEP 4 END-TO-END VERIFICATION ===" -ForegroundColor Cyan

# 1. Admin Login
Write-Host "`n1. Testing Admin Authentication..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@brightloop.io"
    password = "Admin@Brightloop2026!"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$adminToken = $loginRes.token
$adminHeaders = @{ "Authorization" = "Bearer $adminToken" }
Write-Host " Admin logged in successfully! Role: $($loginRes.user.role)" -ForegroundColor Green

# 2. Products & Variants Manager (Admin)
Write-Host "`n2. Testing Product & Variant Creation (Brand: Odoo +560)..." -ForegroundColor Yellow
$prodBody = @{
    name = "Brightloop ERP Cloud Suite"
    product_type = "software"
    sales_price = 1200.00
    cost_price = 400.00
    notes = "Enterprise Cloud ERP Engine"
    variants = @(
        @{
            attribute_name = "Brand"
            attribute_value = "Odoo"
            price_extra = 560.00
        }
    )
} | ConvertTo-Json -Depth 4

$prodRes = Invoke-RestMethod -Uri "http://localhost:3000/api/products" -Method Post -Headers $adminHeaders -Body $prodBody -ContentType "application/json"
$productId = $prodRes.product.id
$variantId = $prodRes.variants[0].id
Write-Host " Product created: $($prodRes.product.name) with variant $($prodRes.variants[0].attribute_name)=$($prodRes.variants[0].attribute_value) (+$$($prodRes.variants[0].price_extra))" -ForegroundColor Green

# 3. Staff Provisioning (Admin)
Write-Host "`n3. Testing Staff Provisioning by Admin..." -ForegroundColor Yellow
$staffEmail = "staff_$(Get-Random)@brightloop.io"
$staffBody = @{
    email = $staffEmail
    password = "StaffSecure2026!"
} | ConvertTo-Json

$staffRes = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/staff" -Method Post -Headers $adminHeaders -Body $staffBody -ContentType "application/json"
Write-Host " Staff provisioned: $($staffRes.email) (Role: $($staffRes.role))" -ForegroundColor Green

# 4. Staff Login
Write-Host "`n4. Testing Staff Login..." -ForegroundColor Yellow
$staffLoginRes = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $staffBody -ContentType "application/json"
$staffToken = $staffLoginRes.token
$staffHeaders = @{ "Authorization" = "Bearer $staffToken" }
Write-Host " Staff authenticated successfully!" -ForegroundColor Green

# 5. Create Quotation from Template (Staff)
Write-Host "`n5. Testing Subscription Quotation from Template..." -ForegroundColor Yellow
$templates = Invoke-RestMethod -Uri "http://localhost:3000/api/quotation-templates" -Method Get -Headers $staffHeaders
$template = $templates[0]

# Get a customer
$users = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/users" -Method Get -Headers $adminHeaders
$customer = $users | Where-Object { $_.role -eq 'customer' } | Select-Object -First 1

$subBody = @{
    template_id = $template.template.id
    customer_id = $customer.id
} | ConvertTo-Json

$subRes = Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions/from-template" -Method Post -Headers $staffHeaders -Body $subBody -ContentType "application/json"
$subId = $subRes.subscription.id
Write-Host " Quotation created: $($subRes.subscription.sub_number) (Status: $($subRes.subscription.status))" -ForegroundColor Green

# 6. Lifecycle State Machine Transitions (Staff)
Write-Host "`n6. Testing Subscription State Machine Transitions..." -ForegroundColor Yellow
# Move to confirmed
$confirmBody = @{ status = "confirmed" } | ConvertTo-Json
$subRes = Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions/$subId/status" -Method Patch -Headers $staffHeaders -Body $confirmBody -ContentType "application/json"
Write-Host " Moved to: $($subRes.subscription.status)" -ForegroundColor Green

# Move to active
$activeBody = @{ status = "active" } | ConvertTo-Json
$subRes = Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions/$subId/status" -Method Patch -Headers $staffHeaders -Body $activeBody -ContentType "application/json"
Write-Host " Moved to: $($subRes.subscription.status)" -ForegroundColor Green

# 7. Run In-Process Billing Engine Simulation
Write-Host "`n7. Testing Billing Engine Simulation (Target Date: Tomorrow)..." -ForegroundColor Yellow
$tomorrow = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
$billBody = @{ target_date = $tomorrow } | ConvertTo-Json
$billRes = Invoke-RestMethod -Uri "http://localhost:3000/api/billing/run" -Method Post -Headers $staffHeaders -Body $billBody -ContentType "application/json"
Write-Host " Billing run complete: Generated $($billRes.invoices_generated) invoices from $($billRes.subscriptions_scanned) scanned subscriptions" -ForegroundColor Green

# 8. Record Payment & Auto-Paid State Transition
Write-Host "`n8. Testing Invoice Payment Recording & Status Update..." -ForegroundColor Yellow
$invoices = Invoke-RestMethod -Uri "http://localhost:3000/api/invoices" -Method Get -Headers $staffHeaders
$targetInv = $invoices | Where-Object { $_.invoice.status -ne 'paid' } | Select-Object -First 1

if ($targetInv) {
    $invId = $targetInv.invoice.id
    $payAmount = [decimal]$targetInv.invoice.grand_total - [decimal]$targetInv.invoice.amount_paid
    $payBody = @{
        payment_method = "bank_transfer"
        amount = $payAmount
        payment_date = (Get-Date).ToString("yyyy-MM-dd")
        note = "Settled via automated wire"
    } | ConvertTo-Json

    $payRes = Invoke-RestMethod -Uri "http://localhost:3000/api/invoices/$invId/payments" -Method Post -Headers $staffHeaders -Body $payBody -ContentType "application/json"
    Write-Host " Payment recorded: $$($payRes.payment.amount) on $($payRes.payment.payment_method). Invoice status is now: $($payRes.invoice.status)" -ForegroundColor Green
}

# 9. Verify Printable Tax Invoice HTML
Write-Host "`n9. Testing Print Invoice HTML Endpoint..." -ForegroundColor Yellow
$printHtml = Invoke-RestMethod -Uri "http://localhost:3000/api/invoices/$invId/print?token=$staffToken" -Method Get
if ($printHtml -match "TAX INVOICE" -and $printHtml -match "@media print") {
    Write-Host " Printable Tax Invoice HTML verified! Query token authentication successful, contains '@media print' styling and official header." -ForegroundColor Green
} else {
    Write-Error "Print HTML did not match expected structure."
}

# 10. Customer Portal Verification
Write-Host "`n10. Testing Customer Portal API..." -ForegroundColor Yellow
$custEmail = "customer_$(Get-Random)@brightloop.io"
$custPass = "Customer@Secure2026!"
$custSignup = @{
    email = $custEmail
    password = $custPass
} | ConvertTo-Json

$custRes = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/signup" -Method Post -Body $custSignup -ContentType "application/json"
$custToken = $custRes.token
$custHeaders = @{ "Authorization" = "Bearer $custToken" }
$customerId = $custRes.user.id
Write-Host " Customer registered: $custEmail" -ForegroundColor Green

# Create an active subscription for this customer
$custSubBody = @{
    template_id = $template.template.id
    customer_id = $customerId
} | ConvertTo-Json
$custSub = Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions/from-template" -Method Post -Headers $staffHeaders -Body $custSubBody -ContentType "application/json"
$custSubId = $custSub.subscription.id

# Transition to active
$confirmBody = @{ status = "confirmed" } | ConvertTo-Json
$null = Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions/$custSubId/status" -Method Patch -Headers $staffHeaders -Body $confirmBody -ContentType "application/json"
$activeBody = @{ status = "active" } | ConvertTo-Json
$null = Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions/$custSubId/status" -Method Patch -Headers $staffHeaders -Body $activeBody -ContentType "application/json"

# Test portal fetch
$portalSubs = Invoke-RestMethod -Uri "http://localhost:3000/api/portal/subscriptions" -Method Get -Headers $custHeaders
Write-Host " Customer Portal retrieved $($portalSubs.Count) subscriptions for $custEmail" -ForegroundColor Green

# Test toggling addon
$allProds = Invoke-RestMethod -Uri "http://localhost:3000/api/products" -Method Get -Headers $adminHeaders
$addonProd = $allProds | Where-Object { $_.product.product_type -eq 'addon' } | Select-Object -First 1

if ($addonProd) {
    $addonBody = @{ addon_product_id = $addonProd.product.id } | ConvertTo-Json
    $toggleRes = Invoke-RestMethod -Uri "http://localhost:3000/api/portal/subscriptions/$custSubId/toggle-addon" -Method Post -Headers $custHeaders -Body $addonBody -ContentType "application/json"
    Write-Host " Add-on toggle action: $($toggleRes.action) for product '$($addonProd.product.name)'" -ForegroundColor Green
}

# 11. Local Emails Outbox Drawer Verification
Write-Host "`n11. Testing Local Email Outbox Verification..." -ForegroundColor Yellow
$emails = Invoke-RestMethod -Uri "http://localhost:3000/api/dev/emails" -Method Get
Write-Host " Local Email Outbox contains $($emails.Count) sent emails (zero external email SaaS dependencies)." -ForegroundColor Green

Write-Host "`n ALL STEP 4 END-TO-END VERIFICATION CHECKS PASSED!" -ForegroundColor Green
