# Mood Sharing

Aplicativo mobile (React Native + Expo) para casais compartilharem o estado emocional em tempo real. O humor do parceiro aparece no app e num widget Android, e o status muda automaticamente para "feliz" quando os dois estão a menos de 1 km de distância.

O repositório reúne o app (`frontend/`) e a API REST (`backend/`) em Node.js + Express + MongoDB, preparada para rodar como Netlify Function.

## Stack

| Camada | Tecnologias |
|---|---|
| **App mobile** | React Native 0.81, Expo SDK 54 (dev client), React 19, TypeScript, React Navigation (stack + bottom tabs), Axios, date-fns, Reanimated, Gesture Handler |
| **Recursos nativos** | expo-location, expo-local-authentication (biometria), expo-notifications, expo-secure-store, expo-image-picker, Firebase Messaging, widget Android nativo em Kotlin |
| **Backend** | Node.js, Express 4, TypeScript, Mongoose 8 (MongoDB), JWT (access + refresh token), bcryptjs, express-validator, Multer |
| **Segurança da API** | Helmet, express-rate-limit, express-mongo-sanitize, CORS por lista de origens |
| **Notificações** | Expo Server SDK e Firebase Admin |
| **Deploy da API** | serverless-http + Netlify Functions, Netlify Blobs para arquivos |
| **Qualidade** | ESLint, Prettier, Jest, `tsc --noEmit` |

## Funcionalidades

Verificadas nas rotas da API (`backend/src/routes`) e nas telas do app (`frontend/src/screens`):

- **Autenticação:** cadastro, login, refresh e logout com JWT; troca e verificação de senha; tokens guardados no `expo-secure-store`
- **Vínculo de parceiro com consentimento:** enviar, aceitar, recusar e cancelar convites, e desfazer o vínculo
- **Estados emocionais:** 9 humores com emoji, humor atual do usuário e do parceiro e histórico
- **Detecção de proximidade:** o app envia a localização junto com o humor (`/moods/with-proximity`) e a API calcula a distância; abaixo de 1 km, o status vira "feliz" e o parceiro recebe uma notificação
- **Notificações push:** avisos de mudança de humor, de proximidade e de convites de parceiro
- **Tela de bloqueio com biometria** (digital/Face ID) e **widget Android** com o humor do parceiro
- **Filmes e séries do casal:** lista com cadastro, edição, exclusão, reordenação por arrastar e aba de concluídos
- **Notas compartilhadas** (CRUD) e **fotos do parceiro** (upload e foto mais recente)
- **Encontros do casal:** registro de encontros e resumo semanal na tela inicial
- **Área especial:** resumo semanal de treinos, metas e telas de treino e dieta
- **Perfil e privacidade:** edição de perfil e foto, exportação dos próprios dados (`GET /users/me/export`) e exclusão de conta; política de privacidade e termos em `docs/`

## Estrutura

```
Mood-Sharing/
├── frontend/          # App Expo / React Native
│   ├── src/screens/   # Login, Home, LockScreen, Media, Notes, SpecialArea...
│   ├── src/services/  # Clientes da API, localização, notificações, widget
│   ├── src/store/     # Contexts (auth, mood, theme, premium)
│   └── android/       # Projeto nativo, incluindo o widget em Kotlin
├── backend/           # API Express + Mongoose
│   └── src/           # routes, controllers, models, middleware, services
├── netlify/           # Entry point da Netlify Function
└── docs/              # Política de privacidade e termos de uso
```

## Como rodar localmente

### Pré-requisitos

- Node.js 18+
- MongoDB (local ou na nuvem)
- Android Studio (emulador ou dispositivo) para o app

### Backend

```bash
cd backend
cp .env.example .env   # preencha as variáveis
npm install
npm run dev            # tsx watch, porta padrão 3000
```

Build de produção: `npm run build && npm start`. Health check em `GET /health`.

Variáveis (ver `backend/.env.example`): `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `CORS_ORIGINS`, `PORT`, `NODE_ENV` e, para upload no deploy serverless, `NETLIFY_BLOBS_SITE_ID` e `NETLIFY_BLOBS_TOKEN`. Em produção, `MONGODB_URI` e os segredos JWT são obrigatórios.

### App mobile

```bash
cd frontend
cp .env.example .env   # aponte API_BASE_URL para a sua API
npm install
npm run android        # expo run:android (build com dev client)
npm start              # inicia o Metro bundler
```

Variáveis de build (ver `frontend/.env.example`, lidas por `app.config.js`): `API_BASE_URL`, `EXPO_PROJECT_ID`, `FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_MESSAGING_SENDER_ID`.

### Scripts úteis (frontend)

| Script | Descrição |
|---|---|
| `npm run lint` / `npm run lint:fix` | ESLint |
| `npm run format` | Prettier |
| `npm run type-check` | Checagem de tipos TypeScript |
| `npm test` | Jest |

## Permissões do app

- **Localização:** para detectar a proximidade com o parceiro
- **Biometria:** para desbloquear a tela de bloqueio do app
- **Notificações:** para os avisos de humor, proximidade e convites

## Documentação complementar

- [Backend](backend/README.md): endpoints detalhados e deploy na Netlify
- [Política de privacidade](docs/PRIVACY_POLICY.md) · [Termos de uso](docs/TERMS_OF_SERVICE.md)

## Autor

Alan Diogo · [github.com/AlanDiogoR](https://github.com/AlanDiogoR)
