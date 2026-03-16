# 1. Datei-Pfade definieren
$pageFile = "app/job/[id]/page.tsx"

Write-Host "--- SCHRITT 1: Code für Build vorbereiten ---" -ForegroundColor Yellow
(Get-Content -LiteralPath $pageFile) -replace 'dynamicParams = true', 'dynamicParams = false' | Set-Content -LiteralPath $pageFile

# 2. Den Next.js Build ausführen
Write-Host "--- SCHRITT 2: Next.js Build startet ---" -ForegroundColor Yellow
npm run build

# Prüfung ob Build erfolgreich war
if ($LASTEXITCODE -ne 0) {
    Write-Host "!!! BUILD FEHLGESCHLAGEN !!!" -ForegroundColor Red
    # Zurücksetzen, damit du lokal weiterarbeiten kannst
    (Get-Content -LiteralPath $pageFile) -replace 'dynamicParams = false', 'dynamicParams = true' | Set-Content -LiteralPath $pageFile
    exit
}

# 3. Wert sofort wieder zurück auf true setzen
Write-Host "--- SCHRITT 3: Code für Lokal-Modus zurücksetzen ---" -ForegroundColor Yellow
(Get-Content -LiteralPath $pageFile) -replace 'dynamicParams = false', 'dynamicParams = true' | Set-Content -LiteralPath $pageFile

# 4. Git Push
Write-Host "--- SCHRITT 4: Upload zu GitHub ---" -ForegroundColor Yellow
git add .
git commit -m "Auto-Deploy: Build & Export $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git push

Write-Host "---"
Write-Host "MISSION ERFÜLLT!" -ForegroundColor Cyan
Write-Host "Build erfolgreich, Code wieder im Lokal-Modus, GitHub aktualisiert." -ForegroundColor Green