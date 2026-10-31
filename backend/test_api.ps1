$ErrorActionPreference = "Continue"

Write-Host "=== 1. Health Check ==="
$health = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method Get
Write-Host "Status:" $health.status ", DB:" $health.postgres

Write-Host "`n=== 2. Password Complexity Tests ==="
# Test < 8 chars
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/auth/signup" -Method Post -ContentType "application/json" -Body '{"email":"test1@brightloop.io","password":"Short1!"}'
} catch {
    Write-Host "Expected rejection (<8 chars):" $_.ErrorDetails.Message
}

# Test no uppercase
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/auth/signup" -Method Post -ContentType "application/json" -Body '{"email":"test2@brightloop.io","password":"nouppercase123!"}'
} catch {
    Write-Host "Expected rejection (no uppercase):" $_.ErrorDetails.Message
}

# Test no lowercase
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/auth/signup" -Method Post -ContentType "application/json" -Body '{"email":"test3@brightloop.io","password":"NOLOWERCASE123!"}'
} catch {
    Write-Host "Expected rejection (no lowercase):" $_.ErrorDetails.Message
}

# Test no special char
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/auth/signup" -Method Post -ContentType "application/json" -Body '{"email":"test4@brightloop.io","password":"NoSpecialChar123"}'
} catch {
    Write-Host "Expected rejection (no special char):" $_.ErrorDetails.Message
}

Write-Host "`n=== 3. Admin Login & RBAC Checks ==="
$adminLogin = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"admin@brightloop.io","password":"Admin@Brightloop2026!"}'
Write-Host "Admin Login successful! Token received length:" $adminLogin.token.Length
$adminToken = $adminLogin.token

$adminMe = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
Write-Host "Admin User ID:" $adminMe.id "Role:" $adminMe.role

Write-Host "`n=== 4. Catalogue Retrieval with Auth ==="
$products = Invoke-RestMethod -Uri "http://localhost:3000/api/products" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
Write-Host "Products loaded:" $products.Count "- First:" $products[0].product.name "(Type:" $products[0].product.product_type ")"
Write-Host "Product Variants for first product:" $products[0].variants.Count "- Extra: $" $products[0].variants[0].price_extra

$plans = Invoke-RestMethod -Uri "http://localhost:3000/api/plans" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
Write-Host "Plans loaded:" $plans.Count "- First:" $plans[0].name "Price: $" $plans[0].plan_price

$taxes = Invoke-RestMethod -Uri "http://localhost:3000/api/tax-rules" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
Write-Host "Tax Rules loaded:" $taxes.Count "- First:" $taxes[0].name "Rate:" $taxes[0].rate_percentage "%"

$discounts = Invoke-RestMethod -Uri "http://localhost:3000/api/discount-rules" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
Write-Host "Discount Rules loaded:" $discounts.Count "- First:" $discounts[0].name "Value:" $discounts[0].value

Write-Host "`n=== 5. Subscription Creation & Verification ==="
$subBody = @{
    customer_id = $adminMe.id
    plan_id = $plans[0].id
    payment_terms_days = 30
    lines = @(
        @{
            product_id = $products[0].product.id
            variant_id = $products[0].variants[0].id
            quantity = 2
            unit_price = [decimal]1200.00
            tax_rate = [decimal]18.00
        }
    )
} | ConvertTo-Json -Depth 5

$newSub = Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions" -Method Post -Headers @{ Authorization = "Bearer $adminToken" } -ContentType "application/json" -Body $subBody
Write-Host "Created Subscription:" $newSub.subscription.sub_number "Status:" $newSub.subscription.status "ID:" $newSub.subscription.id
Write-Host "Subscription Lines count:" $newSub.lines.Count "Line total: $" $newSub.lines[0].line_total

Write-Host "`n=== 6. Invoice Creation & Double-Billing Protection Test ==="
$invBody = @{
    subscription_id = $newSub.subscription.id
    customer_id = $adminMe.id
    billing_period_start = "2026-11-01"
    billing_period_end = "2026-11-30"
    subtotal = [decimal]2400.00
    discount_amount = [decimal]0.00
    tax_amount = [decimal]432.00
    grand_total = [decimal]2832.00
    due_date = "2026-11-15"
    lines = @(
        @{
            product_id = $products[0].product.id
            variant_id = $products[0].variants[0].id
            quantity = 2
            unit_price = [decimal]1200.00
            tax_rate = [decimal]18.00
            line_total = [decimal]2400.00
        }
    )
} | ConvertTo-Json -Depth 5

$newInv = Invoke-RestMethod -Uri "http://localhost:3000/api/invoices" -Method Post -Headers @{ Authorization = "Bearer $adminToken" } -ContentType "application/json" -Body $invBody
Write-Host "Created Invoice:" $newInv.invoice.invoice_number "Total: $" $newInv.invoice.grand_total "Status:" $newInv.invoice.status

# Now test duplicate billing for the SAME period & SAME subscription:
Write-Host "Attempting duplicate billing for same subscription and period..."
try {
    $dupInv = Invoke-RestMethod -Uri "http://localhost:3000/api/invoices" -Method Post -Headers @{ Authorization = "Bearer $adminToken" } -ContentType "application/json" -Body $invBody
    Write-Host "Error: Duplicate invoice was unexpectedly allowed!"
} catch {
    Write-Host "Successfully prevented double-billing! Constraint blocked duplicate with 409 Conflict:" $_.ErrorDetails.Message
}
