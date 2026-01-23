# 🧪 Como Testar a API

## ✅ Rotas Disponíveis

### Health Check
```
GET http://localhost:3000/health
```
**Resposta esperada:**
```json
{
  "success": true,
  "message": "API está funcionando",
  "timestamp": "2024-..."
}
```

### Autenticação

#### 1. Registrar Usuário
```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "teste@teste.com",
  "password": "123456",
  "name": "Teste User",
  "partnerEmail": "parceiro@teste.com" // opcional
}
```

#### 2. Login
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "teste@teste.com",
  "password": "123456"
}
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "teste@teste.com",
      "name": "Teste User",
      ...
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 3600
    }
  }
}
```

#### 3. Obter Usuário Atual
```
GET http://localhost:3000/api/auth/me
Authorization: Bearer <access_token>
```

#### 4. Renovar Token
```
POST http://localhost:3000/api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

### Estados Emocionais

#### 1. Obter Estado Atual
```
GET http://localhost:3000/api/moods/current/:userId
Authorization: Bearer <access_token>
```

#### 2. Obter Estado do Parceiro
```
GET http://localhost:3000/api/moods/partner/:partnerId
Authorization: Bearer <access_token>
```

#### 3. Atualizar Estado
```
POST http://localhost:3000/api/moods
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "type": "happy",
  "message": "Estou muito feliz hoje!",
  "location": {
    "latitude": -23.5505,
    "longitude": -46.6333
  }
}
```

#### 4. Histórico
```
GET http://localhost:3000/api/moods/history/:userId?limit=10
Authorization: Bearer <access_token>
```

## 🌐 Testando no Navegador

O navegador só pode testar rotas **GET**. Para rotas **POST**, use:

### Opção 1: Postman / Insomnia
- Baixe: https://www.postman.com/downloads/
- Importe as rotas acima

### Opção 2: curl (Terminal)
```bash
# Registrar
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","password":"123456","name":"Teste"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","password":"123456"}'
```

### Opção 3: Thunder Client (VS Code)
- Instale a extensão Thunder Client no VS Code
- Crie requisições HTTP diretamente no editor

## ⚠️ Importante

- `/api` não é uma rota - é um **prefixo**
- Rotas reais: `/api/auth/...` e `/api/moods/...`
- Rotas protegidas precisam do header: `Authorization: Bearer <token>`
