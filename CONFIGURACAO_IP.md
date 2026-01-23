# 🌐 Configuração para Acesso Externo

## ✅ Configurações Aplicadas

- **IP Configurado:** `191.37.43.39`
- **API URL:** `http://191.37.43.39:3000/api`
- **Backend configurado** para aceitar conexões externas

## 🔧 Configurações Necessárias

### 1. Firewall do Windows

Abra a porta 3000 no firewall:

**Opção A - Via PowerShell (como Administrador):**
```powershell
New-NetFirewallRule -DisplayName "Mood Sharing API" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

**Opção B - Via Interface Gráfica:**
1. Abra "Firewall do Windows Defender"
2. Clique em "Configurações avançadas"
3. Clique em "Regras de Entrada" → "Nova Regra"
4. Escolha "Porta" → Próximo
5. TCP → Porta específica: `3000` → Próximo
6. Permitir conexão → Próximo
7. Marque todas as opções → Próximo
8. Nome: "Mood Sharing API" → Concluir

### 2. Port Forwarding no Roteador (se necessário)

Se você estiver atrás de um roteador:

1. Acesse o painel do roteador (geralmente `192.168.1.1` ou `192.168.0.1`)
2. Vá em "Port Forwarding" ou "Virtual Server"
3. Adicione uma regra:
   - **Porta Externa:** 3000
   - **Porta Interna:** 3000
   - **IP Interno:** IP da sua máquina na rede local (ex: `192.168.1.100`)
   - **Protocolo:** TCP
4. Salve e reinicie o roteador

### 3. Verificar se o Backend Está Rodando

```bash
cd backend
npm run dev
```

Você deve ver:
```
🚀 Servidor rodando na porta 3000
📍 Health check: http://localhost:3000/health
📡 API: http://localhost:3000/api
🌐 Acessível externamente em: http://191.37.43.39:3000/api
```

### 4. Testar a Conexão

No celular (conectado em outra rede ou dados móveis), abra o navegador e acesse:
```
http://191.37.43.39:3000/health
```

Deve retornar:
```json
{
  "success": true,
  "message": "API está funcionando",
  "timestamp": "..."
}
```

### 5. Reiniciar o Expo

```bash
npx expo start --clear
```

## ⚠️ Importante

- **Segurança:** Esta configuração expõe sua API publicamente. Use apenas para desenvolvimento/testes.
- **Produção:** Em produção, use HTTPS e autenticação adequada.
- **IP Dinâmico:** Se seu IP mudar, atualize o `app.json` novamente.

## 🧪 Testando

1. Backend rodando ✅
2. Porta 3000 aberta no firewall ✅
3. Port forwarding configurado (se necessário) ✅
4. App configurado com IP ✅
5. Teste no celular escaneando o QR code ✅
