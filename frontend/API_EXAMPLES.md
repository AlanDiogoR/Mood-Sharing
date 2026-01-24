# Exemplos de API para Backend

Este documento descreve os endpoints que o backend deve implementar para que o app funcione corretamente.

## Base URL

```
mongodb+srv://<alanser>:<vEdWjEcGmghTp>@cluster0.nvlz1pz.mongodb.net/?appName=Cluster0
```

## Autenticação

Todos os endpoints protegidos requerem um token JWT no header:
```
Authorization: Bearer <access_token>
```

## Endpoints

### Autenticação

#### POST /auth/register
Registra um novo usuário.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Nome do Usuário",
  "partnerEmail": "partner@example.com" // opcional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "Nome do Usuário",
      "partnerId": "partner_id",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token",
      "expiresIn": 3600
    }
  }
}
```

#### POST /auth/login
Faz login do usuário.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** (mesmo formato do register)

#### POST /auth/refresh
Renova o access token usando o refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token",
    "expiresIn": 3600
  }
}
```

#### POST /auth/logout
Faz logout do usuário (invalida tokens).

**Response:**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

#### GET /auth/me
Retorna informações do usuário autenticado.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "Nome do Usuário",
    "partnerId": "partner_id",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /auth/link-partner
Vincula um parceiro ao usuário.

**Request Body:**
```json
{
  "partnerEmail": "partner@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "Nome do Usuário",
    "partnerId": "partner_id",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Estados Emocionais (Moods)

#### GET /moods/current/:userId
Retorna o estado emocional atual do usuário.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "mood_id",
    "userId": "user_id",
    "type": "happy",
    "emoji": "😊",
    "message": "Estou muito feliz hoje!",
    "location": {
      "latitude": -23.5505,
      "longitude": -46.6333
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /moods/partner/:partnerId
Retorna o estado emocional atual do parceiro.

**Response:** (mesmo formato do current)

#### POST /moods
Cria ou atualiza o estado emocional do usuário.

**Request Body:**
```json
{
  "type": "happy",
  "message": "Estou muito feliz hoje!", // opcional
  "location": { // opcional
    "latitude": -23.5505,
    "longitude": -46.6333
  }
}
```

**Response:** (mesmo formato do current)

#### POST /moods/with-proximity
Atualiza o estado emocional considerando proximidade.

**Request Body:**
```json
{
  "type": "happy",
  "location": {
    "latitude": -23.5505,
    "longitude": -46.6333
  },
  "partnerLocation": {
    "latitude": -23.5510,
    "longitude": -46.6338
  }
}
```

**Response:** (mesmo formato do current)

#### GET /moods/history/:userId?limit=10
Retorna o histórico de estados emocionais.

**Query Parameters:**
- `limit` (opcional): Número máximo de resultados (padrão: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "mood_id",
      "userId": "user_id",
      "type": "happy",
      "emoji": "😊",
      "message": "Estou muito feliz hoje!",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Códigos de Erro

### 400 Bad Request
Requisição inválida (dados faltando ou incorretos).

### 401 Unauthorized
Token inválido ou expirado.

### 404 Not Found
Recurso não encontrado.

### 500 Internal Server Error
Erro interno do servidor.

## Estrutura de Erro

```json
{
  "success": false,
  "error": "Mensagem de erro descritiva",
  "message": "Detalhes adicionais (opcional)"
}
```

## Tipos de Estado Emocional (MoodType)

- `happy` - Feliz
- `sad` - Triste
- `anxious` - Ansioso
- `calm` - Calmo
- `excited` - Empolgado
- `tired` - Cansado
- `angry` - Irritado
- `love` - Apaixonado

## Notas de Implementação

1. **Segurança:**
   - Sempre valide e sanitize dados de entrada
   - Use HTTPS em produção
   - Hash senhas com bcrypt ou similar
   - Valide tokens JWT em todos os endpoints protegidos

2. **MongoDB:**
   - Use índices para `userId`, `partnerId` e `createdAt`
   - Considere TTL indexes para dados antigos de localização

3. **Performance:**
   - Cache estados emocionais recentes quando possível
   - Use paginação para histórico
   - Otimize queries de proximidade

4. **Notificações:**
   - Envie notificações push quando um parceiro atualiza seu estado
   - Envie notificações quando a proximidade é detectada
