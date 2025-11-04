# Backend Cleanup Script
# Removes old/duplicate/unused files

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TCC-CRM Backend Cleanup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = "c:\Users\HomePC\Documents\TCC FILES\TCC-CRM\Codebase\codes\backend"
Set-Location $backendPath

# Backup confirmation
Write-Host "⚠️  This script will DELETE the following:" -ForegroundColor Yellow
Write-Host "   - server.js (old server file)" -ForegroundColor Yellow
Write-Host "   - /services/ (duplicate directory)" -ForegroundColor Yellow
Write-Host "   - /old_code/ (empty directory)" -ForegroundColor Yellow
Write-Host "   - /src/routes/ (if empty)" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Do you want to continue? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Cleanup cancelled" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Starting cleanup..." -ForegroundColor Green
Write-Host ""

# Function to safely remove file/directory
function Safe-Remove {
    param($Path, $Description)
    
    if (Test-Path $Path) {
        try {
            Remove-Item $Path -Recurse -Force
            Write-Host "✅ Removed: $Description" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "❌ Failed to remove: $Description - $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "⏭️  Skipped: $Description (not found)" -ForegroundColor Yellow
        return $false
    }
}

# Track statistics
$filesRemoved = 0
$spaceFreed = 0

# 1. Remove old server.js
Write-Host "🗑️  Removing old server file..." -ForegroundColor Cyan
if (Test-Path "server.js") {
    $fileSize = (Get-Item "server.js").Length
    if (Safe-Remove "server.js" "server.js (old server file)") {
        $filesRemoved++
        $spaceFreed += $fileSize
    }
}

# 2. Remove duplicate services directory
Write-Host "🗑️  Removing duplicate services directory..." -ForegroundColor Cyan
if (Test-Path "services") {
    $dirSize = (Get-ChildItem "services" -Recurse | Measure-Object -Property Length -Sum).Sum
    if (Safe-Remove "services" "/services/ (duplicate directory)") {
        $filesRemoved++
        $spaceFreed += $dirSize
    }
}

# 3. Remove empty old_code directory
Write-Host "🗑️  Removing empty old_code directory..." -ForegroundColor Cyan
if (Test-Path "old_code") {
    if ((Get-ChildItem "old_code" -Recurse).Count -eq 0) {
        if (Safe-Remove "old_code" "/old_code/ (empty directory)") {
            $filesRemoved++
        }
    } else {
        Write-Host "⚠️  old_code/ is not empty, skipping..." -ForegroundColor Yellow
    }
}

# 4. Remove unused src/routes if empty
Write-Host "🗑️  Checking src/routes directory..." -ForegroundColor Cyan
if (Test-Path "src\routes") {
    $routeFiles = Get-ChildItem "src\routes" -File
    if ($routeFiles.Count -eq 0) {
        if (Safe-Remove "src\routes" "/src/routes/ (empty directory)") {
            $filesRemoved++
        }
    } else {
        Write-Host "⚠️  src/routes/ contains files, keeping it..." -ForegroundColor Yellow
        Get-ChildItem "src\routes" -File | ForEach-Object {
            Write-Host "     - $($_.Name)" -ForegroundColor Gray
        }
    }
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Files/Directories Removed: $filesRemoved" -ForegroundColor Green
Write-Host "Approximate Space Freed: $('{0:N2}' -f ($spaceFreed / 1KB)) KB" -ForegroundColor Green
Write-Host ""

# Verify critical files still exist
Write-Host "Verifying critical files..." -ForegroundColor Cyan
$criticalFiles = @(
    "src\index.js",
    "src\config\index.js",
    "src\api\routes\businessLogic.js",
    "src\services\guestTrackingService.js",
    "src\services\checkInService.js",
    "src\services\donationVerificationService.js",
    "src\services\communicationService.js",
    "package.json",
    "jest.config.js"
)

$allGood = $true
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file MISSING!" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""
if ($allGood) {
    Write-Host "✅ All critical files verified!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run 'npm test' to verify everything still works" -ForegroundColor White
    Write-Host "2. Test the server with 'npm run dev'" -ForegroundColor White
    Write-Host "3. Check git status and commit cleanup changes" -ForegroundColor White
} else {
    Write-Host "❌ Some critical files are missing! Please investigate." -ForegroundColor Red
}

Write-Host ""
