# Initialize and run Python Backend
Write-Host "Starting Python Flask server on port 8000..." -ForegroundColor Cyan
Start-Process -NoNewWindow -FilePath "python" -ArgumentList "api/index.py"

# Initialize and run Next.js Frontend
Write-Host "Starting Next.js server on port 3000..." -ForegroundColor Cyan
npm run dev
