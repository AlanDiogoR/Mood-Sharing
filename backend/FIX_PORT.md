# 🔧 Solução: Porta 3000 já em uso

## Opção 1: Parar o Processo que está usando a porta

### Windows PowerShell (como Administrador):
```powershell
# Encontrar o processo
netstat -ano | findstr :3000

# Parar o processo (substitua PID pelo número encontrado)
taskkill /PID <PID> /F
```

### Ou use este comando direto:
```powershell
# Para o processo na porta 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

## Opção 2: Mudar a Porta do Backend

Se você não quiser parar o outro processo, pode mudar a porta:

1. **Edite `backend/.env`:**
```env
PORT=3001
```

2. **Atualize `app.json`:**
```json
"API_BASE_URL": "http://191.37.43.39:3001/api"
```

3. **Reinicie o backend**

## Opção 3: Usar uma Porta Diferente Temporariamente

Você pode usar qualquer porta disponível (3001, 3002, 8080, etc.)
