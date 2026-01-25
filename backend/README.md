# Backend API - Mood Sharing

API REST desenvolvida com Node.js, Express, TypeScript e MongoDB para o aplicativo Mood Sharing.

## 🚀 Funcionalidades

- ✅ Autenticação JWT (login, registro, refresh token)
- ✅ Gerenciamento de estados emocionais
- ✅ Cálculo de proximidade entre usuários
- ✅ Atualização automática quando parceiros estão próximos (< 1km)
- ✅ Histórico de estados emocionais
- ✅ Vinculação de parceiros

## 📋 Pré-requisitos

- Node.js >= 16
- MongoDB (local ou Atlas)
- npm ou yarn

## 🛠️ Instalação

1. **Instale as dependências:**
```bash
cd backend
npm install
```

2. **Configure as variáveis de ambiente:**
Crie um arquivo `.env` na pasta `backend`:

```env
PORT=3000
MONGODB_URI=mongodb+srv://alandiogor_db_user:vEdWjEc6o4GmghTp@cluster0.nvlz1pz.mongodb.net/mood_sharing_db?retryWrites=true&w=majority
JWT_SECRET=sua-chave-secreta-super-segura-aqui
JWT_REFRESH_SECRET=sua-chave-secreta-refresh-aqui
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:19006,http://localhost:8081
NODE_ENV=development
```

3. **Execute o servidor:**
```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm run build
npm start
```

## ☁️ Deploy na Netlify (Functions)

Este backend é um servidor Express. Para rodar na Netlify gratuita, ele é exposto como Function serverless.

### Passos
1. **Crie um site na Netlify** apontando para este repositório.
2. **Build settings** (já configurado no `netlify.toml`):
   - Build command: `npm --prefix backend install && npm --prefix backend run build`
   - Functions directory: `netlify/functions`
3. **Variáveis de ambiente** (Site settings → Environment variables):
   - `MONGODB_URI` (MongoDB Atlas)
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `JWT_EXPIRES_IN`
   - `JWT_REFRESH_EXPIRES_IN`
   - `CORS_ORIGINS` (ex: `https://seu-site.netlify.app,http://localhost:19006`)
   - `NODE_ENV=production`
   - Opcional para Firebase: `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`

### URL base da API
As rotas ficam sob o prefixo da Function:
```
https://<site>.netlify.app/.netlify/functions/api
```
Exemplos:
- Health check: `/.netlify/functions/api/health`
- Login: `/.netlify/functions/api/auth/login`

## 📡 Endpoints da API

### Autenticação

#### POST `/api/auth/register`
Registra um novo usuário.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Nome do Usuário",
  "partnerEmail": "partner@example.com" // opcional
}
```

#### POST `/api/auth/login`
Faz login do usuário.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST `/api/auth/refresh`
Renova o access token.

**Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

#### GET `/api/auth/me`
Retorna informações do usuário autenticado.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/api/auth/link-partner`
Vincula um parceiro ao usuário.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "partnerEmail": "partner@example.com"
}
```

### Estados Emocionais

#### GET `/api/moods/current/:userId`
Retorna o estado emocional atual do usuário.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### GET `/api/moods/partner/:partnerId`
Retorna o estado emocional do parceiro.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/api/moods`
Cria ou atualiza o estado emocional.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "type": "happy",
  "message": "Estou muito feliz hoje!",
  "location": {
    "latitude": -23.5505,
    "longitude": -46.6333
  }
}
```

#### POST `/api/moods/with-proximity`
Atualiza o estado considerando proximidade.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body:**
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

#### GET `/api/moods/history/:userId?limit=10`
Retorna o histórico de estados emocionais.

**Headers:**
```
Authorization: Bearer <access_token>
```

## 🔒 Segurança

- Senhas são hasheadas com bcrypt
- Tokens JWT com expiração
- Middleware de autenticação em rotas protegidas
- Validação de dados de entrada
- CORS configurado
- Helmet para segurança HTTP

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts       # Conexão MongoDB
│   ├── controllers/
│   │   ├── authController.ts # Lógica de autenticação
│   │   └── moodController.ts # Lógica de estados emocionais
│   ├── middleware/
│   │   └── auth.ts           # Middleware de autenticação JWT
│   ├── models/
│   │   ├── User.ts           # Modelo de usuário
│   │   └── Mood.ts           # Modelo de estado emocional
│   ├── routes/
│   │   ├── authRoutes.ts     # Rotas de autenticação
│   │   └── moodRoutes.ts     # Rotas de estados emocionais
│   ├── utils/
│   │   ├── jwt.ts            # Funções JWT
│   │   ├── distance.ts       # Cálculo de distância
│   │   └── moodEmojis.ts     # Emojis dos estados
│   └── server.ts             # Servidor Express
├── .env                      # Variáveis de ambiente
├── package.json
├── tsconfig.json
└── README.md
```

## 🧪 Testando a API

Você pode testar os endpoints usando:

- **Postman**
- **Insomnia**
- **curl**
- **Thunder Client** (VS Code)

### Exemplo com curl:

```bash
# Health check
curl http://localhost:3000/health

# Registrar usuário
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

## 🔧 Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | `3000` |
| `MONGODB_URI` | String de conexão MongoDB | - |
| `JWT_SECRET` | Chave secreta para JWT | - |
| `JWT_REFRESH_SECRET` | Chave secreta para refresh token | - |
| `JWT_EXPIRES_IN` | Tempo de expiração do token | `1h` |
| `JWT_REFRESH_EXPIRES_IN` | Tempo de expiração do refresh | `7d` |
| `CORS_ORIGINS` | Origens permitidas (separadas por vírgula) | - |
| `NODE_ENV` | Ambiente (development/production) | `development` |

## 📝 Notas

- O MongoDB URI já está configurado com sua string de conexão
- Em produção, use variáveis de ambiente seguras
- Os tokens JWT expiram em 1 hora (access) e 7 dias (refresh)
- A proximidade é calculada usando a fórmula de Haversine
- Quando dois usuários estão a menos de 1km, ambos são automaticamente atualizados para "feliz"

## 🐛 Troubleshooting

### Erro de conexão com MongoDB
- Verifique se a string de conexão está correta
- Verifique se o IP está liberado no MongoDB Atlas (se usar Atlas)
- Verifique sua conexão com a internet

### Erro de CORS
- Adicione a URL do seu app Expo nas `CORS_ORIGINS`
- Para desenvolvimento local, use: `http://localhost:19006`

### Erro de autenticação
- Verifique se está enviando o token no header: `Authorization: Bearer <token>`
- Verifique se o token não expirou

---

Desenvolvido com ❤️ para o Mood Sharing App
