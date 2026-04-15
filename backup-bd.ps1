# Script para hacer backup de la base de datos PostgreSQL local
# Necesita estar ejecutado como administrador o tener permisos

Write-Host "Realizando backup de la base de datos..." -ForegroundColor Green

$backupDir = "c:\Users\juand\gestion-cocteles\backups"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = "$backupDir\cocteles_db_backup_$timestamp.sql"

# Crear carpeta de backups si no existe
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "Carpeta de backups creada" -ForegroundColor Cyan
}

# Hacer dump de la base de datos
Write-Host "Exportando base de datos a: $backupFile" -ForegroundColor Yellow

$env:PGPASSWORD = "20murillo"

& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" `
    -h localhost `
    -U postgres `
    -d cocteles_db `
    -F p `
    --verbose `
    -f $backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Backup completado exitosamente" -ForegroundColor Green
    Write-Host "Archivo: $backupFile" -ForegroundColor Cyan
    
    $fileSize = (Get-Item $backupFile).Length / 1KB
    Write-Host "Tamaño: $([Math]::Round($fileSize, 2)) KB" -ForegroundColor Cyan
    
    # Mostrar primeras líneas del backup
    Write-Host "`nContenido del archivo:" -ForegroundColor Yellow
    Get-Content $backupFile -Head 10
} else {
    Write-Host "[ERROR] Error al hacer el backup" -ForegroundColor Red
    Write-Host "Codigo de error: $LASTEXITCODE" -ForegroundColor Red
}

Remove-Item Env:PGPASSWORD
