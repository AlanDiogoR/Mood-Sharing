# 🚀 Início Rápido - Backend

## Passos para rodar o backend:

1. **Instale as dependências:**
```bash
cd backend
npm install
```

2. **O arquivo `.env` já está criado** com suas configurações do MongoDB.

3. **Inicie o servidor:**
```bash
npm run dev
```

4. **Verifique se está funcionando:**
Abra no navegador: http://localhost:3000/health

Você deve ver:
```json
{
  "success": true,
  "message": "API está funcionando",
  "timestamp": "..."
}
```

## ✅ Pronto!

O backend está rodando na porta 3000 e pronto para receber requisições do app.

## 📱 Configuração do App

O arquivo `.env` do projeto principal já está configurado para apontar para:
```
API_BASE_URL=http://localhost:3000/api
```

**IMPORTANTE:** Se você estiver testando no celular físico:
- Substitua `localhost` pelo IP da sua máquina na rede WiFi
- Exemplo: `http://192.168.1.100:3000/api`
- Descubra seu IP com: `ipconfig` (Windows) ou `ifconfig` (Mac/Linux)

## 🧪 Teste Rápido

```bash
# Registrar um usuário
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"teste@teste.com\",\"password\":\"123456\",\"name\":\"Teste\"}"
```
