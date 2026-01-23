# Script para abrir porta 3001 no Firewall do Windows
# Execute como Administrador

Write-Host "Abrindo porta 3001 no Firewall..." -ForegroundColor Yellow

try {
    # Remove regra antiga se existir
    Remove-NetFirewallRule -DisplayName "Mood Sharing API - Porta 3001" -ErrorAction SilentlyContinue
    
    # Cria nova regra
    New-NetFirewallRule -DisplayName "Mood Sharing API - Porta 3001" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
    
    Write-Host "✅ Porta 3001 aberta com sucesso!" -ForegroundColor Green
    Write-Host "`nTeste acessando: http://191.37.43.39:3001/health" -ForegroundColor Cyan
    Write-Host "`n⚠️  IMPORTANTE:" -ForegroundColor Yellow
    Write-Host "Se ainda não funcionar, configure Port Forwarding no roteador:" -ForegroundColor White
    Write-Host "  - Porta Externa: 3001" -ForegroundColor White
    Write-Host "  - Porta Interna: 3001" -ForegroundColor White
    Write-Host "  - IP Interno: [IP da sua máquina na rede local]" -ForegroundColor White
} catch {
    Write-Host "❌ Erro ao abrir porta. Execute como Administrador!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
