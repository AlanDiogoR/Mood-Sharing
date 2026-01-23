# 🔧 Configurar Port Forwarding no Roteador

## 📋 Informações Necessárias

- **IP Público:** `191.37.43.39`
- **IP Local da Máquina:** `192.168.0.16`
- **Porta:** `3001`
- **Protocolo:** `TCP`

## 🚀 Passo a Passo

### 1. Acesse o Painel do Roteador

1. Abra o navegador
2. Acesse o IP do roteador (geralmente):
   - `192.168.0.1` (mais comum)
   - `192.168.1.1`
   - `10.0.0.1`
   - Ou verifique no seu roteador físico

3. Faça login (geralmente `admin/admin` ou `admin/senha`)

### 2. Encontre Port Forwarding

Procure por uma das seguintes opções:
- **Port Forwarding**
- **Virtual Server**
- **NAT Forwarding**
- **Port Mapping**
- **Aplicações e Jogos**

### 3. Configure a Regra

Crie uma nova regra com:

| Campo | Valor |
|-------|-------|
| **Nome/Descrição** | Mood Sharing API |
| **Porta Externa** | 3001 |
| **Porta Interna** | 3001 |
| **IP Interno** | 192.168.0.16 |
| **Protocolo** | TCP (ou Both/Ambos) |
| **Status** | Habilitado/Ativado |

### 4. Salve e Aplique

- Clique em "Salvar" ou "Aplicar"
- Aguarde o roteador reiniciar (pode levar 1-2 minutos)

## ✅ Verificar se Funcionou

Depois de configurar, teste:

1. **No celular (usando dados móveis ou outra rede WiFi):**
   ```
   http://191.37.43.39:3001/health
   ```

2. **Deve retornar:**
   ```json
   {
     "success": true,
     "message": "API está funcionando",
     "timestamp": "..."
   }
   ```

## 🔍 Descobrir o IP do Roteador

Se não souber o IP do roteador:

**Windows:**
```cmd
ipconfig
```
Procure por "Gateway Padrão" (ex: `192.168.0.1`)

**Ou execute:**
```cmd
route print | findstr "0.0.0.0"
```

## ⚠️ Problemas Comuns

### "Não consigo acessar o painel do roteador"
- Verifique se está na mesma rede WiFi
- Tente `http://192.168.0.1` ou `http://192.168.1.1`
- Verifique o manual do roteador

### "Port forwarding não funciona"
- Certifique-se de que o firewall do Windows está permitindo a porta 3001
- Verifique se o backend está rodando
- Teste primeiro localmente: `http://localhost:3001/health`

### "IP mudou"
- Se seu IP público mudar, atualize o `app.json` novamente
- Verifique seu IP atual: https://whatismyipaddress.com

## 📝 Nota de Segurança

⚠️ **Importante:** Esta configuração expõe sua API publicamente. Use apenas para desenvolvimento/testes. Em produção, use HTTPS e autenticação adequada.
