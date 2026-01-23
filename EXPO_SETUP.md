# Guia de Configuração para Expo

Este guia explica como executar o projeto usando Expo.

## 📋 Pré-requisitos

1. **Node.js** (versão 16 ou superior)
2. **npm** ou **yarn**
3. **Expo CLI** (instalado globalmente)
   ```bash
   npm install -g expo-cli
   ```
   Ou use `npx expo` sem instalar globalmente.

4. **Expo Go** no seu celular:
   - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS](https://apps.apple.com/app/expo-go/id982107779)

## 🚀 Instalação e Execução

### 1. Instalar Dependências

```bash
npm install
# ou
yarn install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
API_BASE_URL=https://your-api-url.com/api
MONGODB_URI=mongodb+srv://<alandiogor_db_user>:<vEdWjEc6o4GmghTp>@cluster0.nvlz1pz.mongodb.net/?appName=Cluster0
EXPO_PROJECT_ID=your-expo-project-id
```

### 3. Executar o App

```bash
npm start
# ou
yarn start
# ou
npx expo start
```

Isso abrirá o Expo Dev Tools no navegador. Você pode:

- **Pressionar `a`** para abrir no Android emulador
- **Pressionar `i`** para abrir no iOS simulador
- **Escanear o QR code** com o Expo Go no seu celular

### 4. Executar em Plataforma Específica

```bash
# Android
npm run android
# ou
npx expo start --android

# iOS (apenas macOS)
npm run ios
# ou
npx expo start --ios

# Web
npm run web
# ou
npx expo start --web
```

## 📱 Usando no Celular

1. **Instale o Expo Go** no seu celular
2. **Execute `npm start`** no terminal
3. **Escaneie o QR code** que aparece no terminal ou navegador
4. O app será carregado no Expo Go

## 🔧 Configurações Importantes

### Permissões

As permissões já estão configuradas no `app.json`:

- **Localização**: Configurada para foreground e background
- **Biometria**: Configurada para Face ID/Touch ID
- **Notificações**: Configuradas automaticamente

### Expo Project ID

Para usar notificações push, você precisa de um Expo Project ID:

1. Crie uma conta no [Expo](https://expo.dev)
2. Execute: `npx expo login`
3. Execute: `npx expo init` (se necessário) ou use `eas init`
4. O Project ID será gerado automaticamente

Ou configure manualmente no `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "seu-project-id-aqui"
      }
    }
  }
}
```

## 📦 Diferenças do React Native CLI

### Bibliotecas Substituídas

- ✅ `react-native-biometrics` → `expo-local-authentication`
- ✅ `@react-native-community/geolocation` → `expo-location`
- ✅ `react-native-background-geolocation` → `expo-location` (com background permissions)
- ✅ `@react-native-firebase/messaging` → `expo-notifications`

### Vantagens do Expo

- ✅ Desenvolvimento mais rápido
- ✅ Hot reload nativo
- ✅ Teste fácil no celular físico
- ✅ Over-the-air updates (com EAS)
- ✅ Builds simplificados (com EAS Build)

### Limitações

- ⚠️ Algumas bibliotecas nativas podem não estar disponíveis
- ⚠️ Para builds customizados, precisa usar EAS Build
- ⚠️ Background location pode ter limitações

## 🛠️ Troubleshooting

### Erro: "Unable to resolve module expo"

```bash
npm install expo
# ou
yarn add expo
```

### Erro: "Expo CLI not found"

```bash
npm install -g expo-cli
# ou use npx expo
```

### Erro de Permissões

Certifique-se de que as permissões estão configuradas no `app.json` e que você concedeu as permissões no dispositivo.

### Limpar Cache

```bash
npx expo start --clear
```

### Resetar Metro Bundler

```bash
npm start -- --reset-cache
```

## 📝 Próximos Passos

1. **Desenvolvimento**: Use `npm start` e teste no Expo Go
2. **Build de Desenvolvimento**: Use `eas build --profile development`
3. **Build de Produção**: Use `eas build --profile production`
4. **Publicar**: Use `eas update` para atualizações OTA

## 🔗 Links Úteis

- [Documentação Expo](https://docs.expo.dev/)
- [Expo Go](https://expo.dev/client)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Update](https://docs.expo.dev/eas-update/introduction/)

## 💡 Dicas

- Use `npx expo start --tunnel` se estiver em uma rede diferente do seu celular
- Use `npx expo start --localhost` para forçar conexão local
- Pressione `r` no terminal para recarregar o app
- Pressione `m` para abrir o menu de desenvolvedor

---

Agora você está pronto para desenvolver com Expo! 🚀
