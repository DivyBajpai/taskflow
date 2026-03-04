# Production Build and Deployment Script for cPanel

# Build Frontend
Write-Host "Building frontend..." -ForegroundColor Green
Set-Location frontend

# Check if .env.production exists, if not, warn user
if (!(Test-Path ".env.production")) {
    Write-Host "⚠️  WARNING: .env.production not found! Using defaults." -ForegroundColor Yellow
    Write-Host "    Create .env.production with your domain settings for optimal results." -ForegroundColor Yellow
}

npm install
npm run build

# Create public directory in backend
Write-Host "Setting up backend public directory..." -ForegroundColor Green
Set-Location ../backend
if (!(Test-Path "public")) {
    New-Item -ItemType Directory -Path "public"
}

# Copy frontend build to backend public
Write-Host "Copying frontend build to backend..." -ForegroundColor Green
Copy-Item -Path "../frontend/dist/*" -Destination "public/" -Recurse -Force

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Green
npm install --production

Write-Host "`nBuild complete! Ready for cPanel deployment." -ForegroundColor Cyan
Write-Host "Files to upload to cPanel:" -ForegroundColor Yellow
Write-Host "  - backend/ folder (including new public/ directory)" -ForegroundColor White
Write-Host "  - .env file (with production settings)" -ForegroundColor White
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Upload backend/ folder to your cPanel application root" -ForegroundColor White
Write-Host "  2. Configure environment variables in cPanel" -ForegroundColor White
Write-Host "  3. Run 'npm install' in cPanel terminal or Node.js App interface" -ForegroundColor White
Write-Host "  4. Start/Restart your Node.js application" -ForegroundColor White
Write-Host "`nSee CPANEL_DEPLOYMENT_GUIDE.md for detailed instructions." -ForegroundColor Cyan

Set-Location ..
