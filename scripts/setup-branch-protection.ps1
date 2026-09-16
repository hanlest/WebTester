# Requires: gh auth login (or GH_TOKEN with repo admin scope)
# Usage: .\scripts\setup-branch-protection.ps1 [-Branch master]

param(
  [string]$Branch = "master",
  [string]$Repo = "hanlest/WebTester"
)

$ErrorActionPreference = "Stop"

gh auth status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Error "GitHub CLI no autenticado. Ejecuta: gh auth login`nO define GH_TOKEN con permisos admin en el repo."
  exit 1
}

$body = @{
  required_status_checks = $null
  enforce_admins = $true
  required_pull_request_reviews = @{
    dismiss_stale_reviews = $true
    require_code_owner_reviews = $false
    required_approving_review_count = 1
  }
  restrictions = $null
  allow_force_pushes = $false
  allow_deletions = $false
  block_creations = $false
  required_linear_history = $false
} | ConvertTo-Json -Depth 5 -Compress

$body | gh api "repos/$Repo/branches/$Branch/protection" -X PUT --input -
if ($LASTEXITCODE -ne 0) {
  Write-Error "No se pudo aplicar la protección de rama."
  exit 1
}

Write-Host "Branch protection applied to $Repo ($Branch)."
Write-Host "  - PR required before merge"
Write-Host "  - 1 approving review required"
Write-Host "  - Admins cannot bypass (enforce_admins)"
Write-Host "  - Force push and branch deletion disabled"
