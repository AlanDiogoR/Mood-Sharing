# Script para limpar e reinstalar o projeto Expo
# Execute na pasta raiz do projeto

Write-Host "🧹 Limpando projeto..." -ForegroundColor Yellow

# Para processos do Expo/Node se estiverem rodando
Write-Host "Parando processos..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.Path -like "*Teste*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Remove pastas e arquivos de cache
Write-Host "Removendo cache..." -ForegroundColor Cyan
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .metro -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Force yarn.lock -ErrorAction SilentlyContinue

Write-Host "✅ Limpeza concluída!" -ForegroundColor Green
Write-Host "`n📦 Reinstalando dependências..." -ForegroundColor Yellow

# Reinstala dependências
npm install

Write-Host "`n✅ Reinstalação concluída!" -ForegroundColor Green
Write-Host "`n🚀 Agora execute: npx expo start --clear" -ForegroundColor Cyan
