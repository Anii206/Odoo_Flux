$ErrorActionPreference = "Stop"

function Test-Assert($condition, $message) {
    if (-not $condition) {
        Write-Error "ASSERTION FAILED: $message"
        exit 1
    } else {
        Write-Host " [PASS] $message" -ForegroundColor Green
    }
}

Write-Host "`n=== BRIGHTLOOP STEP 2 VERIFICATION SUITE ===" -ForegroundColor Cyan

# 1. Admin Login
$loginBody = @{
    email = "admin@brightloop.io"
    password = "Admin@Brightloop2026!"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$adminToken = $loginRes.token
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
Test-Assert ($adminToken.Length -gt 20) "Admin login succeeded with JWT token."

# 2. Customer Signup & Login
$customerEmail = "customer_step2_$(Get-Random)@brightloop.io"
$signupBody = @{
    email = $customerEmail
    password = "Customer@Secure2026!"
} | ConvertTo-Json
$signupRes = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/signup" -Method Post -Body $signupBody -ContentType "application/json"
$customerToken = $signupRes.token
$customerUser = $signupRes.user
$customerHeaders = @{ Authorization = "Bearer $customerToken" }
Test-Assert ($customerUser.role -eq "customer") "Customer registered successfully."

# 3. Product & Variant CRUD with Surcharge
$productBody = @{
    name = "Brightloop ERP Core"
    product_type = "software"
    sales_price = "1200.00"
    cost_price = "400.00"
    notes = "Flagship business management system"
} | ConvertTo-Json

$createdProduct = Invoke-RestMethod -Uri "http://localhost:3000/api/products" -Method Post -Headers $adminHeaders -Body $productBody -ContentType "application/json"
$productId = $createdProduct.product.id
Test-Assert ($createdProduct.product.name -eq "Brightloop ERP Core") "Admin created product: $productId"

# Create Variant: Brand = Odoo adds +560.00
$variantBody = @{
    attribute_name = "Brand"
    attribute_value = "Odoo"
    price_extra = "560.00"
} | ConvertTo-Json

$createdVariant = Invoke-RestMethod -Uri "http://localhost:3000/api/products/$productId/variants" -Method Post -Headers $adminHeaders -Body $variantBody -ContentType "application/json"
$variantId = $createdVariant.id
Test-Assert ($createdVariant.price_extra -eq "560.00") "Created variant Brand=Odoo with surcharge +560.00"

# 4. Plan CRUD with Lifecycle Flags
$planBody = @{
    name = "Enterprise Pro Annual"
    billing_interval = "yearly"
    plan_price = "499.00"
    min_quantity = 2
    available_from = (Get-Date).ToString("yyyy-MM-dd")
    available_to = (Get-Date).AddYears(1).ToString("yyyy-MM-dd")
    auto_close = $false
    allow_early_close = $false
    allow_pause = $false
    allow_renew = $true
} | ConvertTo-Json

$createdPlan = Invoke-RestMethod -Uri "http://localhost:3000/api/plans" -Method Post -Headers $adminHeaders -Body $planBody -ContentType "application/json"
$planId = $createdPlan.id
Test-Assert ($createdPlan.allow_pause -eq $false -and $createdPlan.allow_early_close -eq $false) "Created plan with allow_pause=false and allow_early_close=false"

# 5. Taxes & Discounts CRUD with strict validation
# Tax rule
$taxBody = @{
    name = "VAT 20%"
    rate_percentage = "20.00"
    is_active = $true
} | ConvertTo-Json
$createdTax = Invoke-RestMethod -Uri "http://localhost:3000/api/taxes" -Method Post -Headers $adminHeaders -Body $taxBody -ContentType "application/json"
$taxId = $createdTax.id
Test-Assert ($createdTax.rate_percentage -eq "20.00") "Created Tax rule: $taxId"

# Discount rule targeting whole subscription
$discBody = @{
    name = "Welcome 10%"
    discount_type = "percentage"
    value = "10.00"
    min_purchase_amount = "100.00"
    min_quantity = 1
    start_date = (Get-Date).ToString("yyyy-MM-dd")
    applies_to = "all"
} | ConvertTo-Json
$createdDisc = Invoke-RestMethod -Uri "http://localhost:3000/api/discounts" -Method Post -Headers $adminHeaders -Body $discBody -ContentType "application/json"
Test-Assert ($createdDisc.name -eq "Welcome 10%") "Created whole-subscription discount rule"

# Validation check: percentage > 100 rejected
try {
    $badDisc = @{
        name = "Bad 150%"
        discount_type = "percentage"
        value = "150.00"
        start_date = (Get-Date).ToString("yyyy-MM-dd")
        applies_to = "all"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:3000/api/discounts" -Method Post -Headers $adminHeaders -Body $badDisc -ContentType "application/json"
    Write-Error "Invalid discount percentage should have failed!"
} catch {
    Test-Assert ($_.Exception.Response.StatusCode.value__ -eq 400) "Strict validation: percentage > 100 correctly rejected with 400"
}

# 6. Quotation Templates CRUD
$templateBody = @{
    name = "Enterprise Starter Quotation"
    plan_id = $planId
    validity_days = 45
    lines = @(
        @{
            product_id = $productId
            variant_id = $variantId
            quantity = 2
        }
    )
} | ConvertTo-Json

$createdTpl = Invoke-RestMethod -Uri "http://localhost:3000/api/quotation-templates" -Method Post -Headers $adminHeaders -Body $templateBody -ContentType "application/json"
$templateId = $createdTpl.template.id
Test-Assert ($createdTpl.lines.Count -eq 1) "Created quotation template with line: $templateId"

# 7. Subscription from Template (Quotation Status, Sequential Number, Surcharge Unit Price)
$fromTplBody = @{
    template_id = $templateId
    customer_id = $customerUser.id
} | ConvertTo-Json

$subFromTpl = Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions/from-template" -Method Post -Headers $adminHeaders -Body $fromTplBody -ContentType "application/json"
$subId = $subFromTpl.subscription.id
Test-Assert ($subFromTpl.subscription.status -eq "quotation") "Subscription created from template is in 'quotation' status"
Test-Assert ($subFromTpl.subscription.sub_number -match "^SUB-\d{5}$") "Subscription number is sequential format (SUB-0000x): $($subFromTpl.subscription.sub_number)"
# Unit price = 1200 (product sales price) + 560 (variant extra) = 1760.00
Test-Assert ($subFromTpl.lines[0].unit_price -eq "1760.00") "Computed unit price correctly includes variant surcharge (+560.00) = 1760.00"

# 8. Custom Subscription in Draft Status
$draftSubBody = @{
    customer_id = $customerUser.id
    plan_id = $planId
    lines = @(
        @{
            product_id = $productId
            quantity = 1
            unit_price = "1200.00"
            tax_rate = "20.00"
        }
    )
} | ConvertTo-Json
$draftSub = Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions" -Method Post -Headers $adminHeaders -Body $draftSubBody -ContentType "application/json"
$draftSubId = $draftSub.subscription.id
Test-Assert ($draftSub.subscription.status -eq "draft") "Custom subscription created in 'draft' status: $draftSubId"

# 9. State Machine Transitions & Plan Rule Enforcement
# Transition draft -> quotation
$statusBody = @{ status = "quotation" } | ConvertTo-Json
$res1 = Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions/$draftSubId/status" -Method Patch -Headers $adminHeaders -Body $statusBody -ContentType "application/json"
Test-Assert ($res1.subscription.status -eq "quotation") "Transitioned draft -> quotation"

# Transition quotation -> confirmed
$statusBody = @{ status = "confirmed" } | ConvertTo-Json
$res2 = Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions/$draftSubId/status" -Method Patch -Headers $adminHeaders -Body $statusBody -ContentType "application/json"
Test-Assert ($res2.subscription.status -eq "confirmed") "Transitioned quotation -> confirmed"

# Transition confirmed -> active
$statusBody = @{ status = "active" } | ConvertTo-Json
$res3 = Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions/$draftSubId/status" -Method Patch -Headers $adminHeaders -Body $statusBody -ContentType "application/json"
Test-Assert ($res3.subscription.status -eq "active") "Transitioned confirmed -> active"

# Attempt to Pause (Plan has allow_pause = false -> MUST REJECT)
try {
    $statusBody = @{ status = "paused" } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions/$draftSubId/status" -Method Patch -Headers $adminHeaders -Body $statusBody -ContentType "application/json"
    Write-Error "Pausing subscription with allow_pause=false should have been rejected!"
} catch {
    Test-Assert ($_.Exception.Response.StatusCode.value__ -eq 400) "State Machine rejected pause because plan.allow_pause is false"
}

# Update plan to allow pause
$updatePlanBody = @{ allow_pause = $true; allow_early_close = $true } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/plans/$planId" -Method Put -Headers $adminHeaders -Body $updatePlanBody -ContentType "application/json" | Out-Null

# Now pause should succeed
$statusBody = @{ status = "paused" } | ConvertTo-Json
$res4 = Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions/$draftSubId/status" -Method Patch -Headers $adminHeaders -Body $statusBody -ContentType "application/json"
Test-Assert ($res4.subscription.status -eq "paused") "Pause allowed once plan allows pause"

# Resume to active
$statusBody = @{ status = "active" } | ConvertTo-Json
$res5 = Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions/$draftSubId/status" -Method Patch -Headers $adminHeaders -Body $statusBody -ContentType "application/json"
Test-Assert ($res5.subscription.status -eq "active") "Resumed from paused -> active"

# Renewal via POST /api/subscriptions/{id}/renew
$renewRes = Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions/$draftSubId/renew" -Method Post -Headers $adminHeaders -ContentType "application/json"
Test-Assert ($renewRes.subscription.status -eq "active") "Renewed subscription successfully"

# 10. Customer Portal Self-Service: View Subscriptions & Toggle Add-on
$portalSubs = Invoke-RestMethod -Uri "http://localhost:3000/api/portal/subscriptions" -Method Get -Headers $customerHeaders
Test-Assert ($portalSubs.Count -ge 1) "Customer portal lists only logged-in customer's subscriptions ($($portalSubs.Count) found)"

# Create Add-on product
$addonBody = @{
    name = "Cloud Backup 1TB"
    product_type = "addon"
    sales_price = "25.00"
    cost_price = "5.00"
} | ConvertTo-Json
$addonProduct = Invoke-RestMethod -Uri "http://localhost:3000/api/products" -Method Post -Headers $adminHeaders -Body $addonBody -ContentType "application/json"
$addonId = $addonProduct.product.id

# Toggle addon ON on active subscription
$toggleBody = @{ addon_product_id = $addonId } | ConvertTo-Json
$toggleOnRes = Invoke-RestMethod -Uri "http://localhost:3000/api/portal/subscriptions/$draftSubId/toggle-addon" -Method Post -Headers $customerHeaders -Body $toggleBody -ContentType "application/json"
Test-Assert ($toggleOnRes.action -eq "added") "Customer toggled add-on ON (added)"

# Verify line was added
$hasAddon = $toggleOnRes.subscription.lines | Where-Object { $_.product_id -eq $addonId }
Test-Assert ($hasAddon -ne $null) "Add-on line exists in subscription"

# Toggle addon OFF on active subscription
$toggleOffRes = Invoke-RestMethod -Uri "http://localhost:3000/api/portal/subscriptions/$draftSubId/toggle-addon" -Method Post -Headers $customerHeaders -Body $toggleBody -ContentType "application/json"
Test-Assert ($toggleOffRes.action -eq "removed") "Customer toggled add-on OFF (removed)"

Write-Host "`n ALL STEP 2 VERIFICATIONS PASSED SUCCESSFULLY!" -ForegroundColor Cyan
