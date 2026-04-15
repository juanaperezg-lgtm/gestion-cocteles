# Script para configurar PostgreSQL para conexiones remotas
# EJECUTAR COMO ADMINISTRADOR

Write-Host "Configurando PostgreSQL para conexiones remotas..." -ForegroundColor Green

# Ruta de archivos de configuración
$pgDataPath = "C:\Program Files\PostgreSQL\18\data"
$pgHbaPath = "$pgDataPath\pg_hba.conf"

# Verificar que el archivo existe
if (-not (Test-Path $pgHbaPath)) {
    Write-Host "ERROR: No se encontró $pgHbaPath" -ForegroundColor Red
    exit 1
}

# Crear backup
Write-Host "1. Creando backup de pg_hba.conf..." -ForegroundColor Yellow
Copy-Item $pgHbaPath "$pgHbaPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')" -Force
Write-Host "   ✓ Backup creado" -ForegroundColor Green

# Verificar si ya existe la regla
$content = Get-Content $pgHbaPath -Raw
if ($content -like "*Allow connections from remote machines*") {
    Write-Host "2. La regla de conexiones remotas ya existe" -ForegroundColor Cyan
} else {
    Write-Host "2. Agregando regla para conexiones remotas..." -ForegroundColor Yellow
    Add-Content -Path $pgHbaPath -Value "`n# Allow connections from remote machines`nhost    all             all             0.0.0.0/0               scram-sha-256"
    Write-Host "   ✓ Regla agregada" -ForegroundColor Green
}

# Reiniciar el servicio
Write-Host "3. Reiniciando PostgreSQL..." -ForegroundColor Yellow
try {
    Restart-Service postgresql-x64-18 -Force
    Write-Host "   ✓ PostgreSQL reiniciado" -ForegroundColor Green
    Start-Sleep -Seconds 2
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Verificar estado
$service = Get-Service postgresql-x64-18
Write-Host "4. Estado actual del servicio:" -ForegroundColor Yellow
Write-Host "   Estado: $($service.Status)" -ForegroundColor Cyan
Write-Host "   Tipo de inicio: $($service.StartType)" -ForegroundColor Cyan

Write-Host "`n✓ CONFIGURACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "`nAhora puedes conectarte desde otras máquinas usando:" -ForegroundColor Cyan
Write-Host "   Host: <IP_DE_ESTA_MÁQUINA>" -ForegroundColor White
Write-Host "   Puerto: 5432" -ForegroundColor White
Write-Host "   Usuario: postgres" -ForegroundColor White
Write-Host "   Contraseña: 20murillo" -ForegroundColor White
Write-Host "   Base de datos: cocteles_db" -ForegroundColor White

# Mostrar IP local
Write-Host "`nTu dirección IP local:" -ForegroundColor Cyan
$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"}
foreach ($ip in $ips) {
    Write-Host "   $($ip.IPAddress)" -ForegroundColor White
}
