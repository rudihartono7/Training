# Definition of done for PaymentLab (Windows PowerShell).
#
#   .\scripts\verify.ps1
#   .\scripts\verify.ps1 -Scope backend
#   .\scripts\verify.ps1 -Scope frontend

param(
    [ValidateSet('all', 'backend', 'frontend')]
    [string]$Scope = 'all'
)

$ErrorActionPreference = 'Continue'
Set-Location (Join-Path $PSScriptRoot '..')

$failures = @()

function Invoke-Step {
    param([string]$Label, [scriptblock]$Action)

    Write-Host ''
    Write-Host "=== $Label ==="
    & $Action
    if ($LASTEXITCODE -ne 0) {
        Write-Host "--- $Label FAILED"
        $script:failures += $Label
    }
    else {
        Write-Host "--- $Label OK"
    }
}

if ($Scope -in @('all', 'backend')) {
    if (Get-Command dotnet -ErrorAction SilentlyContinue) {
        Invoke-Step 'backend tests' { dotnet test backend/PaymentLab.sln --nologo }
    }
    else {
        Write-Host 'dotnet not found on PATH - install the .NET 8 SDK (see labs/LAB-0-setup.md)'
        $failures += 'backend tests (dotnet missing)'
    }
}

if ($Scope -in @('all', 'frontend')) {
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        Invoke-Step 'frontend tests' { npm --prefix frontend test }
        Invoke-Step 'frontend typecheck + build' { npm --prefix frontend run build }
    }
    else {
        Write-Host 'npm not found on PATH - install Node 20+ (see labs/LAB-0-setup.md)'
        $failures += 'frontend (npm missing)'
    }
}

Write-Host ''
Write-Host '==============================================='
if ($failures.Count -eq 0) {
    Write-Host '  VERIFY PASSED'
    Write-Host '==============================================='
    exit 0
}

Write-Host '  VERIFY FAILED:'
$failures | ForEach-Object { Write-Host "    - $_" }
Write-Host '==============================================='
exit 1
