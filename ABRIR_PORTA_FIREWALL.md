# 🔥 Abrir Porta no Firewall do Windows

## Método 1: PowerShell (Recomendado - Mais Rápido)

Execute como **Administrador**:

```powershell
# Abrir porta 3000
New-NetFirewallRule -DisplayName "Mood Sharing API - Porta 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Se usar porta 3001 também
New-NetFirewallRule -DisplayName "Mood Sharing API - Porta 3001" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

## Método 2: Interface Gráfica

1. **Abra o Firewall:**
   - Pressione `Win + R`
   - Digite: `wf.msc`
   - Pressione Enter

2. **Crie Nova Regra:**
   - Clique em "Regras de Entrada" no painel esquerdo
   - Clique em "Nova Regra..." no painel direito

3. **Configure a Regra:**
   - Escolha "Porta" → Próximo
   - Escolha "TCP" → Próximo
   - Escolha "Portas locais específicas"
   - Digite: `3000` (ou `3000,3001` se usar ambas) → Próximo
   - Escolha "Permitir a conexão" → Próximo
   - Marque todas as opções (Domínio, Privada, Pública) → Próximo
   - Nome: "Mood Sharing API" → Concluir

## Método 3: Comando Rápido (CMD como Administrador)

```cmd
netsh advfirewall firewall add rule name="Mood Sharing API" dir=in action=allow protocol=TCP localport=3000
```

## ✅ Verificar se Funcionou

Depois de abrir a porta, teste:

1. **No celular (usando dados móveis ou outra rede WiFi):**
   ```
   http://191.37.43.39:3000/health
   ```

2. **Deve retornar:**
   ```json
   {
     "success": true,
     "message": "API está funcionando",
     "timestamp": "..."
   }
   ```

## ⚠️ Importante

- Se ainda não funcionar, pode ser necessário configurar **Port Forwarding** no roteador
- O IP `191.37.43.39` precisa ser seu IP público atual
- Verifique se o IP não mudou: https://whatismyipaddress.com
