# Script para abrir porta 3000 no Firewall do Windows
# Execute como Administrador

Write-Host "Abrindo porta 3000 no Firewall..." -ForegroundColor Yellow

try {
    # Remove regra antiga se existir
    Remove-NetFirewallRule -DisplayName "Mood Sharing API - Porta 3000" -ErrorAction SilentlyContinue
    
    # Cria nova regra
    New-NetFirewallRule -DisplayName "Mood Sharing API - Porta 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
    
    Write-Host "✅ Porta 3000 aberta com sucesso!" -ForegroundColor Green
    Write-Host "`nTeste acessando: http://191.37.43.39:3000/health" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Erro ao abrir porta. Execute como Administrador!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
